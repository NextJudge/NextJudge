package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

func addSubmissionRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/submissions"), postSubmission)
	mux.HandleFunc(pat.Get("/v1/submissions/:submission_id"), getSubmission)
	mux.HandleFunc(pat.Get("/v1/user_submissions/:user_id"), getSubmissionsForUser)
	mux.HandleFunc(pat.Get("/v1/user_problem_submissions/:user_id/:problem_id"), getProblemSubmissionsForUser)
	mux.HandleFunc(pat.Patch("/v1/submissions/:submission_id"), updateSubmissionStatus)
}

type UpdateSubmissionStatusPatchBody struct {
	Status           Status     `json:"status"`
	FailedTestCaseID *uuid.UUID `json:"failed_test_case_id,omitempty"`
	Stdout           string     `json:"stdout"`
	Stderr           string     `json:"stderr"`
}

func postSubmission(w http.ResponseWriter, r *http.Request) {
	reqData := new(Submission)
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

	problem, err := db.GetProblemByID(reqData.ProblemID)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing problem"}`)
		return
	}
	if problem == nil {
		logrus.Warn("problem does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem does not exist"}`)
		return
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

	reqData.Status = Pending
	reqData.FailedTestCaseID = nil
	reqData.Stderr = ""
	reqData.Stdout = ""
	response, err := db.CreateSubmission(reqData)
	if err != nil {
		logrus.WithError(err).Error("error inserting submission into db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting submission into db"}`)
		return
	}

	respJSON, err := json.Marshal(response)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	RabbitMQPublishSubmission(response.ID.String())

	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

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
	userId, err := uuid.Parse(userIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
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
