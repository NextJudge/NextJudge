package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

func addSubmissionRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/submissions"), AuthRequired(AuthenticatedRateLimitMiddleware(submissionLimiter, postSubmission)))
	mux.HandleFunc(pat.Get("/v1/submissions"), AuthRequired(listSubmissions))

	mux.HandleFunc(pat.Get("/v1/submissions/:submission_id"), AuthRequired(getSubmission))
	mux.HandleFunc(pat.Get("/v1/submissions/:submission_id/status"), AuthRequired(getSubmissionStatus))
	mux.HandleFunc(pat.Get("/v1/submissions/:submission_id/runs"), AuthRequired(getSubmissionRuns))

	mux.HandleFunc(pat.Get("/v1/user_submissions/:user_id"), AuthRequired(getSubmissionsForUser))
	mux.HandleFunc(pat.Get("/v1/user_problem_submissions/:user_id/:problem_id"), AuthRequired(getProblemSubmissionsForUser))
	mux.HandleFunc(pat.Patch("/v1/submissions/:submission_id"), AtLeastJudgeRequired(updateSubmissionStatus))
}

type TestCaseResultRequest struct {
	TestCaseID string `json:"test_case_id"`
	Stdout     string `json:"stdout"`
	Stderr     string `json:"stderr"`
	Passed     bool   `json:"passed"`
}

type UpdateSubmissionStatusPatchBody struct {
	RunID            *uuid.UUID              `json:"run_id,omitempty"`
	Status           Status                  `json:"status"`
	FailedTestCaseID *uuid.UUID              `json:"failed_test_case_id,omitempty"`
	Stdout           string                  `json:"stdout"`
	Stderr           string                  `json:"stderr"`
	TestCaseResults  []TestCaseResultRequest `json:"test_case_results,omitempty"`
	TimeElapsed      *float32                `json:"time_elapsed,omitempty"`
	JudgeWorkerID    *string                 `json:"judge_worker_id,omitempty"`
	Reason           *string                 `json:"reason,omitempty"`
}

type PostSubmissionBodyType struct {
	UserID      uuid.UUID `json:"user_id"`
	ProblemID   int       `json:"problem_id"`
	LanguageID  uuid.UUID `json:"language_id"`
	SourceCode  string    `json:"source_code"`
	TimeElapsed float32   `json:"time_elapsed"`
	// only required if submitting to a contest
	EventID *int `json:"event_id,omitempty"`
}

type PostSubmissionReturnBody struct {
	Id          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
	ProblemID   int       `json:"problem_id"`
	LanguageID  uuid.UUID `json:"language_id"`
	SourceCode  string    `json:"source_code"`
	TimeElapsed float32   `json:"time_elapsed"`
	Status      Status    `json:"status"`
	SubmitTime  time.Time `json:"submit_time"`
}

