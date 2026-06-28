package main

import (
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
)

type PostEventProblem struct {
	ProblemID        int      `json:"problem_id"`
	AcceptTimeout    *float64 `json:"accept_timeout"`
	ExecutionTimeout *float64 `json:"execution_timeout"`
	MemoryLimit      *int     `json:"memory_limit"`
	// Can override the default allowed ones
	AllowedLanguages []int `json:"languages"`
}

type PostEventRequestBody struct {
	Title            string             `json:"title"`
	Description      string             `json:"description"`
	StartTime        string             `json:"start_time"`
	EndTime          string             `json:"end_time"`
	Teams            bool               `json:"teams"`
	AllowedLanguages []int              `json:"languages"`
	Problems         []PostEventProblem `json:"problems"`
}

func getEvents(w http.ResponseWriter, r *http.Request) {
	competitions, err := db.GetEventsWithParticipants()
	if err != nil {
		logrus.WithError(err).Error("error getting competitions from the db")
		WriteError(w, http.StatusInternalServerError, "error getting competitions from the db", "500")
		return
	}

	WriteJSON(w, http.StatusOK, competitions)
}

func getPublicEvents(w http.ResponseWriter, r *http.Request) {
	competitions, err := db.GetEventsWithParticipants()
	if err != nil {
		logrus.WithError(err).Error("error getting competitions from the db")
		WriteError(w, http.StatusInternalServerError, "error getting competitions from the db", "500")
		return
	}

	WriteJSON(w, http.StatusOK, competitions)
}

func getEventByTitle(w http.ResponseWriter, r *http.Request) {
	var competition *EventWithProblemsExt
	var err error

	query := r.URL.Query().Get("title")
	if query != "" {
		competition, err = db.GetEventByTitle(query)
		if err != nil {
			logrus.WithError(err).Error("error checking for existing competition")
			WriteError(w, http.StatusInternalServerError, "error checking for existing competition", "500")
			return
		}

		if competition == nil {
			logrus.WithField("title", query).Warn("competition with that title already exists")
			WriteError(w, http.StatusBadRequest, "competition with that title already exists", "400")
			return
		}

	} else {
		logrus.WithError(err).Error("query parameter required")
		WriteError(w, http.StatusInternalServerError, "query parameter required", "500")
		return
	}

	WriteJSON(w, http.StatusOK, competition)
}

func getEvent(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	event, err := db.GetEventDetailByID(eventId)
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

	WriteJSON(w, http.StatusOK, event)
}

func postEvent(w http.ResponseWriter, r *http.Request) {
	reqData := new(PostEventRequestBody)
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

	token, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}
	userId := token.Id

	user, err := db.GetUserByID(userId)
	if err != nil {
		logrus.WithError(err).Error("error checking for host user")
		WriteError(w, http.StatusInternalServerError, "error checking for host user", "500")
		return
	}
	if user == nil {
		logrus.Warn("host user does not exist")
		WriteError(w, http.StatusNotFound, "host user does not exist", "404")
		return
	}

	if reqData.Title == "" {
		logrus.Warn("title is required")
		WriteError(w, http.StatusBadRequest, "title is required", "400")
		return
	}
	existingCompetition, err := db.GetEventByTitle(reqData.Title)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing competition")
		WriteError(w, http.StatusInternalServerError, "error checking for existing competition", "500")
		return
	}
	if existingCompetition != nil {
		logrus.WithField("title", reqData.Title).Warn("competition with that title already exists")
		WriteError(w, http.StatusBadRequest, "competition with that title already exists", "400")
		return
	}

	startTime, err := time.Parse(time.RFC3339, reqData.StartTime)
	if err != nil {
		logrus.WithField("start_time", startTime).Warn("error parsing start time")
		WriteError(w, http.StatusBadRequest, "error parsing start time", "400")
		return
	}

	endTime, err := time.Parse(time.RFC3339, reqData.EndTime)
	if err != nil {
		logrus.WithField("end_time", endTime).Warn("error parsing end time")
		WriteError(w, http.StatusBadRequest, "error parsing end time", "400")
		return
	}

	// assuming they took a few minutes to fill out the form
	if startTime.Before(time.Now().Add(-5 * time.Minute)) {
		logrus.WithField("start_time", startTime).Warn("cannot make start time before present")
		WriteError(w, http.StatusBadRequest, "cannot make start time before present", "400")
		return
	}

	if startTime.After(endTime) {
		logrus.Warn("cannot make start time after end time")
		WriteError(w, http.StatusBadRequest, "cannot make start time after end time", "400")
		return
	}

	dbEvent := &EventWithProblems{
		Event: Event{
			Title:       reqData.Title,
			Description: reqData.Description,
			StartTime:   startTime,
			EndTime:     endTime,
			UserID:      userId,
			Teams:       reqData.Teams,
		},
		Problems: []EventProblem{},
	}

	// Create the problems
	for _, postEventProblem := range reqData.Problems {
		problemId := postEventProblem.ProblemID
		problemDescription, err := db.GetProblemDescriptionByID(problemId)
		if err != nil {
			logrus.WithError(err).Error("error retrieving problem")
			WriteError(w, http.StatusInternalServerError, "error retrieving problem", "500")
			return
		}
		if problemDescription == nil {
			logrus.Warn("problem not found")
			WriteError(w, http.StatusNotFound, "problem not found", "404")
			return
		}

		acceptTimeout := problemDescription.DefaultAcceptTimeout
		memoryLimit := problemDescription.DefaultMemoryLimit

		if postEventProblem.AcceptTimeout != nil {
			acceptTimeout = *postEventProblem.AcceptTimeout
		}

		if postEventProblem.ExecutionTimeout != nil {
			memoryLimit = *postEventProblem.MemoryLimit
		}

		eventProblem := EventProblem{
			ProblemID:        problemDescription.ID,
			Hidden:           false,
			AcceptTimeout:    &acceptTimeout,
			ExecutionTimeout: &acceptTimeout,
			MemoryLimit:      &memoryLimit,
		}
		dbEvent.Problems = append(dbEvent.Problems, eventProblem)
	}

	logrus.Warnf("%+v", dbEvent)

	newCompetition, err := db.CreateEvent(dbEvent)
	if err != nil {
		logrus.WithError(err).Error("error inserting competition into db")
		WriteError(w, http.StatusInternalServerError, "error inserting competition into db", "500")
		return
	}

	WriteJSON(w, http.StatusCreated, newCompetition)
}

