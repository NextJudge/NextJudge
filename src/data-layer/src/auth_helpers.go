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
	return submissionUserID == claims.Id || claims.Role >= JudgeRoleEnum
}

func requireAuthenticatedClaims(w http.ResponseWriter, r *http.Request) (*NextJudgeClaims, bool) {
	claims, ok := claimsFromContext(r)
	if !ok {
		writeNotAuthenticated(w)
		return nil, false
	}
	return claims, true
}