func postSubmission(w http.ResponseWriter, r *http.Request) {
	// TODO: make this a separate type
	reqData := new(PostSubmissionBodyType)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	userId, ok := resolveActingUserID(w, r, reqData.UserID)
	if !ok {
		return
	}
	reqData.UserID = userId

	problemDesc, err := db.GetProblemDescriptionByID(reqData.ProblemID)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing problem"}`)
		return
	}

	if problemDesc == nil {
		logrus.Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	claims, _ := claimsFromContext(r)
	if (reqData.EventID == nil || *reqData.EventID == 0) && !canReadGlobalProblem(claims, problemDesc) {
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	var eventProblem *EventProblemExt
	var event *Event

	// if contest submission, validate event and get event details
	if reqData.EventID != nil && *reqData.EventID != 0 {
		event, err = db.GetEventByID(*reqData.EventID)
		if err != nil {
			logrus.WithError(err).Error("error checking for existing event")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for existing event"}`)
			return
		}
		if event == nil {
			logrus.Warn("event not found")
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, `{"code":"404", "message":"event not found"}`)
			return
		}

		eventProblem, err = db.GetEventProblemExtByID(*reqData.EventID, reqData.ProblemID)
		if err != nil {
			logrus.WithError(err).Error("error checking for event problem")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for event problem"}`)
			return
		}
		if eventProblem == nil {
			logrus.Warn("problem is not part of this event")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"problem is not part of this event"}`)
			return
		}
	}

	language, err := db.GetLanguage(reqData.LanguageID)
	if err != nil {
		logrus.WithError(err).Error("error checking for language")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing problem"}`)
		return
	}
	if language == nil {
		logrus.Warn("language does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"language does not exist"}`)
		return
	}

	user, err := db.GetUserByID(reqData.UserID)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user == nil {
		logrus.Warn("user does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user does not exist"}`)
		return
	}

	timeNow := time.Now()

	// if contest submission, check event permissions
	if event != nil {
		canSubmit, err := userCanSubmitToEventId(user, event, timeNow)
		if err != nil {
			logrus.Error(err)
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error submitting"}`)
			return
		}
		if !canSubmit {
			logrus.Error("user cannot submit to this event")
			w.WriteHeader(http.StatusForbidden)
			fmt.Fprint(w, `{"code":"403", "message":"cannot submit to this event"}`)
			return
		}
	}

	newSubmission := &Submission{
		UserID:      reqData.UserID,
		ProblemID:   reqData.ProblemID,
		LanguageID:  reqData.LanguageID,
		SourceCode:  reqData.SourceCode,
		TimeElapsed: 0,
		Status:      Pending,
	}

	// if contest submission, add event information
	if reqData.EventID != nil && *reqData.EventID != 0 {
		newSubmission.EventID = reqData.EventID
		if eventProblem != nil {
			newSubmission.EventProblemID = &eventProblem.ID
		}
	}

	response, err := db.CreateSubmission(newSubmission)
	if err != nil {
		logrus.WithError(err).Error("error inserting submission into db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting submission into db"}`)
		return
	}

	returnData := PostSubmissionReturnBody{
		Id:          response.ID,
		UserID:      response.UserID,
		ProblemID:   response.ProblemID,
		LanguageID:  response.LanguageID,
		SourceCode:  response.SourceCode,
		TimeElapsed: response.TimeElapsed,
		Status:      response.Status,
		SubmitTime:  response.SubmitTime,
	}

	respJSON, err := json.Marshal(returnData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	// send submission to judge (reaper retries if this fails)
	tryEnqueueProblemSubmission(response.ID)
	recordSubmissionIntegritySignals(r, response.UserID, response.ID, response.EventID)

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

type GetSubmissionReturnBody struct {
	Id     uuid.UUID `json:"id"`
	Status Status    `json:"status"`
}

func isValidListSubmissionStatus(status Status) bool {
	switch status {
	case Accepted, WrongAnswer, TimeLimitExceeded, MemoryLimitExceeded, RuntimeError, CompileTimeError, Pending:
		return true
	default:
		return false
	}
}

func parseSubmissionListLimit(r *http.Request) int {
	limitParam := r.URL.Query().Get("limit")
	if limitParam == "" {
		return api.DefaultCursorPageLimit
	}
	limit, err := strconv.Atoi(limitParam)
	if err != nil {
		return api.DefaultCursorPageLimit
	}
	return api.NormalizeCursorLimit(limit)
}

func listSubmissions(w http.ResponseWriter, r *http.Request) {
	claims, ok := claimsFromContext(r)
	if !ok {
		writeNotAuthenticated(w)
		return
	}

	filter := ListSubmissionsFilter{
		UserID: claims.Id,
		Limit:  parseSubmissionListLimit(r),
	}

	if statusParam := r.URL.Query().Get("status"); statusParam != "" {
		status := Status(statusParam)
		if !isValidListSubmissionStatus(status) {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"invalid status"}`)
			return
		}
		filter.Status = &status
	}

	if problemParam := r.URL.Query().Get("problem_id"); problemParam != "" {
		problemID, err := strconv.Atoi(problemParam)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"invalid problem_id"}`)
			return
		}
		filter.ProblemID = &problemID
	}

	if languageParam := r.URL.Query().Get("language_id"); languageParam != "" {
		languageID, err := uuid.Parse(languageParam)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"invalid language_id"}`)
			return
		}
		filter.LanguageID = &languageID
	}

	if cursorParam := r.URL.Query().Get("cursor"); cursorParam != "" {
		cursorTime, cursorID, err := api.DecodeTimeIDCursor(cursorParam)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"invalid cursor"}`)
			return
		}
		filter.CursorSubmitTime = &cursorTime
		filter.CursorID = &cursorID
	}

	submissions, nextCursor, err := db.ListSubmissions(filter)
	if err != nil {
		logrus.WithError(err).Error("error listing submissions")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error listing submissions"}`)
		return
	}

	WriteJSON(w, http.StatusOK, api.NewCursorPage(submissions, nextCursor))
}

