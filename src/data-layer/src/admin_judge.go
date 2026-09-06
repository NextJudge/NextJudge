package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

type JudgeQueueStats struct {
	RabbitMQMessages              int   `json:"rabbitmq_messages"`
	RabbitMQDLQMessages           int   `json:"rabbitmq_dlq_messages"`
	PendingSubmissions            int64 `json:"pending_submissions"`
	PendingInputSubmissions       int64 `json:"pending_input_submissions"`
	FailedEnqueueSubmissions      int64 `json:"failed_enqueue_submissions"`
	FailedEnqueueInputSubmissions int64 `json:"failed_enqueue_input_submissions"`
}

type DrainQueueResponse struct {
	ProcessedSubmissions      int `json:"processed_submissions"`
	ProcessedInputSubmissions int `json:"processed_input_submissions"`
}

type RejudgeSubmissionResponse struct {
	SubmissionID string `json:"submission_id"`
	Status       string `json:"status"`
}

func addAdminJudgeRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/admin/judge/queue"), AdminRequired(getAdminJudgeQueue))
	mux.HandleFunc(pat.Post("/v1/admin/judge/drain"), AdminRequired(postAdminJudgeDrain))
	mux.HandleFunc(pat.Post("/v1/admin/submissions/:submission_id/rejudge"), AdminRequired(postAdminSubmissionRejudge))
}

func getAdminJudgeQueue(w http.ResponseWriter, r *http.Request) {
	stats := JudgeQueueStats{}

	mainDepth, err := getRabbitQueueDepth(SUBMISSION_KEY)
	if err != nil {
		logrus.WithError(err).Warn("failed to inspect main judge queue")
	} else {
		stats.RabbitMQMessages = mainDepth
	}

	dlqDepth, err := getRabbitQueueDepth(submissionDLQKey)
	if err != nil {
		logrus.WithError(err).Warn("failed to inspect judge DLQ")
	} else {
		stats.RabbitMQDLQMessages = dlqDepth
	}

	pendingStates := []EnqueueState{EnqueuePending, EnqueueQueued}
	pendingSubmissions, err := db.CountSubmissionsByStatusAndEnqueueState(Pending, pendingStates)
	if err != nil {
		logrus.WithError(err).Error("failed to count pending submissions")
		WriteError(w, http.StatusInternalServerError, "failed to count pending submissions", "500")
		return
	}
	stats.PendingSubmissions = pendingSubmissions

	pendingInputSubmissions, err := db.CountInputSubmissionsByEnqueueState(pendingStates)
	if err != nil {
		logrus.WithError(err).Error("failed to count pending input submissions")
		WriteError(w, http.StatusInternalServerError, "failed to count pending input submissions", "500")
		return
	}
	stats.PendingInputSubmissions = pendingInputSubmissions

	failedSubmissions, err := db.CountSubmissionsByStatusAndEnqueueState(Pending, []EnqueueState{EnqueueFailed})
	if err != nil {
		logrus.WithError(err).Error("failed to count failed enqueue submissions")
		WriteError(w, http.StatusInternalServerError, "failed to count failed enqueue submissions", "500")
		return
	}
	stats.FailedEnqueueSubmissions = failedSubmissions

	failedInputSubmissions, err := db.CountInputSubmissionsByEnqueueState([]EnqueueState{EnqueueFailed})
	if err != nil {
		logrus.WithError(err).Error("failed to count failed enqueue input submissions")
		WriteError(w, http.StatusInternalServerError, "failed to count failed enqueue input submissions", "500")
		return
	}
	stats.FailedEnqueueInputSubmissions = failedInputSubmissions

	WriteJSON(w, http.StatusOK, stats)
}

func postAdminJudgeDrain(w http.ResponseWriter, r *http.Request) {
	submissionCount, inputCount := processEnqueueBacklog()
	WriteJSON(w, http.StatusOK, DrainQueueResponse{
		ProcessedSubmissions:      submissionCount,
		ProcessedInputSubmissions: inputCount,
	})
}

func postAdminSubmissionRejudge(w http.ResponseWriter, r *http.Request) {
	submissionIDParam := pat.Param(r, "submission_id")
	submissionID, err := uuid.Parse(submissionIDParam)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "invalid submission id", "400")
		return
	}

	submission, err := db.GetSubmission(submissionID)
	if err != nil {
		logrus.WithError(err).Error("error retrieving submission for rejudge")
		WriteError(w, http.StatusInternalServerError, "error retrieving submission", "500")
		return
	}
	if submission == nil {
		WriteError(w, http.StatusNotFound, "submission not found", "404")
		return
	}

	if err := db.ResetSubmissionForRejudge(submissionID); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to reset submission for rejudge")
		WriteError(w, http.StatusInternalServerError, "failed to reset submission", "500")
		return
	}

	enqueueProblemSubmission(submissionID)

	WriteJSON(w, http.StatusAccepted, RejudgeSubmissionResponse{
		SubmissionID: submissionID.String(),
		Status:       string(Pending),
	})
}
