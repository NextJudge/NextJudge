package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io/pat"

	"main/src/api"
)

type PostCommentBody struct {
	Body     string     `json:"body"`
	ParentID *uuid.UUID `json:"parent_id"`
}

type CommentResponse struct {
	ID                  uuid.UUID  `json:"id"`
	CommunitySolutionID uuid.UUID  `json:"community_solution_id"`
	ParentID            *uuid.UUID `json:"parent_id,omitempty"`
	UserID              uuid.UUID  `json:"user_id"`
	Depth               int        `json:"depth"`
	Body                string     `json:"body"`
	AuthorName          string     `json:"author_name,omitempty"`
	IsDeleted           bool       `json:"is_deleted"`
	CreatedAt           string     `json:"created_at"`
	UpdatedAt           string     `json:"updated_at"`
}

func listSolutionComments(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	solutionID, ok := parseSolutionIDParam(w, r)
	if !ok {
		return
	}

	solution, problem, allowed, err := solutionAccessContext(solutionID, claims)
	if err != nil {
		logrus.WithError(err).Error("error checking comment access")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error checking comment access", nil)
		return
	}
	if solution == nil || problem == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "community solution not found", nil)
		return
	}
	if !allowed {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "comments not available yet", nil)
		return
	}

	comments, err := db.ListCommentsForSolution(solutionID)
	if err != nil {
		logrus.WithError(err).Error("error listing comments")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error listing comments", nil)
		return
	}

	items := make([]CommentResponse, len(comments))
	for i, comment := range comments {
		items[i] = toCommentResponse(comment)
	}

	writeJSONResponse(w, http.StatusOK, items)
}

func postSolutionComment(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	solutionID, ok := parseSolutionIDParam(w, r)
	if !ok {
		return
	}

	solution, problem, allowed, err := solutionAccessContext(solutionID, claims)
	if err != nil {
		logrus.WithError(err).Error("error checking comment access")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error checking comment access", nil)
		return
	}
	if solution == nil || problem == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "community solution not found", nil)
		return
	}
	if !allowed {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "comments not available yet", nil)
		return
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error reading request body", nil)
		return
	}

	reqData := new(PostCommentBody)
	if err := json.Unmarshal(bodyBytes, reqData); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON", nil)
		return
	}

	commentBody := strings.TrimSpace(reqData.Body)
	if commentBody == "" {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "body is required", nil)
		return
	}

	var parent *Comment
	if reqData.ParentID != nil {
		parent, err = db.GetCommentByID(*reqData.ParentID)
		if err != nil {
			logrus.WithError(err).Error("error loading parent comment")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error creating comment", nil)
			return
		}
		if parent == nil || parent.CommunitySolutionID != solutionID {
			api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid parent comment", nil)
			return
		}
	}

	depth, err := nextCommentDepth(parent)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", err.Error(), nil)
		return
	}

	comment := &Comment{
		CommunitySolutionID: solutionID,
		ParentID:            reqData.ParentID,
		UserID:              claims.Id,
		Depth:               depth,
		Body:                commentBody,
	}

	created, err := db.CreateComment(comment)
	if err != nil {
		logrus.WithError(err).Error("error creating comment")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error creating comment", nil)
		return
	}

	user, err := db.GetUserByID(claims.Id)
	if err != nil {
		logrus.WithError(err).Error("error loading comment author")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error creating comment", nil)
		return
	}

	writeJSONResponse(w, http.StatusCreated, toCommentResponse(CommentExt{
		Comment: *created,
		User:    user,
	}))
}

func deleteSolutionComment(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	commentIDParam := pat.Param(r, "comment_id")
	commentID, err := uuid.Parse(commentIDParam)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "bad comment id", nil)
		return
	}

	comment, err := db.GetCommentByID(commentID)
	if err != nil {
		logrus.WithError(err).Error("error loading comment")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error deleting comment", nil)
		return
	}
	if comment == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "comment not found", nil)
		return
	}
	if comment.DeletedAt != nil {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	solution, _, allowed, err := solutionAccessContext(comment.CommunitySolutionID, claims)
	if err != nil {
		logrus.WithError(err).Error("error checking comment delete access")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error deleting comment", nil)
		return
	}
	if solution == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "comment not found", nil)
		return
	}
	if !allowed && claims.Role != AdminRoleEnum {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "comments not available yet", nil)
		return
	}

	if comment.UserID != claims.Id && claims.Role != AdminRoleEnum {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return
	}

	if err := db.SoftDeleteComment(commentID); err != nil {
		logrus.WithError(err).Error("error soft deleting comment")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error deleting comment", nil)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func solutionAccessContext(solutionID uuid.UUID, claims *NextJudgeClaims) (*CommunitySolution, *ProblemDescriptionExt, bool, error) {
	solution, err := db.GetCommunitySolutionByID(solutionID)
	if err != nil {
		return nil, nil, false, err
	}
	if solution == nil || solution.Status != CommunitySolutionPublished {
		return nil, nil, false, nil
	}

	problem, _, allowed, err := communityAccessContext(solution.ProblemID, claims)
	if err != nil {
		return nil, nil, false, err
	}

	return solution, problem, allowed, nil
}

func parseSolutionIDParam(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	solutionIDParam := pat.Param(r, "solution_id")
	solutionID, err := uuid.Parse(solutionIDParam)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "bad solution id", nil)
		return uuid.Nil, false
	}
	return solutionID, true
}

func toCommentResponse(comment CommentExt) CommentResponse {
	authorName := DeletedUserDisplayName
	body := comment.Body
	isDeleted := comment.DeletedAt != nil
	if isDeleted {
		body = ""
	} else if comment.User != nil && comment.User.Name != "" {
		authorName = comment.User.Name
	}

	return CommentResponse{
		ID:                  comment.ID,
		CommunitySolutionID: comment.CommunitySolutionID,
		ParentID:            comment.ParentID,
		UserID:              comment.UserID,
		Depth:               comment.Depth,
		Body:                body,
		AuthorName:          authorName,
		IsDeleted:           isDeleted,
		CreatedAt:           comment.CreatedAt.UTC().Format(timeRFC3339),
		UpdatedAt:           comment.UpdatedAt.UTC().Format(timeRFC3339),
	}
}
