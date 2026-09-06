package main

import (
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
)

type EventStandingsResponse struct {
	Frozen   bool               `json:"frozen"`
	FreezeAt *time.Time         `json:"freeze_at,omitempty"`
	Rows     []EventStandingRow `json:"rows"`
}

func getEventStandings(w http.ResponseWriter, r *http.Request) {
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

	if !canViewEventStandings(claims, event) {
		WriteError(w, http.StatusForbidden, "forbidden", "403")
		return
	}

	frozenParam := r.URL.Query().Get("frozen")
	frozen := frozenParam == "true" || frozenParam == "1"
	if !canManageEvent(claims, event) {
		if event.FreezeAt != nil && time.Now().After(*event.FreezeAt) {
			frozen = true
		}
	} else if frozenParam == "" {
		frozen = false
	}

	rows, err := db.GetEventStandings(event, frozen)
	if err != nil {
		logrus.WithError(err).Error("error computing standings")
		WriteError(w, http.StatusInternalServerError, "error computing standings", "500")
		return
	}

	WriteJSON(w, http.StatusOK, EventStandingsResponse{
		Frozen:   frozen,
		FreezeAt: event.FreezeAt,
		Rows:     rows,
	})
}
