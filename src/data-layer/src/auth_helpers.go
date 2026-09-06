package main

import (
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func claimsFromContext(r *http.Request) (*NextJudgeClaims, bool) {
	raw := r.Context().Value(ContextTokenKey)
	if raw == nil {
		return nil, false
	}
	claims, ok := raw.(*NextJudgeClaims)
	if !ok || claims == nil {
		return nil, false
	}
	return claims, true
}

func writeNotAuthenticated(w http.ResponseWriter) {
	w.WriteHeader(http.StatusUnauthorized)
	fmt.Fprint(w, `{"code":"401", "message":"Not authenticated"}`)
}

// Global problem access does not grant access through contest membership.
// Contest routes enforce their own visibility and participation rules.
func canReadGlobalProblem(claims *NextJudgeClaims, problem *ProblemDescriptionExt) bool {
	return claims != nil && problem != nil && (problem.Public || claims.Role == AdminRoleEnum)
}

func resolveActingUserID(w http.ResponseWriter, r *http.Request, bodyUserID uuid.UUID) (uuid.UUID, bool) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return uuid.Nil, false
	}
	if bodyUserID != uuid.Nil && bodyUserID != claims.Id {
		if claims.Role != AdminRoleEnum {
			logrus.Error("Unauthorized")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"message":"Unauthorized"}`)
			return uuid.Nil, false
		}
		return bodyUserID, true
	}
	return claims.Id, true
}

func canReadSubmission(r *http.Request, submissionUserID uuid.UUID) bool {
	claims, ok := claimsFromContext(r)
	if !ok {
		return false
	}
	return canReadSubmissionForClaims(claims, submissionUserID)
}

func canReadSubmissionForClaims(claims *NextJudgeClaims, submissionUserID uuid.UUID) bool {
	return submissionUserID == claims.Id || claims.Role >= JudgeRoleEnum
}

func canViewAllEventSubmissions(claims *NextJudgeClaims, event *Event) bool {
	if claims.Role >= JudgeRoleEnum {
		return true
	}
	if claims.Id == event.UserID {
		return true
	}
	return db.UserHasEventRole(claims.Id, event.ID, EventRoleOwner, EventRoleOrganizer, EventRoleJudge)
}

func canManageEvent(claims *NextJudgeClaims, event *Event) bool {
	if claims.Role >= JudgeRoleEnum {
		return true
	}
	if claims.Id == event.UserID {
		return true
	}
	return db.UserHasEventRole(claims.Id, event.ID, EventRoleOwner, EventRoleOrganizer)
}

func canViewEvent(claims *NextJudgeClaims, event *Event) bool {
	if event.Visibility == EventVisibilityPublic || event.Visibility == EventVisibilityUnlisted {
		return true
	}
	if claims == nil {
		return false
	}
	if canManageEvent(claims, event) {
		return true
	}
	eventUser, err := db.GetEventUser(claims.Id, event.ID)
	return err == nil && eventUser != nil
}

func canViewEventStandings(claims *NextJudgeClaims, event *Event) bool {
	if event.Visibility == EventVisibilityPublic {
		return true
	}
	if claims == nil {
		return false
	}
	if canManageEvent(claims, event) {
		return true
	}
	eventUser, err := db.GetEventUser(claims.Id, event.ID)
	return err == nil && eventUser != nil
}

func redactSubmissionForViewer(claims *NextJudgeClaims, submission Submission) Submission {
	if canReadSubmissionForClaims(claims, submission.UserID) {
		return submission
	}
	submission.SourceCode = ""
	submission.Stdout = ""
	submission.Stderr = ""
	return submission
}

func requireAuthenticatedClaims(w http.ResponseWriter, r *http.Request) (*NextJudgeClaims, bool) {
	claims, ok := claimsFromContext(r)
	if !ok {
		writeNotAuthenticated(w)
		return nil, false
	}
	return claims, true
}
