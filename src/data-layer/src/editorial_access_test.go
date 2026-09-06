package main

import (
	"testing"

	"github.com/google/uuid"
)

func TestCanReadEditorial(t *testing.T) {
	publicProblem := &ProblemDescriptionExt{ProblemDescription: ProblemDescription{ID: 1, Public: true}}
	privateProblem := &ProblemDescriptionExt{ProblemDescription: ProblemDescription{ID: 2, Public: false}}
	userClaims := &NextJudgeClaims{Id: uuid.New(), Role: UserRoleEnum}
	adminClaims := &NextJudgeClaims{Id: uuid.New(), Role: AdminRoleEnum}

	publicEditorial := &EditorialWithRevision{Editorial: Editorial{Visibility: EditorialPublic}}
	afterSolveEditorial := &EditorialWithRevision{Editorial: Editorial{Visibility: EditorialAfterSolve}}
	afterEventEditorial := &EditorialWithRevision{Editorial: Editorial{Visibility: EditorialAfterEvent}}

	tests := []struct {
		name             string
		claims           *NextJudgeClaims
		problem          *ProblemDescriptionExt
		editorial        *EditorialWithRevision
		hasAccepted      bool
		hasEventAccepted bool
		want             bool
	}{
		{"admin always", adminClaims, privateProblem, afterSolveEditorial, false, false, true},
		{"public editorial", userClaims, publicProblem, publicEditorial, false, false, true},
		{"after solve blocked", userClaims, publicProblem, afterSolveEditorial, false, false, false},
		{"after solve allowed", userClaims, publicProblem, afterSolveEditorial, true, false, true},
		{"after event blocked", userClaims, publicProblem, afterEventEditorial, true, false, false},
		{"after event allowed", userClaims, publicProblem, afterEventEditorial, false, true, true},
		{"private problem denied", userClaims, privateProblem, publicEditorial, false, false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := canReadEditorial(
				tt.claims,
				tt.problem,
				tt.editorial,
				tt.hasAccepted,
				tt.hasEventAccepted,
			)
			if got != tt.want {
				t.Fatalf("canReadEditorial() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestCanReadEditorialForUser(t *testing.T) {
	publicProblem := &ProblemDescriptionExt{ProblemDescription: ProblemDescription{ID: 7, Public: true}}
	userClaims := &NextJudgeClaims{Id: uuid.New(), Role: UserRoleEnum}
	editorial := &EditorialWithRevision{Editorial: Editorial{Visibility: EditorialAfterSolve}}

	allowed, err := canReadEditorialForUser(
		userClaims,
		publicProblem,
		editorial,
		func(userID uuid.UUID, problemID int) (bool, error) {
			return problemID == 7, nil
		},
		func(userID uuid.UUID, problemID int) (bool, error) {
			return false, nil
		},
	)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !allowed {
		t.Fatal("expected editorial access when user has accepted")
	}
}
