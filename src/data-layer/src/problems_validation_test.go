package main

import "testing"

func TestValidateProblemRequestBody(t *testing.T) {
	t.Parallel()

	valid := &PostProblemRequestBody{
		Title:      "Two Sum",
		Identifier: "two-sum",
		Prompt:     "Find two numbers that add up to target.",
		Difficulty: Medium,
		TestCases: []TestCase{
			{Input: "1 2", ExpectedOutput: "3"},
		},
	}

	tests := []struct {
		name       string
		req        *PostProblemRequestBody
		wantStatus int
		wantMsg    string
	}{
		{
			name:       "valid request",
			req:        valid,
			wantStatus: 0,
		},
		{
			name: "missing title",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.Title = "   "
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "title is empty",
		},
		{
			name: "missing identifier",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.Identifier = ""
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "identifier is empty",
		},
		{
			name: "missing prompt",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.Prompt = ""
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "prompt is empty",
		},
		{
			name: "missing difficulty",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.Difficulty = ""
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "difficulty is required",
		},
		{
			name: "invalid difficulty",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.Difficulty = "IMPOSSIBLE"
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "difficulty is invalid",
		},
		{
			name: "no test cases",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.TestCases = nil
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "at least one test case is required",
		},
		{
			name: "empty test case input",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.TestCases = []TestCase{{Input: " ", ExpectedOutput: "3"}}
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "test case 1 input is empty",
		},
		{
			name: "empty test case output",
			req: func() *PostProblemRequestBody {
				copy := *valid
				copy.TestCases = []TestCase{{Input: "1", ExpectedOutput: ""}}
				return &copy
			}(),
			wantStatus: 400,
			wantMsg:    "test case 1 expected output is empty",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			gotStatus, gotMsg := validateProblemRequestBody(tt.req)
			if gotStatus != tt.wantStatus {
				t.Fatalf("status = %d, want %d", gotStatus, tt.wantStatus)
			}
			if gotMsg != tt.wantMsg {
				t.Fatalf("message = %q, want %q", gotMsg, tt.wantMsg)
			}
		})
	}
}
