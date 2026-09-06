package main

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"main/src/api"
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

func writeProblemValidationError(w http.ResponseWriter, r *http.Request, statusCode int, message string) {
	api.WriteAPIError(w, r, statusCode, strconv.Itoa(statusCode), message, nil)
}