func putEvent(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	existingEvent, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		WriteError(w, http.StatusInternalServerError, "error retrieving event", "500")
		return
	}
	if existingEvent == nil {
		logrus.Warn("event not found")
		WriteError(w, http.StatusNotFound, "event not found", "404")
		return
	}

	reqData := new(PostEventRequestBody)
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

	if _, ok := requireAuthenticatedClaims(w, r); !ok {
		return
	}

	if reqData.Title == "" {
		logrus.Warn("title is required")
		WriteError(w, http.StatusBadRequest, "title is required", "400")
		return
	}

	// allow current event to keep its title
	if reqData.Title != existingEvent.Title {
		existingByTitle, err := db.GetEventByTitle(reqData.Title)
		if err != nil {
			logrus.WithError(err).Error("error checking for existing event")
			WriteError(w, http.StatusInternalServerError, "error checking for existing event", "500")
			return
		}
		if existingByTitle != nil {
			logrus.WithField("title", reqData.Title).Warn("event with that title already exists")
			WriteError(w, http.StatusBadRequest, "event with that title already exists", "400")
			return
		}
	}

	startTime, err := time.Parse(time.RFC3339, reqData.StartTime)
	if err != nil {
		logrus.WithField("start_time", reqData.StartTime).Warn("error parsing start time")
		WriteError(w, http.StatusBadRequest, "error parsing start time", "400")
		return
	}

	endTime, err := time.Parse(time.RFC3339, reqData.EndTime)
	if err != nil {
		logrus.WithField("end_time", reqData.EndTime).Warn("error parsing end time")
		WriteError(w, http.StatusBadRequest, "error parsing end time", "400")
		return
	}

	if startTime.After(endTime) {
		logrus.Warn("cannot make start time after end time")
		WriteError(w, http.StatusBadRequest, "cannot make start time after end time", "400")
		return
	}

	existingEvent.Title = reqData.Title
	existingEvent.Description = reqData.Description
	existingEvent.StartTime = startTime
	existingEvent.EndTime = endTime
	existingEvent.Teams = reqData.Teams

	err = db.UpdateEvent(existingEvent)
	if err != nil {
		logrus.WithError(err).Error("error updating event in database")
		WriteError(w, http.StatusInternalServerError, "error updating event in database", "500")
		return
	}

	WriteJSON(w, http.StatusOK, existingEvent)
}

func deleteEvent(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event id")
		WriteError(w, http.StatusBadRequest, "bad event id", "400")
		return
	}

	competition, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving competition")
		WriteError(w, http.StatusInternalServerError, "error retrieving competition", "500")
		return
	}
	if competition == nil {
		logrus.Warn("competition not found")
		WriteError(w, http.StatusNotFound, "competition not found", "404")
		return
	}

	err = db.DeleteEvent(competition)
	if err != nil {
		logrus.WithError(err).Error("error deleting competition")
		WriteError(w, http.StatusInternalServerError, "error deleting competition", "500")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func endEventEarly(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		WriteError(w, http.StatusNotFound, "event not found", "404")
		return
	}

	now := time.Now()
	if event.EndTime.Before(now) {
		WriteJSON(w, http.StatusOK, map[string]string{"message": "event already ended"})
		return
	}

	event.EndTime = now
	if err := db.UpdateEvent(event); err != nil {
		logrus.WithError(err).Error("error ending event")
		WriteError(w, http.StatusInternalServerError, "error ending event", "500")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "event ended successfully"})
}