func getSubmissionStatus(w http.ResponseWriter, r *http.Request) {
	submissionIdParam := pat.Param(r, "submission_id")
	submissionId, err := uuid.Parse(submissionIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	submission, err := db.GetSubmission(submissionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving submission"}`)
		return
	}
	if submission == nil {
		logrus.Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return
	}

	if !canReadSubmission(r, submission.UserID) {
		if _, ok := claimsFromContext(r); !ok {
			writeNotAuthenticated(w)
		} else {
			logrus.Error("Unauthorized get submission")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"message":"Unauthorized"}`)
		}
		return
	}

	returnData := GetSubmissionReturnBody{
		Id:     submission.ID,
		Status: submission.Status,
	}

	respJSON, err := json.Marshal(returnData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

// Judge calls this to get submission info. Users can call it too.
func getSubmission(w http.ResponseWriter, r *http.Request) {
	submissionIdParam := pat.Param(r, "submission_id")
	submissionId, err := uuid.Parse(submissionIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	submission, err := db.GetSubmission(submissionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving submission"}`)
		return
	}
	if submission == nil {
		logrus.Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return
	}

	if !canReadSubmission(r, submission.UserID) {
		if _, ok := claimsFromContext(r); !ok {
			writeNotAuthenticated(w)
		} else {
			logrus.Error("Unauthorized get submission")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"message":"Unauthorized"}`)
		}
		return
	}

	respJSON, err := json.Marshal(submission)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func getSubmissionRuns(w http.ResponseWriter, r *http.Request) {
	submissionIdParam := pat.Param(r, "submission_id")
	submissionId, err := uuid.Parse(submissionIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	submission, err := db.GetSubmission(submissionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving submission"}`)
		return
	}
	if submission == nil {
		logrus.Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return
	}

	if !canReadSubmission(r, submission.UserID) {
		if _, ok := claimsFromContext(r); !ok {
			writeNotAuthenticated(w)
		} else {
			logrus.Error("Unauthorized get submission runs")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"message":"Unauthorized"}`)
		}
		return
	}

	runs, err := db.GetSubmissionRuns(submissionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submission runs")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving submission runs"}`)
		return
	}

	respJSON, err := json.Marshal(runs)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func updateSubmissionStatus(w http.ResponseWriter, r *http.Request) {
	submissionIdParam := pat.Param(r, "submission_id")
	submissionId, err := uuid.Parse(submissionIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	submission, err := db.GetSubmission(submissionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving submission"}`)
		return
	}
	if submission == nil {
		logrus.Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return
	}

	reqData := new(UpdateSubmissionStatusPatchBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	if !(reqData.Status == Accepted ||
		reqData.Status == WrongAnswer ||
		reqData.Status == TimeLimitExceeded ||
		reqData.Status == MemoryLimitExceeded ||
		reqData.Status == RuntimeError ||
		reqData.Status == CompileTimeError) {
		logrus.Warn("unsupported status")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"unsupported status for PATCH"}`)
		return
	}

	if (reqData.FailedTestCaseID != nil &&
		!(reqData.Status == WrongAnswer ||
			reqData.Status == TimeLimitExceeded ||
			reqData.Status == MemoryLimitExceeded ||
			reqData.Status == RuntimeError)) ||
		(reqData.FailedTestCaseID == nil &&
			!(reqData.Status == Accepted ||
				reqData.Status == CompileTimeError)) {
		logrus.Warn("must have a failed test cases if and only if the status is a non-compile failure")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"must have a failed test cases if and only if the status is a non-compile failure"}`)
		return
	}

	if reqData.FailedTestCaseID == nil && (reqData.Stderr != "" || reqData.Stdout != "") &&
		reqData.Status != Accepted && reqData.Status != CompileTimeError {
		logrus.Warn("storing output for non failed test cases is not supported")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"storing output for non failed test cases is not supported"}`)
		return
	}

	if reqData.FailedTestCaseID != nil {
		testCase, err := db.GetTestCase(*reqData.FailedTestCaseID)
		if err != nil {
			logrus.WithError(err).Error("error checking test case's problem")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking test case's problem"}`)
			return
		}
		if testCase == nil {
			logrus.WithFields(logrus.Fields{
				"test_case_id":          *reqData.FailedTestCaseID,
				"submission_problem_id": submission.ProblemID,
			}).Warn("test case does not exist")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"test case does not exist"}`)
			return
		}
		if testCase.ProblemID != submission.ProblemID {
			logrus.WithFields(logrus.Fields{
				"test_case_problem_id":  testCase.ID,
				"submission_problem_id": submission.ProblemID,
			}).Warn("test case is not for this problem")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"test case is not for this problem"}`)
			return
		}
	}

	submission.FailedTestCaseID = reqData.FailedTestCaseID
	submission.Status = reqData.Status
	submission.Stderr = reqData.Stderr
	submission.Stdout = reqData.Stdout
	if reqData.TimeElapsed != nil {
		submission.TimeElapsed = *reqData.TimeElapsed
	}

	// convert test case results from request to model
	if len(reqData.TestCaseResults) > 0 {
		submission.TestCaseResults = make([]SubmissionTestCaseResult, len(reqData.TestCaseResults))
		for i, tcr := range reqData.TestCaseResults {
			testCaseID, parseErr := uuid.Parse(tcr.TestCaseID)
			if parseErr != nil {
				logrus.WithError(parseErr).Warn("invalid test_case_id in results")
				continue
			}
			submission.TestCaseResults[i] = SubmissionTestCaseResult{
				TestCaseID: testCaseID,
				Stdout:     tcr.Stdout,
				Stderr:     tcr.Stderr,
				Passed:     tcr.Passed,
			}
		}
	}

	logrus.WithFields(logrus.Fields{
		"submission_id": submission.ID,
		"results_count": len(submission.TestCaseResults),
	}).Info("Updating submission with test case results")

	var run *SubmissionRun
	if reqData.RunID != nil {
		run, err = db.GetSubmissionRun(*reqData.RunID)
		if err != nil {
			logrus.WithError(err).Error("error retrieving submission run")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving submission run"}`)
			return
		}
		if run == nil || run.SubmissionID != submission.ID {
			logrus.Warn("submission run not found for submission")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"submission run not found"}`)
			return
		}
	} else {
		run, err = db.GetLatestPendingSubmissionRun(submission.ID)
		if err != nil {
			logrus.WithError(err).Error("error retrieving pending submission run")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving submission run"}`)
			return
		}
		if run == nil {
			run, err = db.CreateSubmissionRun(submission.ID)
			if err != nil {
				logrus.WithError(err).Error("failed to create submission run")
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprint(w, `{"code":"500", "message":"failed to create submission run"}`)
				return
			}
		}
	}

	finishedAt := time.Now()
	runUpdate := &SubmissionRun{
		ID:            run.ID,
		Status:        reqData.Status,
		Reason:        reqData.Reason,
		JudgeWorkerID: reqData.JudgeWorkerID,
		Stdout:        reqData.Stdout,
		Stderr:        reqData.Stderr,
		FinishedAt:    &finishedAt,
	}
	if reqData.TimeElapsed != nil {
		runUpdate.TimeElapsed = reqData.TimeElapsed
	}

	err = db.UpdateSubmissionRun(runUpdate)
	if err != nil {
		logrus.WithError(err).Error("error updating submission run in db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating submission run in db"}`)
		return
	}

	err = db.UpdateSubmission(submission, run.ID)
	if err != nil {
		logrus.WithError(err).Error("error updating submission status in db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating submission status in db"}`)
		return
	}

	if reqData.Status == Accepted {
		queueSubmissionFingerprint(submission.ID, submission.ProblemID)
	}

	w.WriteHeader(http.StatusNoContent)
}

