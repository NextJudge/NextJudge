package main

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

type PostCompetitionParticipantRequestBody struct {
	UserID uuid.UUID `json:"user_id"`
}

type RegisterEventRequestBody struct {
	InviteCode        string            `json:"invite_code,omitempty"`
	ParticipationMode ParticipationMode `json:"participation_mode,omitempty"`
}

func addParticipant(w http.ResponseWriter, r *http.Request) {
	reqData := new(PostCompetitionParticipantRequestBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		WriteError(w, http.StatusInternalServerError, "error reading request body", "500")
		return
	}

	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		WriteError(w, http.StatusInternalServerError, "error retrieving event", "500")
		return
	}
	if event == nil {
		logrus.Warn("event not found")
		WriteError(w, http.StatusNotFound, "event not found", "404")
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		WriteError(w, http.StatusInternalServerError, "JSON parse error", "500")
		return
	}

	user, err := db.GetUserByID(reqData.UserID)
	if err != nil {
		logrus.WithError(err).Error("error checking for user")
		WriteError(w, http.StatusInternalServerError, "error checking for user", "500")
		return
	}
	if user == nil {
		logrus.Warn("user not found")
		WriteError(w, http.StatusNotFound, "user not found", "404")
		return
	}

	// check if user is already a participant
	existingEventUser, err := db.GetEventUser(user.ID, eventId)
	if err != nil {
		logrus.WithError(err).Error("error checking existing participant")
		WriteError(w, http.StatusInternalServerError, "error checking existing participant", "500")
		return
	}
	if existingEventUser != nil {
		logrus.Warn("user is already a participant")
		WriteError(w, http.StatusConflict, "user is already a participant", "409")
		return
	}

	eventUser := EventUser{
		UserID:  user.ID,
		EventID: eventId,
	}

	_, err = db.CreateEventUser(&eventUser)
	if err != nil {
		logrus.WithError(err).Error("error creating event participant")
		WriteError(w, http.StatusInternalServerError, "error creating event participant", "500")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func registerForEvent(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusUnauthorized, "unauthorized", "401")
		return
	}

	userId := token.Id

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		WriteError(w, http.StatusInternalServerError, "error retrieving event", "500")
		return
	}
	if event == nil {
		logrus.Warn("event not found")
		WriteError(w, http.StatusNotFound, "event not found", "404")
		return
	}

	reqData := &RegisterEventRequestBody{}
	if r.Body != nil {
		reqBodyBytes, readErr := io.ReadAll(r.Body)
		if readErr != nil {
			logrus.WithError(readErr).Error("error reading request body")
			WriteError(w, http.StatusInternalServerError, "error reading request body", "500")
			return
		}
		if len(reqBodyBytes) > 0 {
			if unmarshalErr := json.Unmarshal(reqBodyBytes, reqData); unmarshalErr != nil {
				logrus.WithError(unmarshalErr).Error("JSON parse error")
				WriteError(w, http.StatusBadRequest, "JSON parse error", "400")
				return
			}
		}
	}

	now := time.Now()
	if !db.RegistrationOpen(event, now) {
		WriteError(w, http.StatusForbidden, "registration is closed", "403")
		return
	}

	limitReached, err := db.ParticipantLimitReached(event)
	if err != nil {
		logrus.WithError(err).Error("error checking participant limit")
		WriteError(w, http.StatusInternalServerError, "error checking participant limit", "500")
		return
	}
	if limitReached {
		WriteError(w, http.StatusConflict, "participant limit reached", "409")
		return
	}

	if event.Visibility == EventVisibilityPrivate && len(event.InviteCodeHash) > 0 {
		if !db.ValidateEventInviteCode(event, reqData.InviteCode) {
			WriteError(w, http.StatusForbidden, "invalid invite code", "403")
			return
		}
	}

	user, err := db.GetUserByID(userId)
	if err != nil {
		logrus.WithError(err).Error("error checking for user")
		WriteError(w, http.StatusInternalServerError, "error checking for user", "500")
		return
	}
	if user == nil {
		logrus.Warn("user not found")
		WriteError(w, http.StatusNotFound, "user not found", "404")
		return
	}

	existingEventUser, err := db.GetEventUser(user.ID, eventId)
	if err != nil {
		logrus.WithError(err).Error("error checking existing participant")
		WriteError(w, http.StatusInternalServerError, "error checking existing participant", "500")
		return
	}
	if existingEventUser != nil {
		logrus.Warn("user is already a participant")
		WriteError(w, http.StatusConflict, "user is already a participant", "409")
		return
	}

	participationMode := ParticipationOfficial
	if reqData.ParticipationMode != "" {
		switch reqData.ParticipationMode {
		case ParticipationOfficial, ParticipationVirtual, ParticipationPractice:
			participationMode = reqData.ParticipationMode
		default:
			WriteError(w, http.StatusBadRequest, "invalid participation_mode", "400")
			return
		}
	}

	eventUser := EventUser{
		UserID:            user.ID,
		EventID:           eventId,
		ParticipationMode: participationMode,
	}

	_, err = db.CreateEventUser(&eventUser)
	if err != nil {
		logrus.WithError(err).Error("error creating event participant")
		WriteError(w, http.StatusInternalServerError, "error creating event participant", "500")
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]string{"message": "registered successfully"})
}

func getParticipants(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		WriteError(w, http.StatusInternalServerError, "error retrieving event", "500")
		return
	}
	if event == nil {
		logrus.Warn("event not found")
		WriteError(w, http.StatusNotFound, "event not found", "404")
		return
	}

	participants, err := db.GetEventParticipants(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event participants")
		WriteError(w, http.StatusInternalServerError, "error getting event participants", "500")
		return
	}

	WriteJSON(w, http.StatusOK, participants)
}
