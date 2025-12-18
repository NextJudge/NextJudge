package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
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

var customSubmissionMap = make(map[string]*CustomInputSubmissionResult)

// These API endpoints don't touch the database
func addInputSubmissionRoutes(mux *goji.Mux) {
	// public endpoints for landing page demo (rate-limited, no auth required)
	// register these first so they match before the regular routes
	mux.HandleFunc(pat.Post("/v1/public/input_submissions"), RateLimitMiddleware(postPublicInputSubmission, publicInputLimiter))
	mux.HandleFunc(pat.Get("/v1/public/input_submissions/:submission_id"), getInputSubmission)

	mux.HandleFunc(pat.Post("/v1/input_submissions"), AuthRequired(postInputSubmission))
	mux.HandleFunc(pat.Get("/v1/input_submissions/:submission_id"), AuthRequired(getInputSubmission))
	mux.HandleFunc(pat.Patch("/v1/input_submissions/:submission_id"), AtLeastJudgeRequired(updateCustomInputSubmissionStatus))
}

func postInputSubmission(w http.ResponseWriter, r *http.Request) {
	reqData := new(CustomInputSubmissionStatusPostBody)
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
	token := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if token == nil {
		logrus.Error("Error in token")
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
			logrus.Error("Unauthorized post input submission")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"message":"Unauthorized"}`)
			return
		}
	}

	reqData.UserID = userId

	new_uuid := uuid.New()

	status_object := CustomInputSubmissionResult{
		Finished: false,
	}

	customSubmissionMap[new_uuid.String()] = &status_object

	RabbitMQPublishCustomInputSubmission(new_uuid.String(), reqData)

	fmt.Fprint(w, new_uuid.String())
}

// postPublicInputSubmission handles public (unauthenticated) code execution for landing page demo
func postPublicInputSubmission(w http.ResponseWriter, r *http.Request) {
	reqData := new(CustomInputSubmissionStatusPostBody)
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

	// use a nil UUID for anonymous submissions
	reqData.UserID = uuid.Nil

	new_uuid := uuid.New()

	status_object := CustomInputSubmissionResult{
		Finished: false,
	}

	customSubmissionMap[new_uuid.String()] = &status_object

	RabbitMQPublishCustomInputSubmission(new_uuid.String(), reqData)

	fmt.Fprint(w, new_uuid.String())
}

func getInputSubmission(w http.ResponseWriter, r *http.Request) {
	submissionIdParam := pat.Param(r, "submission_id")
	submissionId, err := uuid.Parse(submissionIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	result, ok := customSubmissionMap[submissionId.String()]
	if !ok {
		logrus.Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return
	} else {
		if !result.Finished {

			return_data := CustomInputSubmissionResultStatus{
				Status: "PENDING",
			}

			json_data, err := json.Marshal(return_data)
			if err != nil {
				log.Fatal(err)
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
				return
			}

			fmt.Fprint(w, string(json_data))
		} else {
			logrus.WithFields(logrus.Fields{
				"submission_id": submissionId.String(),
				"status":        result.Status,
				"runtime":       result.Runtime,
				"finished":      result.Finished,
			}).Info("returning custom input submission result")

			json_data, err := json.Marshal(result)
			if err != nil {
				log.Fatal(err)
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
				return
			}

			// Remove the entry from the map
			delete(customSubmissionMap, submissionId.String())

			fmt.Fprint(w, string(json_data))
		}
	}
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

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	logrus.WithFields(logrus.Fields{
		"submission_id": submissionId.String(),
		"status":        reqData.Status,
		"runtime":       reqData.Runtime,
		"stdout_length": len(reqData.Stdout),
		"stderr_length": len(reqData.Stderr),
	}).Info("parsed custom input submission update data")

	result, ok := customSubmissionMap[submissionId.String()]
	if !ok {
		logrus.WithField("submission_id", submissionId.String()).Warn("submission not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"submission not found"}`)
		return
	} else {
		result.Finished = true
		result.Status = reqData.Status
		result.Stdout = reqData.Stdout
		result.Stderr = reqData.Stderr
		result.Runtime = reqData.Runtime

		logrus.WithFields(logrus.Fields{
			"submission_id": submissionId.String(),
			"status":        result.Status,
			"runtime":       result.Runtime,
			"finished":      result.Finished,
		}).Info("updated custom input submission result")
	}

}
