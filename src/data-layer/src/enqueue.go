package main

import (
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

const (
	enqueueReaperInterval = 30 * time.Second
	enqueueReaperBatchSize  = 50
)

func StartEnqueueReaper() {
	go func() {
		// Run once at startup to drain anything left from a previous crash.
		processEnqueueBacklog()

		ticker := time.NewTicker(enqueueReaperInterval)
		defer ticker.Stop()
		for range ticker.C {
			processEnqueueBacklog()
		}
	}()
}

func processEnqueueBacklog() {
	if db == nil || rabbitService == nil {
		return
	}

	submissions, err := db.ListSubmissionsNeedingEnqueue(enqueueReaperBatchSize)
	if err != nil {
		logrus.WithError(err).Error("failed to list submissions needing enqueue")
		return
	}
	for _, submission := range submissions {
		enqueueProblemSubmission(submission.ID)
	}

	inputSubmissions, err := db.ListInputSubmissionsNeedingEnqueue(enqueueReaperBatchSize)
	if err != nil {
		logrus.WithError(err).Error("failed to list input submissions needing enqueue")
		return
	}
	for _, submission := range inputSubmissions {
		enqueueInputSubmission(submission.ID)
	}
}

func enqueueProblemSubmission(submissionID uuid.UUID) {
	if err := db.IncrementSubmissionEnqueueAttempt(submissionID); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to increment enqueue attempts")
		return
	}

	if err := publishSubmissionMessage(submissionID.String()); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Warn("failed to publish submission to RabbitMQ")

		submission, getErr := db.GetSubmission(submissionID)
		if getErr == nil && submission != nil && submission.EnqueueAttempts >= maxEnqueueAttempts {
			_ = db.MarkSubmissionEnqueueFailed(submissionID)
		}
		return
	}

	if err := db.MarkSubmissionEnqueued(submissionID); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to mark submission as enqueued")
		return
	}

	logrus.WithField("submission_id", submissionID).Info("Published problem submission to RabbitMQ")
}

func enqueueInputSubmission(submissionID uuid.UUID) {
	if err := db.IncrementInputSubmissionEnqueueAttempt(submissionID); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to increment input enqueue attempts")
		return
	}

	if err := publishInputSubmissionMessage(submissionID.String()); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Warn("failed to publish input submission to RabbitMQ")

		submission, getErr := db.GetInputSubmission(submissionID)
		if getErr == nil && submission != nil && submission.EnqueueAttempts >= maxEnqueueAttempts {
			_ = db.MarkInputSubmissionEnqueueFailed(submissionID)
		}
		return
	}

	if err := db.MarkInputSubmissionEnqueued(submissionID); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to mark input submission as enqueued")
		return
	}

	logrus.WithField("submission_id", submissionID).Info("Published input submission to RabbitMQ")
}

func tryEnqueueProblemSubmission(submissionID uuid.UUID) {
	enqueueProblemSubmission(submissionID)
}

func tryEnqueueInputSubmission(submissionID uuid.UUID) {
	enqueueInputSubmission(submissionID)
}
