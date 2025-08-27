package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

func addEventsRoutes(mux *goji.Mux) {
	// TODO: make this paginated, return ~50 latest
	mux.HandleFunc(pat.Get("/v1/events"), AdminRequired(getEvents))
	mux.HandleFunc(pat.Get("/v1/public/events"), AuthRequired(getPublicEvents))
	mux.HandleFunc(pat.Get("/v1/public/events/:event_id"), AuthRequired(getEvent))
	mux.HandleFunc(pat.Get("/v1/event_details"), AdminRequired(getEventByTitle))

	mux.HandleFunc(pat.Get("/v1/events/:event_id"), AdminRequired(getEvent))
	mux.HandleFunc(pat.Post("/v1/events"), AdminRequired(postEvent))
	mux.HandleFunc(pat.Put("/v1/events/:event_id"), AdminRequired(putEvent))

	// Get the state of a event (has it started?)
	// mux.HandleFunc(pat.Get("/v1/events/:event_id/state"), AuthRequired(deleteEvent))

	mux.HandleFunc(pat.Delete("/v1/events/:event_id"), AdminRequired(deleteEvent))

	mux.HandleFunc(pat.Post("/v1/events/:event_id/participants"), AdminRequired(addParticipant))
	mux.HandleFunc(pat.Post("/v1/public/events/:event_id/register"), AuthRequired(registerForEvent))
	mux.HandleFunc(pat.Get("/v1/events/:event_id/participants"), AdminRequired(getParticipants))
	mux.HandleFunc(pat.Get("/v1/public/events/:event_id/participants"), AuthRequired(getParticipants))

	// Get list of problems in event
	mux.HandleFunc(pat.Get("/v1/events/:event_id/problems"), AuthRequired(getEventProblems))
	// Apply a problem to the event
	mux.HandleFunc(pat.Post("/v1/events/:event_id/problems"), AuthRequired(addEventProblem))

	mux.HandleFunc(pat.Get("/v1/events/:event_id/problems/:problem_id"), AuthRequired(getEventProblem))

	mux.HandleFunc(pat.Get("/v1/events/:event_id/teams"), AuthRequired(getTeams))
	mux.HandleFunc(pat.Post("/v1/events/:event_id/teams"), AuthRequired(createTeam))
	mux.HandleFunc(pat.Get("/v1/events/:event_id/teams/:team_id"), AuthRequired(getTeam))
	mux.HandleFunc(pat.Post("/v1/events/:event_id/teams/:team_id/join"), AuthRequired(joinTeam))

	// Submissions, query determined by query parameters
	mux.HandleFunc(pat.Get("/v1/events/:event_id/submissions"), AuthRequired(getEventSubmissions))

	// Contest problem status and statistics
	mux.HandleFunc(pat.Get("/v1/events/:event_id/user_problem_status"), AuthRequired(getUserEventProblemsStatus))
	mux.HandleFunc(pat.Get("/v1/events/:event_id/problems_stats"), AuthRequired(getEventProblemsStats))

	// ICPC-style attempts/solve-time per user/problem for an event
	mux.HandleFunc(pat.Get("/v1/events/:event_id/attempts"), AuthRequired(getEventProblemAttempts))

	// Question management
	mux.HandleFunc(pat.Get("/v1/events/:event_id/questions"), AuthRequired(getEventQuestions))
	mux.HandleFunc(pat.Post("/v1/events/:event_id/questions"), AuthRequired(createEventQuestion))
	mux.HandleFunc(pat.Put("/v1/events/:event_id/questions/:question_id/answer"), AuthRequired(answerEventQuestion))

	// User notifications
	mux.HandleFunc(pat.Get("/v1/user/notifications/count"), AuthRequired(getNotificationsCount))
	mux.HandleFunc(pat.Get("/v1/user/notifications"), AuthRequired(getUserNotifications))
	mux.HandleFunc(pat.Put("/v1/user/notifications/mark-read"), AuthRequired(markNotificationsAsRead))
}

// DEPRECATED: No longer using a hardcoded "general event" - problems are standalone
// func getGeneralEventID() int {
// 	return 1
// }

type GetCompetitionData struct {
	ID          uuid.UUID
	Title       string
	Description string
	StartTime   time.Time
	EndTime     time.Time
}

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
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event id"}`)
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving event"}`)
		return
	}
	if event == nil {
		logrus.Warn("event not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event not found"}`)
		return
	}

	attempts, err := db.GetEventProblemAttempts(event.ID)
	if err != nil {
		logrus.WithError(err).Error("error getting attempts")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting attempts"}`)
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

	respJSON, err := json.Marshal(resp)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

type PostCompetitionParticipantRequestBody struct {
	UserID uuid.UUID `json:"user_id"`
}

