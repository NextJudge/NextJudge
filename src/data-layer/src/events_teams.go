package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io/pat"
)

type eventTeamDetail struct {
	EventTeam
	Members []User `json:"members"`
}

func getTeams(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	teams, err := db.GetEventTeams(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting teams from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}

	respJSON, err := json.Marshal(teams)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

type CreateTeamPostBody struct {
	Name string `json:"name"`
}

type ReturnBodyCreateTeam struct {
	Message string    `json:"message"`
	TeamID  uuid.UUID `json:"team_id"`
}

func createTeam(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	reqData := new(CreateTeamPostBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}
	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if event == nil {
		logrus.WithError(err).Error("event does not exist")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"404", "message":"event does not exist"}`)
		return
	}

	if !event.Teams {
		logrus.WithError(err).Error("Not a team event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"404", "message":"not a team event"}`)
		return
	}

	existingTeam, err := db.GetTeamByNameForEvent(eventId, reqData.Name)
	if err != nil {
		logrus.WithError(err).Error("error getting team from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting team from db"}`)
		return
	}
	if existingTeam != nil {
		logrus.Error("Team already exists with that name")
		w.WriteHeader(http.StatusConflict)
		fmt.Fprint(w, `{"code":"409", "message":"duplicate team name"}`)
		return
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	newTeam, err := db.CreateTeamWithCreator(eventId, reqData.Name, claims.Id)
	if err != nil {
		if errors.Is(err, ErrDuplicateTeamName) {
			w.WriteHeader(http.StatusConflict)
			fmt.Fprint(w, `{"code":"409", "message":"duplicate team name"}`)
			return
		}
		if errors.Is(err, ErrUserAlreadyOnTeam) {
			w.WriteHeader(http.StatusConflict)
			fmt.Fprint(w, `{"code":"409", "message":"already on a team for this event"}`)
			return
		}
		logrus.WithError(err).Error("error creating team")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error creating team"}`)
		return
	}

	returnData := ReturnBodyCreateTeam{
		Message: "Success",
		TeamID:  newTeam.ID,
	}

	respJSON, err := json.Marshal(returnData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func getTeam(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	teamIdParam := pat.Param(r, "team_id")

	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	teamId, err := uuid.Parse(teamIdParam)
	if err != nil {
		logrus.Warn("bad team_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad team_id"}`)
		return
	}

	team, err := db.GetTeamByID(teamId)
	if err != nil {
		logrus.WithError(err).Error("error getting team from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting team from db"}`)
		return
	}
	if team == nil || team.EventID != eventId {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"team not found"}`)
		return
	}

	members, err := db.GetTeamMembers(teamId)
	if err != nil {
		logrus.WithError(err).Error("error getting team members")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting team members"}`)
		return
	}

	respJSON, err := json.Marshal(eventTeamDetail{
		EventTeam: *team,
		Members:   members,
	})
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func getMyEventTeam(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	team, err := db.GetUserTeamForEvent(claims.Id, eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting user team")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting user team"}`)
		return
	}
	if team == nil {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"not on a team"}`)
		return
	}

	members, err := db.GetTeamMembers(team.ID)
	if err != nil {
		logrus.WithError(err).Error("error getting team members")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting team members"}`)
		return
	}

	respJSON, err := json.Marshal(eventTeamDetail{
		EventTeam: *team,
		Members:   members,
	})
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

type PostJoinTeam struct {
	UserID uuid.UUID `json:"user_id"`
}

func joinTeam(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	teamIdParam := pat.Param(r, "team_id")

	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	teamId, err := uuid.Parse(teamIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad team_id"}`)
		return
	}

	reqData := new(PostJoinTeam)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}
	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if event == nil {
		logrus.WithError(err).Error("event does not exist")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"404", "message":"event does not exist"}`)
		return
	}

	if !event.Teams {
		logrus.WithError(err).Error("Not a team event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"404", "message":"not a team event"}`)
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
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, `{"code":"403", "message":"cannot join team for another user"}`)
		return
	}

	team, err := db.GetTeamByID(teamId)
	if err != nil {
		logrus.WithError(err).Error("error getting teams from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if team == nil || team.EventID != eventId {
		logrus.WithError(err).Error("team does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"team does not exist"}`)
		return
	}

	existingEventUser, err := db.GetEventUser(userId, eventId)
	if err != nil {
		logrus.WithError(err).Error("error checking event user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking event user"}`)
		return
	}

	if existingEventUser != nil {
		if existingEventUser.TeamID != uuid.Nil && existingEventUser.TeamID != teamId {
			w.WriteHeader(http.StatusConflict)
			fmt.Fprint(w, `{"code":"409", "message":"already on another team"}`)
			return
		}
		if existingEventUser.TeamID == teamId {
			w.WriteHeader(http.StatusOK)
			fmt.Fprint(w, `{"message":"already on this team"}`)
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
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"db error adding user to team"}`)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, `{"message":"success"}`)
}
