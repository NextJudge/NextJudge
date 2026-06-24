package main

import (
	"testing"

	"github.com/google/uuid"
)

func TestSkipUserExistenceCheck(t *testing.T) {
	t.Parallel()

	userID := uuid.New()

	tests := []struct {
		name   string
		claims *NextJudgeClaims
		want   bool
	}{
		{
			name:   "judge service token skips check",
			claims: &NextJudgeClaims{Id: uuid.Nil, Role: JudgeRoleEnum},
			want:   true,
		},
		{
			name:   "user token requires check",
			claims: &NextJudgeClaims{Id: userID, Role: UserRoleEnum},
			want:   false,
		},
		{
			name:   "admin token requires check",
			claims: &NextJudgeClaims{Id: userID, Role: AdminRoleEnum},
			want:   false,
		},
		{
			name:   "judge role with user id requires check",
			claims: &NextJudgeClaims{Id: userID, Role: JudgeRoleEnum},
			want:   false,
		},
		{
			name:   "nil user id with user role requires check",
			claims: &NextJudgeClaims{Id: uuid.Nil, Role: UserRoleEnum},
			want:   false,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := skipUserExistenceCheck(tt.claims)
			if got != tt.want {
				t.Fatalf("skipUserExistenceCheck() = %v, want %v", got, tt.want)
			}
		})
	}
}