func getEvents(w http.ResponseWriter, r *http.Request) {
	competitions, err := db.GetEventsWithParticipants()
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

func getPublicEvents(w http.ResponseWriter, r *http.Request) {
	competitions, err := db.GetEventsWithParticipants()
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

func getEventByTitle(w http.ResponseWriter, r *http.Request) {
	var competition *EventWithProblemsExt
	var err error

	query := r.URL.Query().Get("title")
	if query != "" {
		competition, err = db.GetEventByTitle(query)
		if err != nil {
			logrus.WithError(err).Error("error checking for existing competition")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for existing competition"}`)
			return
		}

		if competition == nil {
			logrus.WithField("title", query).Warn("competition with that title already exists")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"competition with that title already exists"}`)
			return
		}

	} else {
		logrus.WithError(err).Error("query parameter required")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"query parameter required"}`)
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

func getEvent(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving competition")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
		return
	}
	if event == nil {
		logrus.Warn("competition not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"competition not found"}`)
		return
	}

	respJSON, err := json.Marshal(event)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

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

func postEvent(w http.ResponseWriter, r *http.Request) {
	reqData := new(PostEventRequestBody)
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

	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"Error in token"}`)
		return
	}

	if token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"Error in token"}`)
		return
	}
	userId := token.Id

	user, err := db.GetUserByID(userId)
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
	existingCompetition, err := db.GetEventByTitle(reqData.Title)
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

	// assuming they took a few minutes to fill out the form
	if startTime.Before(time.Now().Add(-5 * time.Minute)) {
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
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
			return
		}
		if problemDescription == nil {
			logrus.Warn("problem not found")
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
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

func putEvent(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	existingEvent, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving event"}`)
		return
	}
	if existingEvent == nil {
		logrus.Warn("event not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event not found"}`)
		return
	}

	reqData := new(PostEventRequestBody)
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

	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"Error in token"}`)
		return
	}

	if reqData.Title == "" {
		logrus.Warn("title is required")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"title is required"}`)
		return
	}

	// allow current event to keep its title
	if reqData.Title != existingEvent.Title {
		existingByTitle, err := db.GetEventByTitle(reqData.Title)
		if err != nil {
			logrus.WithError(err).Error("error checking for existing event")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for existing event"}`)
			return
		}
		if existingByTitle != nil {
			logrus.WithField("title", reqData.Title).Warn("event with that title already exists")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"event with that title already exists"}`)
			return
		}
	}

	startTime, err := time.Parse(time.RFC3339, reqData.StartTime)
	if err != nil {
		logrus.WithField("start_time", reqData.StartTime).Warn("error parsing start time")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"error parsing start time"}`)
		return
	}

	endTime, err := time.Parse(time.RFC3339, reqData.EndTime)
	if err != nil {
		logrus.WithField("end_time", reqData.EndTime).Warn("error parsing end time")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"error parsing end time"}`)
		return
	}

	if startTime.After(endTime) {
		logrus.Warn("cannot make start time after end time")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"cannot make start time after end time"}`)
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
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating event in database"}`)
		return
	}

	respJSON, err := json.Marshal(existingEvent)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

func deleteEvent(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	competition, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving competition")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
		return
	}
	if competition == nil {
		logrus.Warn("competition not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"competition not found"}`)
		return
	}

	err = db.DeleteEvent(competition)
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

	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving event"}`)
		return
	}
	if event == nil {
		logrus.Warn("event not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event not found"}`)
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
		logrus.Warn("user not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user not found"}`)
		return
	}

	// check if user is already a participant
	existingEventUser, err := db.GetEventUser(user.ID, eventId)
	if err != nil {
		logrus.WithError(err).Error("error checking existing participant")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking existing participant"}`)
		return
	}
	if existingEventUser != nil {
		logrus.Warn("user is already a participant")
		w.WriteHeader(http.StatusConflict)
		fmt.Fprint(w, `{"code":"409", "message":"user is already a participant"}`)
		return
	}

	eventUser := EventUser{
		UserID:  user.ID,
		EventID: eventId,
	}

	_, err = db.CreateEventUser(&eventUser)
	if err != nil {
		logrus.WithError(err).Error("error creating event participant")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error creating event participant"}`)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, `{"message":"participant added successfully"}`)
}

