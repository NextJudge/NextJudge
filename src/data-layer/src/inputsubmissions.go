package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

type CustomInputSubmissionResultStatus struct {
	Status string `json:"status"`
}

type CustomInputSubmissionResult struct {
	Status   Status  `json:"status"`
	Stdout   string  `json:"stdout"`
	Stderr   string  `json:"stderr"`
	Finished bool    `json:"finished"`
	Runtime  float64 `json:"runtime"`
}

type CustomInputSubmissionStatusPostBody struct {
	UserID     uuid.UUID `json:"user_id"`
	SourceCode string    `json:"source_code"`
	LanguageID uuid.UUID `json:"language_id"`
	Stdin      string    `json:"stdin"`
}

type UpdateCustomInputSubmissionStatusPatchBody struct {
	Status  Status  `json:"status"`
	Stdout  string  `json:"stdout"`
	Stderr  string  `json:"stderr"`
	Runtime float64 `json:"runtime"`
}

func addInputSubmissionRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/public/input_submissions"), RateLimitMiddleware(postPublicInputSubmission, publicInputLimiter))
	mux.HandleFunc(pat.Get("/v1/public/input_submissions/:submission_id"), getPublicInputSubmission)

	mux.HandleFunc(pat.Post("/v1/bench/input_submissions"), postPublicInputSubmission)
	mux.HandleFunc(pat.Get("/v1/bench/input_submissions/:submission_id"), getPublicInputSubmission)

	mux.HandleFunc(pat.Post("/v1/input_submissions"), AuthRequired(postInputSubmission))
	mux.HandleFunc(pat.Get("/v1/input_submissions/:submission_id"), AuthRequired(getAuthenticatedInputSubmission))
	mux.HandleFunc(pat.Patch("/v1/input_submissions/:submission_id"), AtLeastJudgeRequired(updateCustomInputSubmissionStatus))
}

func createInputSubmissionRecord(reqData *CustomInputSubmissionStatusPostBody) (uuid.UUID, error) {
	var userID *uuid.UUID
	if reqData.UserID != uuid.Nil {
		userID = &reqData.UserID
	}

	record := &InputSubmission{
		UserID:     userID,
		LanguageID: reqData.LanguageID,
		SourceCode: reqData.SourceCode,
		Stdin:      reqData.Stdin,
		Status:     Pending,
		Finished:   false,
	}

	created, err := db.CreateInputSubmission(record)
	if err != nil {
		return uuid.Nil, err
	}

	tryEnqueueInputSubmission(created.ID)
	return created.ID, nil
}

func postInputSubmission(w http.ResponseWriter, r *http.Request) {
	reqData, err := parseInputSubmissionPostBody(r)
	if err != nil {
		writeInputSubmissionError(w, err)
		return
	}

	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	userId := token.Id
	if reqData.UserID != userId && reqData.UserID != uuid.Nil {
		if token.Role == AdminRoleEnum {
			userId = reqData.UserID
		} else {
			logrus.Error("Unauthorized post input submission")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"message":"Unauthorized"}`)
			return
		}
	}
	reqData.UserID = userId

	submissionID, err := createInputSubmissionRecord(reqData)
	if err != nil {
		logrus.WithError(err).Error("error creating input submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error creating input submission"}`)
		return
	}

	fmt.Fprint(w, submissionID.String())
}

