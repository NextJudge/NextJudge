package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

func hashIntegrityValue(value string) string {
	if value == "" {
		return ""
	}
	mac := hmac.New(sha256.New, cfg.JwtSigningSecret)
	mac.Write([]byte(value))
	return hex.EncodeToString(mac.Sum(nil))
}

func sessionIdentifierFromRequest(r *http.Request) string {
	if sessionID := strings.TrimSpace(r.Header.Get("X-NextJudge-Session")); sessionID != "" {
		return sessionID
	}
	if cookie, err := r.Cookie("nextjudge_session"); err == nil {
		return strings.TrimSpace(cookie.Value)
	}
	return ""
}

func recordSubmissionIntegritySignals(r *http.Request, userID uuid.UUID, submissionID uuid.UUID, eventID *int) {
	if db == nil {
		return
	}

	ipHash := hashIntegrityValue(getClientIP(r))
	if ipHash != "" {
		signal := &IntegritySignal{
			UserID:       &userID,
			SubmissionID: &submissionID,
			EventID:      eventID,
			SignalType:   IntegritySignalIPHash,
			SignalHash:   ipHash,
		}
		if err := db.RecordIntegritySignal(signal); err != nil {
			logrus.WithError(err).WithField("submission_id", submissionID).Warn("failed to record ip integrity signal")
		}
	}

	sessionHash := hashIntegrityValue(sessionIdentifierFromRequest(r))
	if sessionHash != "" {
		signal := &IntegritySignal{
			UserID:       &userID,
			SubmissionID: &submissionID,
			EventID:      eventID,
			SignalType:   IntegritySignalSessionHash,
			SignalHash:   sessionHash,
		}
		if err := db.RecordIntegritySignal(signal); err != nil {
			logrus.WithError(err).WithField("submission_id", submissionID).Warn("failed to record session integrity signal")
		}
	}
}