func getSubmissionsForUser(w http.ResponseWriter, r *http.Request) {
	userIdParam := pat.Param(r, "user_id")
	targetUserID, err := uuid.Parse(userIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	if claims, ok := claimsFromContext(r); ok {
		if targetUserID != claims.Id && claims.Role != AdminRoleEnum {
			logrus.Error("User trying to get data for a different user")
			w.WriteHeader(http.StatusForbidden)
			fmt.Fprint(w, `{"code":"403", "message":"forbidden"}`)
			return
		}
	} else {
		writeNotAuthenticated(w)
		return
	}

	user, err := db.GetUserByID(targetUserID)
	if err != nil {
		logrus.WithError(err).Error("error retrieving user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving user"}`)
		return
	}
	if user == nil {
		logrus.WithError(err).Warn("user not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user not found"}`)
		return
	}

	submissions, err := db.GetSubmissionsByUserID(targetUserID)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submissions")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving user"}`)
		return
	}

	respJSON, err := json.Marshal(submissions)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func getProblemSubmissionsForUser(w http.ResponseWriter, r *http.Request) {
	userIdParam := pat.Param(r, "user_id")
	problemIdParam := pat.Param(r, "problem_id")

	userId, err := uuid.Parse(userIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	// Make sure the user has access to this
	token := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"Error in token"}`)
		return
	}

	// Only admins can users that are not themselves
	if userId != token.Id && token.Role != AdminRoleEnum {
		logrus.Error("Authentication error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Authentication error"}`)
		return
	}

	user, err := db.GetUserByID(userId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving user"}`)
		return
	}
	if user == nil {
		logrus.WithError(err).Warn("user not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user not found"}`)
		return
	}

	submissions, err := db.GetProblemSubmissionsByUserID(userId, problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submissions")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving user"}`)
		return
	}

	respJSON, err := json.Marshal(submissions)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}
