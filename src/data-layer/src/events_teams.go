package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io/pat"
)

type eventTeamDetail struct {
	EventTeam
	Members []User `json:"members"`
}

func getTeams(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad uuid", "400")
		return
	}

	teams, err := db.GetEventTeams(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting teams from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}

	WriteJSON(w, http.StatusOK, teams)
}

type CreateTeamPostBody struct {
	Name string `json:"name"`
}

type ReturnBodyCreateTeam struct {
	Message string    `json:"message"`
	TeamID  uuid.UUID `json:"team_id"`
}

func createTeam(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad uuid", "400")
		return
	}

	reqData := new(CreateTeamPostBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		WriteError(w, http.StatusInternalServerError, "error reading request body", "500")
		return
	}
	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		WriteError(w, http.StatusInternalServerError, "JSON parse error", "500")
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		logrus.WithError(err).Error("event does not exist")
		WriteError(w, http.StatusNotFound, "event does not exist", "404")
		return
	}

	if !event.Teams {
		logrus.WithError(err).Error("Not a team event")
		WriteError(w, http.StatusNotFound, "not a team event", "404")
		return
	}

	existingTeam, err := db.GetTeamByNameForEvent(eventId, reqData.Name)
	if err != nil {
		logrus.WithError(err).Error("error getting team from db")
		WriteError(w, http.StatusInternalServerError, "error getting team from db", "500")
		return
	}
	if existingTeam != nil {
		logrus.Error("Team already exists with that name")
		WriteError(w, http.StatusConflict, "duplicate team name", "409")
		return
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	newTeam, err := db.CreateTeamWithCreator(eventId, reqData.Name, claims.Id)
	if err != nil {
		if errors.Is(err, ErrDuplicateTeamName) {
			WriteError(w, http.StatusConflict, "duplicate team name", "409")
			return
		}
		if errors.Is(err, ErrUserAlreadyOnTeam) {
			WriteError(w, http.StatusConflict, "already on a team for this event", "409")
			return
		}
		logrus.WithError(err).Error("error creating team")
		WriteError(w, http.StatusInternalServerError, "error creating team", "500")
		return
	}

	WriteJSON(w, http.StatusCreated, ReturnBodyCreateTeam{
		Message: "Success",
		TeamID:  newTeam.ID,
	})
}

func getTeam(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	teamIdParam := pat.Param(r, "team_id")
	teamId, err := uuid.Parse(teamIdParam)
	if err != nil {
		logrus.Warn("bad team_id")
		WriteError(w, http.StatusBadRequest, "bad team_id", "400")
		return
	}

	team, err := db.GetTeamByID(teamId)
	if err != nil {
		logrus.WithError(err).Error("error getting team from db")
		WriteError(w, http.StatusInternalServerError, "error getting team from db", "500")
		return
	}
	if team == nil || team.EventID != eventId {
		WriteError(w, http.StatusNotFound, "team not found", "404")
		return
	}

	members, err := db.GetTeamMembers(teamId)
	if err != nil {
		logrus.WithError(err).Error("error getting team members")
		WriteError(w, http.StatusInternalServerError, "error getting team members", "500")
		return
	}

	WriteJSON(w, http.StatusOK, eventTeamDetail{
		EventTeam: *team,
		Members:   members,
	})
}

func getMyEventTeam(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	team, err := db.GetUserTeamForEvent(claims.Id, eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting user team")
		WriteError(w, http.StatusInternalServerError, "error getting user team", "500")
		return
	}
	if team == nil {
		WriteError(w, http.StatusNotFound, "not on a team", "404")
		return
	}

	members, err := db.GetTeamMembers(team.ID)
	if err != nil {
		logrus.WithError(err).Error("error getting team members")
		WriteError(w, http.StatusInternalServerError, "error getting team members", "500")
		return
	}

	WriteJSON(w, http.StatusOK, eventTeamDetail{
		EventTeam: *team,
		Members:   members,
	})
}

type PostJoinTeam struct {
	UserID uuid.UUID `json:"user_id"`
}

func joinTeam(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	teamIdParam := pat.Param(r, "team_id")
	teamId, err := uuid.Parse(teamIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad team_id", "400")
		return
	}

	reqData := new(PostJoinTeam)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		WriteError(w, http.StatusInternalServerError, "error reading request body", "500")
		return
	}
	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		WriteError(w, http.StatusInternalServerError, "JSON parse error", "500")
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		logrus.WithError(err).Error("event does not exist")
		WriteError(w, http.StatusNotFound, "event does not exist", "404")
		return
	}

	if !event.Teams {
		logrus.WithError(err).Error("Not a team event")
		WriteError(w, http.StatusNotFound, "not a team event", "404")
		return
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	userId := reqData.UserID
	if userId == uuid.Nil {
		userId = claims.Id
	}
	if userId != claims.Id && claims.Role != AdminRoleEnum {
		WriteError(w, http.StatusForbidden, "cannot join team for another user", "403")
		return
	}

	team, err := db.GetTeamByID(teamId)
	if err != nil {
		logrus.WithError(err).Error("error getting teams from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if team == nil || team.EventID != eventId {
		logrus.WithError(err).Error("team does not exist")
		WriteError(w, http.StatusNotFound, "team does not exist", "404")
		return
	}

	existingEventUser, err := db.GetEventUser(userId, eventId)
	if err != nil {
		logrus.WithError(err).Error("error checking event user")
		WriteError(w, http.StatusInternalServerError, "error checking event user", "500")
		return
	}

	if existingEventUser != nil {
		if existingEventUser.TeamID != uuid.Nil && existingEventUser.TeamID != teamId {
			WriteError(w, http.StatusConflict, "already on another team", "409")
			return
		}
		if existingEventUser.TeamID == teamId {
			WriteJSON(w, http.StatusOK, map[string]string{"message": "already on this team"})
			return
		}
		err = db.UpdateEventUserTeam(userId, eventId, teamId)
	} else {
		_, err = db.CreateEventUser(&EventUser{
			UserID:  userId,
			EventID: eventId,
			TeamID:  teamId,
		})
	}
	if err != nil {
		logrus.WithError(err).Error("error adding user to team")
		WriteError(w, http.StatusInternalServerError, "db error adding user to team", "500")
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]string{"message": "success"})
}
