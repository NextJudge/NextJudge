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
)

func addSubmissionRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/submissions"), AuthRequired(postSubmission))

	mux.HandleFunc(pat.Get("/v1/submissions/:submission_id"), AuthRequired(getSubmission))
	mux.HandleFunc(pat.Get("/v1/submissions/:submission_id/status"), AuthRequired(getSubmissionStatus))

	mux.HandleFunc(pat.Get("/v1/user_submissions/:user_id"), AuthRequired(getSubmissionsForUser))
	mux.HandleFunc(pat.Get("/v1/user_problem_submissions/:user_id/:problem_id"), AuthRequired(getProblemSubmissionsForUser))
	mux.HandleFunc(pat.Patch("/v1/submissions/:submission_id"), AtLeastJudgeRequired(updateSubmissionStatus))
}

type UpdateSubmissionStatusPatchBody struct {
	Status           Status     `json:"status"`
	FailedTestCaseID *uuid.UUID `json:"failed_test_case_id,omitempty"`
	Stdout           string     `json:"stdout"`
	Stderr           string     `json:"stderr"`
}

type PostSubmissionBodyType struct {
	UserID     uuid.UUID `json:"user_id"`
	ProblemID  int       `json:"problem_id"`
	LanguageID uuid.UUID `json:"language_id"`
	SourceCode string    `json:"source_code"`
	// only required if submitting to a contest
	EventID *int `json:"event_id,omitempty"`
}

type PostSubmissionReturnBody struct {
	Id         uuid.UUID `json:"id"`
	Status     Status    `json:"status"`
	SubmitTime time.Time `json:"submit_time"`
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

	// User ID boilerplate
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}
	if token == nil {
		logrus.Error("Token is nil")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	userId := token.Id

	if reqData.UserID != userId && reqData.UserID != uuid.Nil {
		// Admins can access all users
		if token.Role == AdminRoleEnum {
			userId = reqData.UserID
		} else {
			logrus.Error("Unauthorized post submission")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"message":"Unauthorized"}`)
			return
		}
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
		UserID:     reqData.UserID,
		ProblemID:  reqData.ProblemID,
		LanguageID: reqData.LanguageID,
		SourceCode: reqData.SourceCode,
		Status:     Pending,
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
		Id:         response.ID,
		Status:     response.Status,
		SubmitTime: response.SubmitTime,
	}

	respJSON, err := json.Marshal(returnData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	// send submission to judge
	RabbitMQPublishSubmission(response.ID.String())

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

type GetSubmissionReturnBody struct {
	Id     uuid.UUID `json:"id"`
	Status Status    `json:"status"`
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

	// Validate that the submission belongs to this user
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}
	if token == nil {
		logrus.Error("Unauthorized get submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	if submission.UserID != token.Id && !(token.Role >= JudgeRoleEnum) {
		logrus.Error("Unauthorized get submission")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"message":"Unauthorized"}`)
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

	// Validate that the submission belongs to this user
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}
	if token == nil {
		logrus.Error("Unauthorized get submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	if submission.UserID != token.Id && !(token.Role >= JudgeRoleEnum) {
		logrus.Error("Unauthorized get submission")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"message":"Unauthorized"}`)
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

	if reqData.FailedTestCaseID == nil && (reqData.Stderr != "" || reqData.Stdout != "") {
		logrus.Warn("storing output for non failed test cases is not supported")
		// w.WriteHeader(http.StatusBadRequest)
		// fmt.Fprint(w, `{"code":"400", "message":"storing output for non failed test cases is not supported"}`)
		// return
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
	err = db.UpdateSubmission(submission)
	if err != nil {
		logrus.WithError(err).Error("error updating submission status in db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating submission status in db"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getSubmissionsForUser(w http.ResponseWriter, r *http.Request) {
	userIdParam := pat.Param(r, "user_id")
	_, err := uuid.Parse(userIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	// make sure the user has access to this
	token := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"Error in token"}`)
		return
	}

	userId := token.Id

	// only admins can get submissions for other users
	if userId != token.Id && token.Role != AdminRoleEnum {
		logrus.Error("User trying to get data for a different user")
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

	submissions, err := db.GetSubmissionsByUserID(userId)
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
