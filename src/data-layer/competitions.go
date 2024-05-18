package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

func addCompetitionsRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/competitions"), postCompetition)
	mux.HandleFunc(pat.Get("/v1/competitions"), getCompetitions)
	mux.HandleFunc(pat.Get("/v1/competitions/:competition_id"), getCompetition)
	mux.HandleFunc(pat.Delete("/v1/competitions/:competition_id"), deleteCompetition)
	mux.HandleFunc(pat.Post("/v1/competitions/:competition_id/participants"), addParticipant)
}

type PostCompetitionRequestBody struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	UserID      int    `json:"user_id"`
	ProblemIDs  []int  `json:"problem_ids"`
}

type PostCompetitionParticipantRequestBody struct {
	UserID int `json:"user_id"`
}

func getCompetitions(w http.ResponseWriter, r *http.Request) {
	competitions, err := db.GetCompetitions()
	if err != nil {
		logrus.WithError(err).Error("error getting competitions from the db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting competitions from the db"}`)
		return
	}
	respJSON, err := json.Marshal(competitions)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func getCompetition(w http.ResponseWriter, r *http.Request) {
	competitionIdParam := pat.Param(r, "competition_id")

	competitionId, err := strconv.Atoi(competitionIdParam)
	if err != nil {
		logrus.WithError(err).Error("competition id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"competition id must be int"}`)
		return
	}

	competition, err := db.GetCompetitionByID(competitionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving competition")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
		return
	}
	if competition == nil {
		logrus.WithError(err).Warn("competition not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"competition not found"}`)
		return
	}

	respJSON, err := json.Marshal(competition)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func postCompetition(w http.ResponseWriter, r *http.Request) {
	reqData := new(PostCompetitionRequestBody)
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

	user, err := db.GetUserByID(reqData.UserID)
	if err != nil {
		logrus.WithError(err).Error("error checking for host user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for host user"}`)
		return
	}
	if user == nil {
		logrus.Warn("host user does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"host user does not exist"}`)
		return
	}

	if reqData.Title == "" {
		logrus.Warn("title is required")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"title is required"}`)
		return
	}
	existingCompetition, err := db.GetCompetitionByTitle(reqData.Title)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing competition")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing competition"}`)
		return
	}
	if existingCompetition != nil {
		logrus.WithField("title", reqData.Title).Warn("competition with that title already exists")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"competition with that title already exists"}`)
		return
	}

	startTime, err := time.Parse(time.RFC3339, reqData.StartTime)
	if err != nil {
		logrus.WithField("start_time", startTime).Warn("error parsing start time")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"error parsing start time"}`)
		return
	}

	endTime, err := time.Parse(time.RFC3339, reqData.EndTime)
	if err != nil {
		logrus.WithField("end_time", endTime).Warn("error parsing end time")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"error parsing end time"}`)
		return
	}

	if startTime.Before(time.Now()) {
		logrus.WithField("start_time", startTime).Warn("cannot make start time before present")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"cannot make start time before present"}`)
		return
	}
	if startTime.After(endTime) {
		logrus.Warn("cannot make start time after end time")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"cannot make start time after end time"}`)
		return
	}

	dbCompetition := &Competition{
		Title:       reqData.Title,
		Description: reqData.Description,
		StartTime:   startTime,
		EndTime:     endTime,
		UserID:      reqData.UserID,
		Problems:    []Problem{},
	}

	for _, problemId := range reqData.ProblemIDs {
		problem, err := db.GetProblemByID(problemId)
		if err != nil {
			logrus.WithError(err).Error("error retrieving problem")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
			return
		}
		if problem == nil {
			logrus.Warn("problem not found")
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
			return
		}
		dbCompetition.Problems = append(dbCompetition.Problems, *problem)
	}

	newCompetition, err := db.CreateCompetition(dbCompetition)
	if err != nil {
		logrus.WithError(err).Error("error inserting competition into db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting competition into db"}`)
		return
	}

	respJSON, err := json.Marshal(newCompetition)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func deleteCompetition(w http.ResponseWriter, r *http.Request) {
	competitionIdParam := pat.Param(r, "competition_id")

	competitionId, err := strconv.Atoi(competitionIdParam)
	if err != nil {
		logrus.WithError(err).Error("competition id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"competition id must be int"}`)
		return
	}

	competition, err := db.GetCompetitionByID(competitionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving competition")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
		return
	}
	if competition == nil {
		logrus.WithError(err).Warn("competition not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"competition not found"}`)
		return
	}

	err = db.DeleteCompetition(competition)
	if err != nil {
		logrus.WithError(err).Error("error deleting competition")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error deleting competition"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func addParticipant(w http.ResponseWriter, r *http.Request) {
	reqData := new(PostCompetitionParticipantRequestBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}

	competitionIdParam := pat.Param(r, "competition_id")

	competitionId, err := strconv.Atoi(competitionIdParam)
	if err != nil {
		logrus.WithError(err).Error("competition id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"competition id must be int"}`)
		return
	}

	competition, err := db.GetCompetitionByID(competitionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving competition")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
		return
	}
	if competition == nil {
		logrus.WithError(err).Warn("competition not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"competition not found"}`)
		return
	}

	now := time.Now()
	if competition.EndTime.Before(now) {
		logrus.WithFields(logrus.Fields{
			"end_time":     competition.EndTime,
			"current_time": now,
		}).Warn("competition has ended")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"competition has ended"}`)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	user, err := db.GetUserByID(reqData.UserID)
	if err != nil {
		logrus.WithError(err).Error("error checking for user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for user"}`)
		return
	}
	if user == nil {
		logrus.Warn("user does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user does not exist"}`)
		return
	}

	for _, competitionUser := range competition.Users {
		if competitionUser.ID == user.ID {
			logrus.Warn("user is already registered")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"user is already registered"}`)
			return
		}
	}
	competition.Users = append(competition.Users, *user)

	err = db.UpdateCompetition(competition)
	if err != nil {
		logrus.WithError(err).Error("error adding user to competition in database")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error adding user to competition in database"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
