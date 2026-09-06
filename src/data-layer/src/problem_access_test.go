package main

import "testing"

func TestGlobalProblemAccess(t *testing.T) {
	public := &ProblemDescriptionExt{ProblemDescription: ProblemDescription{Public: true}}
	private := &ProblemDescriptionExt{ProblemDescription: ProblemDescription{Public: false}}
	tests := []struct {
		name    string
		claims  *NextJudgeClaims
		problem *ProblemDescriptionExt
		want    bool
	}{
		{"anonymous public", nil, public, false},
		{"user public", &NextJudgeClaims{Role: UserRoleEnum}, public, true},
		{"user private", &NextJudgeClaims{Role: UserRoleEnum}, private, false},
		{"judge private global route", &NextJudgeClaims{Role: JudgeRoleEnum}, private, false},
		{"admin private", &NextJudgeClaims{Role: AdminRoleEnum}, private, true},
		{"admin missing", &NextJudgeClaims{Role: AdminRoleEnum}, nil, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := canReadGlobalProblem(tt.claims, tt.problem); got != tt.want {
				t.Fatalf("access = %v, want %v", got, tt.want)
			}
		})
	}
}
