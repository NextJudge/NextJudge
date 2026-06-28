package main

import (
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
	mux.HandleFunc(pat.Get("/v1/events/:event_id/teams/me"), AuthRequired(getMyEventTeam))
	mux.HandleFunc(pat.Post("/v1/events/:event_id/teams"), AuthRequired(createTeam))
	mux.HandleFunc(pat.Get("/v1/events/:event_id/teams/:team_id"), AuthRequired(getTeam))
	mux.HandleFunc(pat.Post("/v1/events/:event_id/teams/:team_id/join"), AuthRequired(joinTeam))

	mux.HandleFunc(pat.Post("/v1/events/:event_id/end"), AdminRequired(endEventEarly))

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