func postPublicInputSubmission(w http.ResponseWriter, r *http.Request) {
	reqData, err := parseInputSubmissionPostBody(r)
	if err != nil {
		writeInputSubmissionError(w, err)
		return
	}

	reqData.UserID = uuid.Nil

	submissionID, err := createInputSubmissionRecord(reqData)
	if err != nil {
		logrus.WithError(err).Error("error creating public input submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error creating input submission"}`)
		return
	}

	fmt.Fprint(w, submissionID.String())
}

func parseInputSubmissionPostBody(r *http.Request) (*CustomInputSubmissionStatusPostBody, error) {
	reqData := new(CustomInputSubmissionStatusPostBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		return nil, err
	}
	if err := json.Unmarshal(reqBodyBytes, reqData); err != nil {
		return nil, err
	}
	return reqData, nil
}

func writeInputSubmissionError(w http.ResponseWriter, err error) {
	logrus.WithError(err).Error("input submission request error")
	w.WriteHeader(http.StatusInternalServerError)
	fmt.Fprint(w, `{"code":"500", "message":"error processing request"}`)
}

func getPublicInputSubmission(w http.ResponseWriter, r *http.Request) {
	submission, ok := loadInputSubmissionFromRequest(w, r)
	if !ok {
		return
	}
	writeInputSubmissionPollResponse(w, submission, false)
}

func getAuthenticatedInputSubmission(w http.ResponseWriter, r *http.Request) {
	submission, ok := loadInputSubmissionFromRequest(w, r)
	if !ok {
		return
	}

	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	if token.Role >= JudgeRoleEnum {
		writeInputSubmissionPollResponse(w, submission, true)
		return
	}

	if submission.UserID != nil && *submission.UserID != token.Id {
		logrus.Error("Unauthorized get input submission")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"message":"Unauthorized"}`)
		return
	}

	writeInputSubmissionPollResponse(w, submission, false)
}

func loadInputSubmissionFromRequest(w http.ResponseWriter, r *http.Request) (*InputSubmission, bool) {
	submissionIdParam := pat.Param(r, "submission_id")
	submissionId, err := uuid.Parse(submissionIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return nil, false
	}

	submission, err := db.GetInputSubmission(submissionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving input submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving input submission"}`)
		return nil, false
	}
	if submission == nil {
		logrus.Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return nil, false
	}
	return submission, true
}

func writeInputSubmissionPollResponse(w http.ResponseWriter, submission *InputSubmission, includeJudgeFields bool) {
	if includeJudgeFields {
		respJSON, err := json.Marshal(submission)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
			return
		}
		fmt.Fprint(w, string(respJSON))
		return
	}

	if !submission.Finished {
		returnData := CustomInputSubmissionResultStatus{Status: "PENDING"}
		respJSON, err := json.Marshal(returnData)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
			return
		}
		fmt.Fprint(w, string(respJSON))
		return
	}

	result := CustomInputSubmissionResult{
		Status:   submission.Status,
		Stdout:   submission.Stdout,
		Stderr:   submission.Stderr,
		Finished: true,
		Runtime:  submission.Runtime,
	}

	logrus.WithFields(logrus.Fields{
		"submission_id": submission.ID,
		"status":        result.Status,
		"runtime":       result.Runtime,
	}).Info("returning custom input submission result")

	respJSON, err := json.Marshal(result)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func updateCustomInputSubmissionStatus(w http.ResponseWriter, r *http.Request) {
	submissionIdParam := pat.Param(r, "submission_id")
	submissionId, err := uuid.Parse(submissionIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	reqData := new(UpdateCustomInputSubmissionStatusPatchBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}

	logrus.WithFields(logrus.Fields{
		"submission_id": submissionId.String(),
		"raw_body":      string(reqBodyBytes),
	}).Info("received custom input submission update request")

	if err := json.Unmarshal(reqBodyBytes, reqData); err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	submission, err := db.GetInputSubmission(submissionId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving input submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving input submission"}`)
		return
	}
	if submission == nil {
		logrus.WithField("submission_id", submissionId.String()).Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return
	}

	if submission.Finished {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	submission.Finished = true
	submission.Status = reqData.Status
	submission.Stdout = reqData.Stdout
	submission.Stderr = reqData.Stderr
	submission.Runtime = reqData.Runtime

	if err := db.UpdateInputSubmissionResult(submission); err != nil {
		logrus.WithError(err).Error("error updating input submission")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating input submission"}`)
		return
	}

	logrus.WithFields(logrus.Fields{
		"submission_id": submissionId.String(),
		"status":        submission.Status,
		"runtime":       submission.Runtime,
	}).Info("updated custom input submission result")

	w.WriteHeader(http.StatusNoContent)
}
