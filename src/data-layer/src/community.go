package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

func addCommunityRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/problems/:problem_id/community-solutions"), AuthRequired(listCommunitySolutions))
	mux.HandleFunc(
		pat.Post("/v1/problems/:problem_id/community-solutions"),
		AuthRequired(AuthenticatedRateLimitMiddleware(ugcLimiter, postCommunitySolution)),
	)
	mux.HandleFunc(pat.Get("/v1/community-solutions/:solution_id/comments"), AuthRequired(listSolutionComments))
	mux.HandleFunc(
		pat.Post("/v1/community-solutions/:solution_id/comments"),
		AuthRequired(AuthenticatedRateLimitMiddleware(ugcLimiter, postSolutionComment)),
	)
	mux.HandleFunc(pat.Delete("/v1/comments/:comment_id"), AuthRequired(deleteSolutionComment))
}

type PostCommunitySolutionBody struct {
	Title        string     `json:"title"`
	Explanation  string     `json:"explanation"`
	SourceCode   string     `json:"source_code"`
	LanguageID   *uuid.UUID `json:"language_id"`
	SubmissionID *uuid.UUID `json:"submission_id"`
}

type CommunitySolutionResponse struct {
	ID           uuid.UUID               `json:"id"`
	ProblemID    int                     `json:"problem_id"`
	UserID       uuid.UUID               `json:"user_id"`
	SubmissionID *uuid.UUID              `json:"submission_id,omitempty"`
	LanguageID   *uuid.UUID              `json:"language_id,omitempty"`
	Title        string                  `json:"title"`
	Explanation  string                  `json:"explanation"`
	SourceCode   string                  `json:"source_code,omitempty"`
	Status       CommunitySolutionStatus `json:"status"`
	CreatedAt    string                  `json:"created_at"`
	UpdatedAt    string                  `json:"updated_at"`
	AuthorName   string                  `json:"author_name,omitempty"`
	VoteScore    int                     `json:"vote_score"`
}

func listCommunitySolutions(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	problemID, ok := parseProblemIDParam(w, r)
	if !ok {
		return
	}

	problem, _, allowed, err := communityAccessContext(problemID, claims)
	if err != nil {
		logrus.WithError(err).Error("error checking community solution access")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error checking community access", nil)
		return
	}
	if problem == nil || !canReadGlobalProblem(claims, problem) {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "problem not found", nil)
		return
	}
	if !allowed {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "community solutions not available yet", nil)
		return
	}

	filter := ListCommunitySolutionsFilter{
		ProblemID: problemID,
		Cursor:    r.URL.Query().Get("cursor"),
		Limit:     parseCommunityListLimit(r),
	}

	solutions, nextCursor, err := db.ListCommunitySolutions(filter)
	if err != nil {
		logrus.WithError(err).Error("error listing community solutions")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error listing community solutions", nil)
		return
	}

	items := make([]CommunitySolutionResponse, len(solutions))
	for i, solution := range solutions {
		items[i] = toCommunitySolutionResponse(solution)
	}

	response := api.NewCursorPage(items, nextCursor)
	writeJSONResponse(w, http.StatusOK, response)
}

