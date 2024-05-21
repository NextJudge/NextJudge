package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

func addSubmissionRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/submissions"), postSubmission)
	mux.HandleFunc(pat.Get("/v1/submissions/:submission_id"), getSubmission)
	mux.HandleFunc(pat.Patch("/v1/submissions/:submission_id"), updateSubmissionStatus)
}

type UpdateSubmissionStatusPatchBody struct {
	Status           Status `json:"status"`
	FailedTestCaseID *int   `json:"failed_test_case_id,omitempty"`
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
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func getSubmission(w http.ResponseWriter, r *http.Request) {
	submissionIdParam := pat.Param(r, "submission_id")

	submissionId, err := strconv.Atoi(submissionIdParam)
	if err != nil {
		logrus.WithError(err).Error("submission id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"submission id must be int"}`)
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

	submissionId, err := strconv.Atoi(submissionIdParam)
	if err != nil {
		logrus.WithError(err).Error("submission id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"submission id must be int"}`)
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

	if (reqData.Status != WrongAnswer && reqData.FailedTestCaseID != nil) ||
		(reqData.Status == WrongAnswer && reqData.FailedTestCaseID == nil) {
		logrus.Warn("status must be WRONG_ANSWER if and only if there is a failed test case")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"status must be WRONG_ANSWER if and only if there is a failed test case"}`)
		return
	}

	if reqData.FailedTestCaseID != nil && *reqData.FailedTestCaseID != 0 {
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
	err = db.UpdateSubmission(submission)
	if err != nil {
		logrus.WithError(err).Error("error updating submission status in db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating submission status in db"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