func registerForEvent(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"code":"401", "message":"unauthorized"}`)
		return
	}
	if token == nil {
		logrus.Error("Token is nil")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"code":"401", "message":"unauthorized"}`)
		return
	}

	userId := token.Id

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving event"}`)
		return
	}
	if event == nil {
		logrus.Warn("event not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event not found"}`)
		return
	}

	user, err := db.GetUserByID(userId)
	if err != nil {
		logrus.WithError(err).Error("error checking for user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for user"}`)
		return
	}
	if user == nil {
		logrus.Warn("user not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user not found"}`)
		return
	}

	// check if user is already a participant
	existingEventUser, err := db.GetEventUser(user.ID, eventId)
	if err != nil {
		logrus.WithError(err).Error("error checking existing participant")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking existing participant"}`)
		return
	}
	if existingEventUser != nil {
		logrus.Warn("user is already a participant")
		w.WriteHeader(http.StatusConflict)
		fmt.Fprint(w, `{"code":"409", "message":"user is already a participant"}`)
		return
	}

	eventUser := EventUser{
		UserID:  user.ID,
		EventID: eventId,
	}

	_, err = db.CreateEventUser(&eventUser)
	if err != nil {
		logrus.WithError(err).Error("error creating event participant")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error creating event participant"}`)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, `{"message":"registered successfully"}`)
}

func getParticipants(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event_id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event_id"}`)
		return
	}

	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving event"}`)
		return
	}
	if event == nil {
		logrus.Warn("event not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event not found"}`)
		return
	}

	participants, err := db.GetEventParticipants(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event participants")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event participants"}`)
		return
	}

	respJSON, err := json.Marshal(participants)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