func postCommunitySolution(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	problemID, ok := parseProblemIDParam(w, r)
	if !ok {
		return
	}

	problem, _, allowed, err := communityAccessContext(problemID, claims)
	if err != nil {
		logrus.WithError(err).Error("error checking community solution access")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error checking community access", nil)
		return
	}
	if problem == nil || !canReadGlobalProblem(claims, problem) {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "problem not found", nil)
		return
	}
	if !allowed {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "community solutions not available yet", nil)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error reading request body", nil)
		return
	}

	reqData := new(PostCommunitySolutionBody)
	if err := json.Unmarshal(body, reqData); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON", nil)
		return
	}

	title := strings.TrimSpace(reqData.Title)
	explanation := strings.TrimSpace(reqData.Explanation)
	if title == "" || explanation == "" {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "title and explanation are required", nil)
		return
	}

	if reqData.SubmissionID != nil {
		submission, err := db.GetSubmission(*reqData.SubmissionID)
		if err != nil {
			logrus.WithError(err).Error("error validating submission for community solution")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error validating submission", nil)
			return
		}
		if submission == nil || submission.UserID != claims.Id || submission.ProblemID != problemID || submission.Status != Accepted {
			api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "submission must be your accepted solution for this problem", nil)
			return
		}
	}

	solution := &CommunitySolution{
		ProblemID:    problemID,
		UserID:       claims.Id,
		SubmissionID: reqData.SubmissionID,
		LanguageID:   reqData.LanguageID,
		Title:        title,
		Explanation:  explanation,
		SourceCode:   strings.TrimSpace(reqData.SourceCode),
		Status:       CommunitySolutionPublished,
	}

	created, err := db.CreateCommunitySolution(solution)
	if err != nil {
		logrus.WithError(err).Error("error creating community solution")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error creating community solution", nil)
		return
	}

	user, err := db.GetUserByID(claims.Id)
	if err != nil {
		logrus.WithError(err).Error("error loading community solution author")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error creating community solution", nil)
		return
	}

	response := toCommunitySolutionResponse(CommunitySolutionExt{
		CommunitySolution: *created,
		User:              user,
	})
	writeJSONResponse(w, http.StatusCreated, response)
}

func communityAccessContext(problemID int, claims *NextJudgeClaims) (*ProblemDescriptionExt, *EditorialWithRevision, bool, error) {
	problem, err := db.GetProblemDescriptionByID(problemID)
	if err != nil {
		return nil, nil, false, err
	}
	if problem == nil {
		return nil, nil, false, nil
	}

	editorial, err := db.GetEditorialForProblem(problemID)
	if err != nil {
		return nil, nil, false, err
	}

	allowed, err := canAccessCommunityForUser(
		claims,
		problem,
		editorial,
		db.UserHasAcceptedProblem,
		db.UserHasEventAcceptedProblem,
	)
	if err != nil {
		return nil, nil, false, err
	}

	return problem, editorial, allowed, nil
}

func parseProblemIDParam(w http.ResponseWriter, r *http.Request) (int, bool) {
	problemIDParam := pat.Param(r, "problem_id")
	problemID, err := strconv.Atoi(problemIDParam)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "bad problem id", nil)
		return 0, false
	}
	return problemID, true
}

func parseCommunityListLimit(r *http.Request) int {
	limitParam := r.URL.Query().Get("limit")
	if limitParam == "" {
		return api.DefaultCursorPageLimit
	}
	limit, err := strconv.Atoi(limitParam)
	if err != nil {
		return api.DefaultCursorPageLimit
	}
	return api.NormalizeCursorLimit(limit)
}

func toCommunitySolutionResponse(solution CommunitySolutionExt) CommunitySolutionResponse {
	authorName := ""
	if solution.User != nil {
		authorName = solution.User.Name
	}
	return CommunitySolutionResponse{
		ID:           solution.ID,
		ProblemID:    solution.ProblemID,
		UserID:       solution.UserID,
		SubmissionID: solution.SubmissionID,
		LanguageID:   solution.LanguageID,
		Title:        solution.Title,
		Explanation:  solution.Explanation,
		SourceCode:   solution.SourceCode,
		Status:       solution.Status,
		CreatedAt:    solution.CreatedAt.UTC().Format(timeRFC3339),
		UpdatedAt:    solution.UpdatedAt.UTC().Format(timeRFC3339),
		AuthorName:   authorName,
		VoteScore:    solution.VoteScore,
	}
}

const timeRFC3339 = "2006-01-02T15:04:05Z07:00"

func writeJSONResponse(w http.ResponseWriter, status int, payload interface{}) {
	respJSON, err := json.Marshal(payload)
	if err != nil {
		logrus.WithError(err).Error("JSON marshal error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(status)
	fmt.Fprint(w, string(respJSON))
}
