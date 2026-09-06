package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/sirupsen/logrus"
)

type CreateAnnouncementRequest struct {
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func createEventAnnouncement(w http.ResponseWriter, r *http.Request) {
	eventID, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event_id")
		WriteError(w, http.StatusBadRequest, "bad event_id", "400")
		return
	}

	event, err := db.GetEventByID(eventID)
	if err != nil {
		logrus.WithError(err).Error("error retrieving event")
		WriteError(w, http.StatusInternalServerError, "error retrieving event", "500")
		return
	}
	if event == nil {
		WriteError(w, http.StatusNotFound, "event not found", "404")
		return
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	if !canManageEvent(claims, event) {
		WriteError(w, http.StatusForbidden, "forbidden", "403")
		return
	}

	reqData := new(CreateAnnouncementRequest)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		WriteError(w, http.StatusInternalServerError, "error reading request body", "500")
		return
	}

	if err := json.Unmarshal(reqBodyBytes, reqData); err != nil {
		logrus.WithError(err).Error("JSON parse error")
		WriteError(w, http.StatusInternalServerError, "JSON parse error", "500")
		return
	}

	if reqData.Subject == "" || reqData.Body == "" {
		WriteError(w, http.StatusBadRequest, "subject and body are required", "400")
		return
	}

	payload := AnnouncementEmailPayload{
		EventID: eventID,
		Subject: reqData.Subject,
		Body:    reqData.Body,
	}

	_, err = db.InsertOutboxEvent(
		outboxTypeAnnouncementEmail,
		outboxAggregateEvent,
		strconv.Itoa(eventID),
		payload,
	)
	if err != nil {
		logrus.WithError(err).Error("error inserting outbox event")
		WriteError(w, http.StatusInternalServerError, "error queueing announcement", "500")
		return
	}

	WriteJSON(w, http.StatusAccepted, map[string]string{"message": "announcement queued"})
}
