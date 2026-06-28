package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io/pat"
)

// ICPC-style attempt stats per user/problem for an event
type EventProblemAttemptResponse struct {
	UserID            uuid.UUID  `json:"user_id"`
	ProblemID         int        `json:"problem_id"`
	Attempts          int        `json:"attempts"`
	TotalAttempts     int        `json:"total_attempts"`
	FirstAcceptedTime *time.Time `json:"first_accepted_time,omitempty"`
	MinutesToSolve    *int       `json:"minutes_to_solve,omitempty"`
}

func getEventProblemAttempts(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event id")
		WriteError(w, http.StatusBadRequest, "bad event id", "400")
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

	attempts, err := db.GetEventProblemAttempts(event.ID)
	if err != nil {
		logrus.WithError(err).Error("error getting attempts")
		WriteError(w, http.StatusInternalServerError, "error getting attempts", "500")
		return
	}

	// compute minutes to solve based on event start
	resp := make([]EventProblemAttemptResponse, 0, len(attempts))
	for _, a := range attempts {
		var minutes *int
		if a.FirstAcceptedTime != nil {
			m := int(a.FirstAcceptedTime.Sub(event.StartTime).Minutes())
			if m < 0 {
				m = 0
			}
			minutes = &m
		}
		resp = append(resp, EventProblemAttemptResponse{
			UserID:            a.UserID,
			ProblemID:         a.ProblemID,
			Attempts:          a.Attempts,
			TotalAttempts:     a.TotalAttempts,
			FirstAcceptedTime: a.FirstAcceptedTime,
			MinutesToSolve:    minutes,
		})
	}

	WriteJSON(w, http.StatusOK, resp)
}

// Return an EventProblem
func getEventProblem(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad uuid", "400")
		return
	}

	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad uuid", "400")
		return
	}

	problem, err := db.GetPublicEventProblemWithTestsByID(eventId, problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		WriteError(w, http.StatusInternalServerError, "error retrieving competition", "500")
		return
	}
	if problem == nil {
		logrus.Warn("problem not found")
		WriteError(w, http.StatusNotFound, "problem not found", "404")
		return
	}

	WriteJSON(w, http.StatusOK, problem)
}

// Can consolidate problems.go/getProblemData into this?
func getEventProblems(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad uuid", "400")
		return
	}

	problems, err := db.GetPublicEventProblems(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		WriteError(w, http.StatusInternalServerError, "error retrieving problem", "500")
		return
	}
	if problems == nil {
		logrus.Warn("problem not found")
		WriteError(w, http.StatusNotFound, "problem not found", "404")
		return
	}

	WriteJSON(w, http.StatusOK, problems)
}

type PostAddEventType struct {
	ProblemID int `json:"problem_id"`
}

func addEventProblem(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad uuid")
		WriteError(w, http.StatusBadRequest, "bad uuid", "400")
		return
	}

	reqData := new(PostAddEventType)
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

	// Make sure the event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		logrus.WithError(err).Error("event does not exist")
		WriteError(w, http.StatusInternalServerError, "event does not exist", "404")
		return
	}

	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusInternalServerError, "Error in token", "500")
		return
	}

	if !canManageEvent(token, event) {
		logrus.Warn("user not authorized to add problems to event")
		WriteError(w, http.StatusForbidden, "forbidden", "403")
		return
	}

	// Make sure the problem exists
	problem, err := db.GetProblemDescriptionByID(reqData.ProblemID)
	if err != nil {
		logrus.WithError(err).Error("error getting problem from db")
		WriteError(w, http.StatusInternalServerError, "error getting problem from db", "500")
		return
	}
	if problem == nil {
		logrus.WithError(err).Error("problem does not exist")
		WriteError(w, http.StatusInternalServerError, "problem does not exist", "404")
		return
	}

	// Make sure the problem is not already referred to
	// TODO:

	_, err = db.CreateEventProblem(
		&EventProblem{
			EventID:   eventId,
			ProblemID: problem.ID,
			Hidden:    false,
		},
	)
	if err != nil {
		logrus.WithError(err).Error("error inserting problem into db")
		WriteError(w, http.StatusInternalServerError, "error inserting problem into db", "500")
		return
	}

	WriteJSON(w, http.StatusCreated, map[string]string{"message": "success"})
}

type EventProblemStats struct {
	ProblemID     int `json:"problem_id"`
	AcceptedCount int `json:"accepted_count"`
}

type UserEventProblemStatus struct {
	ProblemID  int       `json:"problem_id"`
	Status     string    `json:"status"`
	SubmitTime time.Time `json:"submit_time"`
}

// Get user's problem completion status for a contest
func getUserEventProblemsStatus(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event id")
		WriteError(w, http.StatusBadRequest, "bad event id", "400")
		return
	}

	// Get user ID from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusInternalServerError, "Error in token", "500")
		return
	}

	userId := token.Id

	// Make sure the event exists
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

	// Get user's completed problems for this contest
	submissions, err := db.GetUserEventProblemsStatus(userId, eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting user event problems status")
		WriteError(w, http.StatusInternalServerError, "error getting user event problems status", "500")
		return
	}

	// Convert to response format
	var statusList []UserEventProblemStatus
	for _, submission := range submissions {
		statusList = append(statusList, UserEventProblemStatus{
			ProblemID:  submission.ProblemID,
			Status:     string(submission.Status),
			SubmitTime: submission.SubmitTime,
		})
	}

	WriteJSON(w, http.StatusOK, statusList)
}

// Get contest problems statistics (acceptance counts)
func getEventProblemsStats(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event id")
		WriteError(w, http.StatusBadRequest, "bad event id", "400")
		return
	}

	// Make sure the event exists
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

	// Get problems for this event
	problems, err := db.GetEventProblems(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event problems")
		WriteError(w, http.StatusInternalServerError, "error getting event problems", "500")
		return
	}

	// Get statistics for each problem
	var stats []EventProblemStats
	for _, problem := range problems {
		acceptedCount, err := db.GetEventProblemStats(eventId, problem.ID)
		if err != nil {
			logrus.WithError(err).Warnf("error getting stats for problem %d", problem.ID)
			acceptedCount = 0 // continue with 0 count on error
		}

		stats = append(stats, EventProblemStats{
			ProblemID:     problem.ID,
			AcceptedCount: acceptedCount,
		})
	}

	WriteJSON(w, http.StatusOK, stats)
}
