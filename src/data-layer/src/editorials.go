package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

func addEditorialRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/problems/:problem_id/editorial"), AuthRequired(getProblemEditorial))
}

type GetEditorialResponse struct {
	RevisionID uuid.UUID           `json:"revision_id"`
	ProblemID  int                 `json:"problem_id"`
	Content    string              `json:"content"`
	Visibility EditorialVisibility `json:"visibility"`
}

func getProblemEditorial(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	problemIDParam := pat.Param(r, "problem_id")
	problemID, err := strconv.Atoi(problemIDParam)
	if err != nil {
		logrus.Warn("bad problem id for editorial")
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "bad id", nil)
		return
	}

	problem, err := db.GetProblemDescriptionByID(problemID)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem for editorial")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error retrieving problem", nil)
		return
	}
	if !canReadGlobalProblem(claims, problem) {
		logrus.Warn("problem not found for editorial request")
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "editorial not found", nil)
		return
	}

	editorial, err := db.GetEditorialForProblem(problemID)
	if err != nil {
		logrus.WithError(err).Error("error retrieving editorial")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error retrieving editorial", nil)
		return
	}
	if editorial == nil {
		logrus.Warn("editorial not found")
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "editorial not found", nil)
		return
	}

	allowed, err := canReadEditorialForUser(
		claims,
		problem,
		editorial,
		db.UserHasAcceptedProblem,
		db.UserHasEventAcceptedProblem,
	)
	if err != nil {
		logrus.WithError(err).Error("error checking editorial visibility")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error checking editorial access", nil)
		return
	}
	if !allowed {
		logrus.Warn("editorial access denied by visibility policy")
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "editorial not available yet", nil)
		return
	}

	response := GetEditorialResponse{
		RevisionID: editorial.RevisionID,
		ProblemID:  problemID,
		Content:    editorial.Content,
		Visibility: editorial.Visibility,
	}

	respJSON, err := json.Marshal(response)
	if err != nil {
		logrus.WithError(err).Error("JSON marshal error for editorial")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "JSON parse error", nil)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, string(respJSON))
}
