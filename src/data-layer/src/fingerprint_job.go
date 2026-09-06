package main

import (
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

const (
	fingerprintReaperInterval = 60 * time.Second
	fingerprintReaperBatchSize = 25
)

var whitespacePattern = regexp.MustCompile(`\s+`)

func StartFingerprintReaper() {
	go func() {
		processFingerprintBacklog()

		ticker := time.NewTicker(fingerprintReaperInterval)
		defer ticker.Stop()
		for range ticker.C {
			processFingerprintBacklog()
		}
	}()
}

func queueSubmissionFingerprint(submissionID uuid.UUID, problemID int) {
	if db == nil {
		return
	}
	if err := db.QueueSubmissionFingerprint(submissionID, problemID); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Warn("failed to queue submission fingerprint")
	}
}

func processFingerprintBacklog() {
	if db == nil {
		return
	}

	pending, err := db.ListPendingFingerprints(fingerprintReaperBatchSize)
	if err != nil {
		logrus.WithError(err).Error("failed to list pending submission fingerprints")
		return
	}

	for _, fingerprint := range pending {
		processSubmissionFingerprint(fingerprint.SubmissionID, fingerprint.ProblemID)
	}
}

func processSubmissionFingerprint(submissionID uuid.UUID, problemID int) {
	submission, err := db.GetSubmission(submissionID)
	if err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to load submission for fingerprint")
		return
	}
	if submission == nil {
		_ = db.MarkFingerprintFailed(submissionID)
		return
	}

	hash, err := computeSubmissionFingerprint(submission.SourceCode)
	if err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to compute submission fingerprint")
		_ = db.MarkFingerprintFailed(submissionID)
		return
	}

	if err := db.MarkFingerprintComputed(submissionID, hash); err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to store submission fingerprint")
		return
	}

	matches, err := db.FindMatchingFingerprints(problemID, hash, submissionID)
	if err != nil {
		logrus.WithError(err).WithField("submission_id", submissionID).Error("failed to search for similar submissions")
		return
	}

	for _, match := range matches {
		_, err := db.CreateSimilarityCase(&SimilarityCase{
			SubmissionID:         submissionID,
			ComparedSubmissionID: match.SubmissionID,
			SimilarityScore:      1,
			Status:               SimilarityCasePending,
		})
		if err != nil {
			logrus.WithError(err).WithFields(logrus.Fields{
				"submission_id": submissionID,
				"match_id":      match.SubmissionID,
			}).Warn("failed to create similarity case")
		}
	}
}

func computeSubmissionFingerprint(sourceCode string) (string, error) {
	normalized := normalizeSourceForFingerprint(sourceCode)
	digest := sha256.Sum256([]byte(normalized))
	return hex.EncodeToString(digest[:]), nil
}

func normalizeSourceForFingerprint(sourceCode string) string {
	trimmed := strings.TrimSpace(sourceCode)
	if trimmed == "" {
		return ""
	}
	return whitespacePattern.ReplaceAllString(trimmed, " ")
}
