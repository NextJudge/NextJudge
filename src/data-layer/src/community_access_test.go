package main

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestCanAccessCommunityContent(t *testing.T) {
	publicProblem := &ProblemDescriptionExt{ProblemDescription: ProblemDescription{ID: 1, Public: true}}
	userClaims := &NextJudgeClaims{Id: uuid.New(), Role: UserRoleEnum}
	adminClaims := &NextJudgeClaims{Id: uuid.New(), Role: AdminRoleEnum}

	publicEditorial := &EditorialWithRevision{Editorial: Editorial{Visibility: EditorialPublic}}
	afterSolveEditorial := &EditorialWithRevision{Editorial: Editorial{Visibility: EditorialAfterSolve}}

	tests := []struct {
		name             string
		claims           *NextJudgeClaims
		editorial        *EditorialWithRevision
		hasAccepted      bool
		hasEventAccepted bool
		want             bool
	}{
		{"admin always", adminClaims, afterSolveEditorial, false, false, true},
		{"public editorial", userClaims, publicEditorial, false, false, true},
		{"default after solve blocked", userClaims, nil, false, false, false},
		{"default after solve allowed", userClaims, nil, true, false, true},
		{"after solve blocked", userClaims, afterSolveEditorial, false, false, false},
		{"after solve allowed", userClaims, afterSolveEditorial, true, false, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := canAccessCommunityContent(
				tt.claims,
				publicProblem,
				tt.editorial,
				tt.hasAccepted,
				tt.hasEventAccepted,
			)
			if got != tt.want {
				t.Fatalf("canAccessCommunityContent() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNextCommentDepth(t *testing.T) {
	rootDepth, err := nextCommentDepth(nil)
	if err != nil || rootDepth != 0 {
		t.Fatalf("expected root depth 0, got %d err=%v", rootDepth, err)
	}

	parent := &Comment{Depth: 3}
	childDepth, err := nextCommentDepth(parent)
	if err != nil || childDepth != 4 {
		t.Fatalf("expected depth 4, got %d err=%v", childDepth, err)
	}

	deepParent := &Comment{Depth: 4}
	_, err = nextCommentDepth(deepParent)
	if err == nil {
		t.Fatal("expected depth limit error")
	}

	deletedParent := &Comment{Depth: 1, DeletedAt: ptrTime(time.Now())}
	_, err = nextCommentDepth(deletedParent)
	if err == nil {
		t.Fatal("expected deleted parent error")
	}
}

func ptrTime(value time.Time) *time.Time {
	return &value
}