// Return an EventProblem
func getEventProblem(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	problem, err := db.GetPublicEventProblemWithTestsByID(eventId, problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
		return
	}
	if problem == nil {
		logrus.Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	respJSON, err := json.Marshal(problem)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

// Can consolidate problems.go/getProblemData into this?
func getEventProblems(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	problems, err := db.GetPublicEventProblems(eventId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
		return
	}
	if problems == nil {
		logrus.Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	respJSON, err := json.Marshal(problems)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

type PostAddEventType struct {
	ProblemID int `json:"problem_id"`
}

func addEventProblem(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	reqData := new(PostAddEventType)
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

	// Make sure the event exists
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

	// Make sure the problem exists
	problem, err := db.GetProblemDescriptionByID(reqData.ProblemID)
	if err != nil {
		logrus.WithError(err).Error("error getting problem from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting problem from db"}`)
		return
	}
	if problem == nil {
		logrus.WithError(err).Error("problem does not exist")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"404", "message":"problem does not exist"}`)
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
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting problem into db"}`)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, `{"message":"success"}`)
}

// Return list of teams in an event
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

	// Make sure the event exists
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

	existingTeam, err := db.GetTeamByName(reqData.Name)
	if err != nil {
		logrus.WithError(err).Error("error getting team from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting team from db"}`)
		return
	}
	if existingTeam != nil {
		logrus.Error("Team already exists with that name")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"duplicate team name"}`)
		return
	}

	newTeam, err := db.CreateTeam(
		eventId,
		reqData.Name,
	)
	if err != nil {
		logrus.WithError(err).Error("error inserting problem into db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting problem into db"}`)
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

	// Make sure the event exists
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

	// Make sure teams are enabled
	if !event.Teams {
		logrus.WithError(err).Error("Not a team event")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"404", "message":"not a team event"}`)
		return
	}

	// Make sure the user has access to this
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"Error in token"}`)
		return
	}
	if token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"Error in token"}`)
		return
	}

	// Only admins can modify users that are not themselves
	if reqData.UserID != token.Id && token.Role != AdminRoleEnum {
		logrus.Error("Authentication error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Authentication error"}`)
		return
	}

	// Get Team
	team, err := db.GetTeamByID(teamId)
	if err != nil {
		logrus.WithError(err).Error("error getting teams from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if team == nil {
		logrus.WithError(err).Error("team does not exist")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"team does not exist"}`)
		return
	}

	// TODO: Make sure user is part of only one team
	_, err = db.CreateEventUser(
		&EventUser{
			UserID:  reqData.UserID,
			EventID: event.ID,
			TeamID:  team.ID,
		},
	)
	if err != nil {
		logrus.WithError(err).Error("error adding user to team")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"db error adding user to team"}`)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, `{"message":"success"}`)
}

func getEventSubmissions(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	// Make sure the event exists
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

	teamQuery := r.URL.Query().Get("team")
	if teamQuery != "" {
	} else if userQuery := r.URL.Query().Get("team"); userQuery != "" {
	}

	// ?team=
	// 	Check if it's a team event. Error if not
	// ?user=
	// 	All submission by a user for this event
	// ?type=accepted
	//  Filter by submissions that have the status=Accepted
	// ?duplicates=true
	// 	If multiple correct submissions for the same problem, return all of them
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
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event id"}`)
		return
	}

	// Get user ID from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	userId := token.Id

	// Make sure the event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event does not exist"}`)
		return
	}

	// Get user's completed problems for this contest
	submissions, err := db.GetUserEventProblemsStatus(userId, eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting user event problems status")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting user event problems status"}`)
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

	respJSON, err := json.Marshal(statusList)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

// Get contest problems statistics (acceptance counts)
func getEventProblemsStats(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event id"}`)
		return
	}

	// Make sure the event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event does not exist"}`)
		return
	}

	// Get problems for this event
	problems, err := db.GetEventProblems(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event problems")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event problems"}`)
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

	respJSON, err := json.Marshal(stats)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

type CreateQuestionRequest struct {
	Question  string `json:"question"`
	ProblemID *int   `json:"problem_id,omitempty"`
}

type AnswerQuestionRequest struct {
	Answer string `json:"answer"`
}

func getEventQuestions(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event id"}`)
		return
	}

	// verify event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event does not exist"}`)
		return
	}

	questions, err := db.GetEventQuestions(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event questions")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event questions"}`)
		return
	}

	respJSON, err := json.Marshal(questions)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

func createEventQuestion(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event id"}`)
		return
	}

	// verify event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event does not exist"}`)
		return
	}

	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	reqData := new(CreateQuestionRequest)
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

	if reqData.Question == "" {
		logrus.Warn("question text is required")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"question text is required"}`)
		return
	}

	// validate problem exists if specified
	if reqData.ProblemID != nil {
		problem, err := db.GetProblemDescriptionByID(*reqData.ProblemID)
		if err != nil {
			logrus.WithError(err).Error("error getting problem from db")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error getting problem from db"}`)
			return
		}
		if problem == nil {
			logrus.Error("problem does not exist")
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, `{"code":"404", "message":"problem does not exist"}`)
			return
		}
	}

	question := &EventQuestion{
		EventID:    eventId,
		UserID:     token.Id,
		ProblemID:  reqData.ProblemID,
		Question:   reqData.Question,
		IsAnswered: false,
	}

	createdQuestion, err := db.CreateEventQuestion(question)
	if err != nil {
		logrus.WithError(err).Error("error creating question")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error creating question"}`)
		return
	}

	// create notifications for all other users in the event
	err = db.CreateQuestionNotifications(eventId, createdQuestion.ID, token.Id)
	if err != nil {
		logrus.WithError(err).Error("error creating question notifications")
		// don't fail the request if notifications fail, just log the error
	}

	respJSON, err := json.Marshal(createdQuestion)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func answerEventQuestion(w http.ResponseWriter, r *http.Request) {
	eventIdParam := pat.Param(r, "event_id")
	questionIdParam := pat.Param(r, "question_id")

	eventId, err := strconv.Atoi(eventIdParam)
	if err != nil {
		logrus.Warn("bad event id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad event id"}`)
		return
	}

	questionId, err := uuid.Parse(questionIdParam)
	if err != nil {
		logrus.Warn("bad question id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad question id"}`)
		return
	}

	// verify event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting event from db"}`)
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"event does not exist"}`)
		return
	}

	// verify question exists and belongs to event
	question, err := db.GetEventQuestionByID(questionId)
	if err != nil {
		logrus.WithError(err).Error("error getting question from db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting question from db"}`)
		return
	}
	if question == nil {
		logrus.Error("question does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"question does not exist"}`)
		return
	}
	if question.EventID != eventId {
		logrus.Error("question does not belong to this event")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"question does not belong to this event"}`)
		return
	}

	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	reqData := new(AnswerQuestionRequest)
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

	if reqData.Answer == "" {
		logrus.Warn("answer text is required")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"answer text is required"}`)
		return
	}

	err = db.AnswerEventQuestion(questionId, reqData.Answer, token.Id)
	if err != nil {
		logrus.WithError(err).Error("error answering question")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error answering question"}`)
		return
	}

	// create notification for the question author
	err = db.CreateAnswerNotification(eventId, questionId, question.UserID)
	if err != nil {
		logrus.WithError(err).Error("error creating answer notification")
		// don't fail the request if notifications fail, just log the error
	}

	fmt.Fprint(w, `{"message":"question answered successfully"}`)
}

func getNotificationsCount(w http.ResponseWriter, r *http.Request) {
	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	count, err := db.GetUnreadNotificationsCount(token.Id)
	if err != nil {
		logrus.WithError(err).Error("error getting notifications count")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting notifications count"}`)
		return
	}

	type NotificationCount struct {
		Count int64 `json:"count"`
	}

	respJSON, err := json.Marshal(NotificationCount{Count: count})
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

func getUserNotifications(w http.ResponseWriter, r *http.Request) {
	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	notifications, err := db.GetUserNotifications(token.Id)
	if err != nil {
		logrus.WithError(err).Error("error getting user notifications")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting user notifications"}`)
		return
	}

	respJSON, err := json.Marshal(notifications)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}

func markNotificationsAsRead(w http.ResponseWriter, r *http.Request) {
	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	err := db.MarkAllNotificationsAsRead(token.Id)
	if err != nil {
		logrus.WithError(err).Error("error marking notifications as read")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error marking notifications as read"}`)
		return
	}

	fmt.Fprint(w, `{"message":"notifications marked as read"}`)
}
