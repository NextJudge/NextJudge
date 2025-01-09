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
	mux.HandleFunc(pat.Get("/v1/event_details"), AdminRequired(getEventByTitle))

	mux.HandleFunc(pat.Get("/v1/events/:event_id"), AdminRequired(getEvent))
	mux.HandleFunc(pat.Post("/v1/events"), AdminRequired(postEvent))

	// Get the state of a event (has it started?)
	// mux.HandleFunc(pat.Get("/v1/events/:event_id/state"), AuthRequired(deleteEvent))

	mux.HandleFunc(pat.Delete("/v1/events/:event_id"), AdminRequired(deleteEvent))

	mux.HandleFunc(pat.Post("/v1/events/:event_id/participants"), AdminRequired(addParticipant))
	// mux.HandleFunc(pat.Get("/v1/events/:event_id/participants"), AdminRequired(getParticipants))

	// Get list of problems in event
	mux.HandleFunc(pat.Get("/v1/events/:event_id/problems"), AuthRequired(getEventProblems))
	// Apply a problem to the event
	mux.HandleFunc(pat.Post("/v1/events/:event_id/problems"), AuthRequired(addEventProblem))

	// mux.HandleFunc(pat.Get("/v1/events/:event_id/problems/:problem_id"), AuthRequired(getEventProblem))

	mux.HandleFunc(pat.Get("/v1/events/:event_id/teams"), AuthRequired(getTeams))
	mux.HandleFunc(pat.Post("/v1/events/:event_id/teams"), AuthRequired(createTeam))
	mux.HandleFunc(pat.Get("/v1/events/:event_id/teams/:team_id"), AuthRequired(getTeam))
	mux.HandleFunc(pat.Post("/v1/events/:event_id/teams/:team_id/join"), AuthRequired(joinTeam))

	// Submissions, query determined by query parameters
	mux.HandleFunc(pat.Get("/v1/events/:event_id/submissions"), AuthRequired(getEventSubmissions))

}

func getGeneralEventID() int {
	return 1
}

type GetCompetitionData struct {
	ID          uuid.UUID
	Title       string
	Description string
	StartTime   time.Time
	EndTime     time.Time
}

type PostCompetitionParticipantRequestBody struct {
	UserID uuid.UUID `json:"user_id"`
}

func getEvents(w http.ResponseWriter, r *http.Request) {

	competitions, err := db.GetEvents()
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
		logrus.WithError(err).Warn("competition not found")
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
	Problems         []PostEventProblem `json:"problem_ids"`
	AllowedLanguages []int              `json:"languages"`
	Teams            bool               `json:"teams"`
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

	dbCompetition := &EventWithProblems{
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
		logrus.Infof("%+v", postEventProblem)
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
		dbCompetition.Problems = append(dbCompetition.Problems, eventProblem)
	}

	newCompetition, err := db.CreateEvent(dbCompetition)

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

// TODO: for all the non-null fields, update the corresponding competition object
func putCompetition(w http.ResponseWriter, r *http.Request) {

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
		logrus.WithError(err).Warn("competition not found")
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
	// reqData := new(PostCompetitionParticipantRequestBody)
	// reqBodyBytes, err := io.ReadAll(r.Body)
	// if err != nil {
	// 	logrus.WithError(err).Error("error reading request body")
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
	// 	return
	// }

	// competitionIdParam := pat.Param(r, "event_id")
	// competitionId, err := uuid.Parse(competitionIdParam)
	// if err != nil {
	// 	logrus.Warn("bad uuid")
	// 	w.WriteHeader(http.StatusBadRequest)
	// 	fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
	// 	return
	// }

	// competition, err := db.GetCompetitionByID(competitionId)
	// if err != nil {
	// 	logrus.WithError(err).Error("error retrieving competition")
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
	// 	return
	// }
	// if competition == nil {
	// 	logrus.WithError(err).Warn("competition not found")
	// 	w.WriteHeader(http.StatusNotFound)
	// 	fmt.Fprint(w, `{"code":"404", "message":"competition not found"}`)
	// 	return
	// }

	// now := time.Now()
	// if competition.EndTime.Before(now) {
	// 	logrus.WithFields(logrus.Fields{
	// 		"end_time":     competition.EndTime,
	// 		"current_time": now,
	// 	}).Warn("competition has ended")
	// 	w.WriteHeader(http.StatusBadRequest)
	// 	fmt.Fprint(w, `{"code":"400", "message":"competition has ended"}`)
	// 	return
	// }

	// err = json.Unmarshal(reqBodyBytes, reqData)
	// if err != nil {
	// 	logrus.WithError(err).Error("JSON parse error")
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
	// 	return
	// }

	// user, err := db.GetUserByID(reqData.UserID)
	// if err != nil {
	// 	logrus.WithError(err).Error("error checking for user")
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprint(w, `{"code":"500", "message":"error checking for user"}`)
	// 	return
	// }
	// if user == nil {
	// 	logrus.Warn("user does not exist")
	// 	w.WriteHeader(http.StatusNotFound)
	// 	fmt.Fprint(w, `{"code":"404", "message":"user does not exist"}`)
	// 	return
	// }

	// for _, competitionUser := range competition.Users {
	// 	if competitionUser.ID == user.ID {
	// 		logrus.Warn("user is already registered")
	// 		w.WriteHeader(http.StatusBadRequest)
	// 		fmt.Fprint(w, `{"code":"400", "message":"user is already registered"}`)
	// 		return
	// 	}
	// }
	// competition.Users = append(competition.Users, *user)

	// err = db.UpdateCompetition(competition)
	// if err != nil {
	// 	logrus.WithError(err).Error("error adding user to competition in database")
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprint(w, `{"code":"500", "message":"error adding user to competition in database"}`)
	// 	return
	// }

	// w.WriteHeader(http.StatusNoContent)
}

// Return an EventProblem
// func getEventProblem(w http.ResponseWriter, r *http.Request) {
// 	problemIdParam := pat.Param(r, "problem_id")
// 	problemId, err := strconv.Atoi(problemIdParam)
// 	if err != nil {
// 		logrus.Warn("bad uuid")
// 		w.WriteHeader(http.StatusBadRequest)
// 		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
// 		return
// 	}

// 	problem, err := db.GetPublicEventProblemByID(problemId)
// 	if err != nil {
// 		logrus.WithError(err).Error("error retrieving problem")
// 		w.WriteHeader(http.StatusInternalServerError)
// 		fmt.Fprint(w, `{"code":"500", "message":"error retrieving competition"}`)
// 		return
// 	}
// 	if problem == nil {
// 		logrus.WithError(err).Warn("problem not found")
// 		w.WriteHeader(http.StatusNotFound)
// 		fmt.Fprint(w, `{"code":"404", "message":"competition not found"}`)
// 		return
// 	}

// 	respJSON, err := json.Marshal(problem)
// 	if err != nil {
// 		logrus.WithError(err).Error("JSON parse error")
// 		w.WriteHeader(http.StatusInternalServerError)
// 		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
// 		return
// 	}
// 	fmt.Fprint(w, string(respJSON))
// }

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
	if event == nil {
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
