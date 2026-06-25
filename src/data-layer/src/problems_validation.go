package main

import (
	"fmt"
	"net/http"
	"strings"
)

func validateProblemRequestBody(req *PostProblemRequestBody) (int, string) {
	if strings.TrimSpace(req.Title) == "" {
		return http.StatusBadRequest, "title is empty"
	}

	if strings.TrimSpace(req.Identifier) == "" {
		return http.StatusBadRequest, "identifier is empty"
	}

	if strings.TrimSpace(req.Prompt) == "" {
		return http.StatusBadRequest, "prompt is empty"
	}

	if req.Difficulty == "" {
		return http.StatusBadRequest, "difficulty is required"
	}

	switch req.Difficulty {
	case VeryEasy, Easy, Medium, Hard, VeryHard:
	default:
		return http.StatusBadRequest, "difficulty is invalid"
	}

	if len(req.TestCases) == 0 {
		return http.StatusBadRequest, "at least one test case is required"
	}

	for i, testCase := range req.TestCases {
		if strings.TrimSpace(testCase.Input) == "" {
			return http.StatusBadRequest, fmt.Sprintf("test case %d input is empty", i+1)
		}
		if strings.TrimSpace(testCase.ExpectedOutput) == "" {
			return http.StatusBadRequest, fmt.Sprintf("test case %d expected output is empty", i+1)
		}
	}

	return 0, ""
}

func writeProblemValidationError(w http.ResponseWriter, statusCode int, message string) {
	w.WriteHeader(statusCode)
	fmt.Fprintf(w, `{"code":"%d", "message":"%s"}`, statusCode, message)
}
