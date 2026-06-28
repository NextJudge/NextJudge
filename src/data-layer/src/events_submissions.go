package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func getEventSubmissions(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad uuid", "400")
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		WriteError(w, http.StatusNotFound, "event does not exist", "404")
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

	WriteJSON(w, http.StatusOK, submissions)
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
		WriteError(w, http.StatusBadRequest, "not a team event", "400")
		return nil, false
	}

	teamID, err := uuid.Parse(teamQuery)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "bad team id", "400")
		return nil, false
	}

	if claims.Role < JudgeRoleEnum {
		eventUser, err := db.GetEventUser(claims.Id, eventId)
		if err != nil {
			logrus.WithError(err).Error("error checking event user")
			WriteError(w, http.StatusInternalServerError, "error checking event user", "500")
			return nil, false
		}
		if eventUser == nil || eventUser.TeamID != teamID {
			WriteError(w, http.StatusForbidden, "forbidden", "403")
			return nil, false
		}
	}

	submissions, err := db.GetAllEventSubmissionsByTeam(eventId, teamID)
	if err != nil {
		logrus.WithError(err).Error("error getting team submissions")
		WriteError(w, http.StatusInternalServerError, "error getting submissions", "500")
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
		WriteError(w, http.StatusBadRequest, "bad user id", "400")
		return nil, false
	}

	if !canReadSubmissionForClaims(claims, userID) {
		WriteError(w, http.StatusForbidden, "forbidden", "403")
		return nil, false
	}

	submissions, err := db.GetEventSubmissionsByUserID(eventId, userID)
	if err != nil {
		logrus.WithError(err).Error("error getting user submissions")
		WriteError(w, http.StatusInternalServerError, "error getting submissions", "500")
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
		WriteError(w, http.StatusForbidden, "forbidden", "403")
		return nil, false
	}

	submissions, err := db.GetAllEventSubmissions(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event submissions")
		WriteError(w, http.StatusInternalServerError, "error getting submissions", "500")
		return nil, false
	}

	return submissions, true
}
