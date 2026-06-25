package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io/pat"
)

func getEventSubmissions(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"code":"400", "message":"bad uuid"}`))
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"code":"500", "message":"error getting event from db"}`))
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"code":"404", "message":"event does not exist"}`))
		return
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	teamQuery := r.URL.Query().Get("team")
	userQuery := r.URL.Query().Get("user")

	submissions, ok := fetchEventSubmissions(w, event, eventId, teamQuery, userQuery, claims)
	if !ok {
		return
	}

	for i := range submissions {
		submissions[i] = redactSubmissionForViewer(claims, submissions[i])
	}

	respJSON, err := json.Marshal(submissions)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"code":"500", "message":"JSON parse error"}`))
		return
	}
	_, _ = w.Write(respJSON)
}

func fetchEventSubmissions(
	w http.ResponseWriter,
	event *Event,
	eventId int,
	teamQuery string,
	userQuery string,
	claims *NextJudgeClaims,
) ([]Submission, bool) {
	switch {
	case teamQuery != "":
		return resolveTeamEventSubmissions(w, event, eventId, teamQuery, claims)
	case userQuery != "":
		return resolveUserEventSubmissions(w, eventId, userQuery, claims)
	default:
		return resolveAllEventSubmissions(w, event, eventId, claims)
	}
}

func resolveTeamEventSubmissions(
	w http.ResponseWriter,
	event *Event,
	eventId int,
	teamQuery string,
	claims *NextJudgeClaims,
) ([]Submission, bool) {
	if !event.Teams {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"code":"400", "message":"not a team event"}`))
		return nil, false
	}

	teamID, err := uuid.Parse(teamQuery)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"code":"400", "message":"bad team id"}`))
		return nil, false
	}

	if claims.Role < JudgeRoleEnum {
		eventUser, err := db.GetEventUser(claims.Id, eventId)
		if err != nil {
			logrus.WithError(err).Error("error checking event user")
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"code":"500", "message":"error checking event user"}`))
			return nil, false
		}
		if eventUser == nil || eventUser.TeamID != teamID {
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte(`{"code":"403", "message":"forbidden"}`))
			return nil, false
		}
	}

	submissions, err := db.GetAllEventSubmissionsByTeam(eventId, teamID)
	if err != nil {
		logrus.WithError(err).Error("error getting team submissions")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"code":"500", "message":"error getting submissions"}`))
		return nil, false
	}

	return submissions, true
}

func resolveUserEventSubmissions(
	w http.ResponseWriter,
	eventId int,
	userQuery string,
	claims *NextJudgeClaims,
) ([]Submission, bool) {
	userID, err := uuid.Parse(userQuery)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"code":"400", "message":"bad user id"}`))
		return nil, false
	}

	if !canReadSubmissionForClaims(claims, userID) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"code":"403", "message":"forbidden"}`))
		return nil, false
	}

	submissions, err := db.GetEventSubmissionsByUserID(eventId, userID)
	if err != nil {
		logrus.WithError(err).Error("error getting user submissions")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"code":"500", "message":"error getting submissions"}`))
		return nil, false
	}

	return submissions, true
}

func resolveAllEventSubmissions(
	w http.ResponseWriter,
	event *Event,
	eventId int,
	claims *NextJudgeClaims,
) ([]Submission, bool) {
	if !canViewAllEventSubmissions(claims, event) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"code":"403", "message":"forbidden"}`))
		return nil, false
	}

	submissions, err := db.GetAllEventSubmissions(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event submissions")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"code":"500", "message":"error getting submissions"}`))
		return nil, false
	}

	return submissions, true
}

func endEventEarly(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		_, _ = w.Write([]byte(`{"code":"400", "message":"bad event_id"}`))
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"code":"500", "message":"error getting event from db"}`))
		return
	}
	if event == nil {
		w.WriteHeader(http.StatusNotFound)
		_, _ = w.Write([]byte(`{"code":"404", "message":"event not found"}`))
		return
	}

	now := time.Now()
	if event.EndTime.Before(now) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"message":"event already ended"}`))
		return
	}

	event.EndTime = now
	if err := db.UpdateEvent(event); err != nil {
		logrus.WithError(err).Error("error ending event")
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"code":"500", "message":"error ending event"}`))
		return
	}

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"message":"event ended successfully"}`))
}
