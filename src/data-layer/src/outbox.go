package main

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

const (
	outboxTypeAnnouncementEmail = "announcement.email"
	outboxAggregateEvent        = "event"
)

type AnnouncementEmailPayload struct {
	EventID int    `json:"event_id"`
	Subject string `json:"subject"`
	Body    string `json:"body"`
}

func (d *Database) InsertOutboxEvent(eventType, aggregateType, aggregateID string, payload interface{}) (*OutboxEvent, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	record := &OutboxEvent{
		EventType:     eventType,
		AggregateType: aggregateType,
		AggregateID:   aggregateID,
		Payload:       payloadBytes,
		Status:        string(OutboxPending),
	}
	if err := d.NextJudgeDB.Create(record).Error; err != nil {
		return nil, err
	}
	return record, nil
}

func (d *Database) FetchPendingOutboxEvents(limit int) ([]OutboxEvent, error) {
	var events []OutboxEvent
	err := d.NextJudgeDB.
		Where("status = ?", OutboxPending).
		Order("created_at ASC").
		Limit(limit).
		Find(&events).Error
	if err != nil {
		return nil, err
	}
	return events, nil
}

func (d *Database) MarkOutboxEventCompleted(id uuid.UUID) error {
	now := time.Now()
	return d.NextJudgeDB.Model(&OutboxEvent{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":       OutboxCompleted,
			"processed_at": &now,
		}).Error
}

func (d *Database) MarkOutboxEventFailed(id uuid.UUID, errMsg string) error {
	return d.NextJudgeDB.Model(&OutboxEvent{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":     OutboxFailed,
			"last_error": errMsg,
			"attempts":   gorm.Expr("attempts + 1"),
		}).Error
}

func sendAnnouncementEmailStub(payload AnnouncementEmailPayload) error {
	logrus.WithFields(logrus.Fields{
		"event_id": payload.EventID,
		"subject":  payload.Subject,
	}).Info("outbox: stub announcement email send")
	return nil
}

func (d *Database) PublishOutboxEvent(record *OutboxEvent) error {
	switch record.EventType {
	case outboxTypeAnnouncementEmail:
		var payload AnnouncementEmailPayload
		if err := json.Unmarshal(record.Payload, &payload); err != nil {
			return err
		}
		if err := sendAnnouncementEmailStub(payload); err != nil {
			return err
		}
	default:
		logrus.WithField("event_type", record.EventType).Warn("outbox: unknown event type, marking completed")
	}
	return d.MarkOutboxEventCompleted(record.ID)
}

func StartOutboxPublisher(interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for range ticker.C {
			publishPendingOutboxBatch()
		}
	}()
}

func publishPendingOutboxBatch() {
	events, err := db.FetchPendingOutboxEvents(25)
	if err != nil {
		logrus.WithError(err).Error("outbox: failed to fetch pending events")
		return
	}
	for _, record := range events {
		if err := db.PublishOutboxEvent(&record); err != nil {
			logrus.WithError(err).WithField("outbox_id", record.ID).Error("outbox: publish failed")
			if markErr := db.MarkOutboxEventFailed(record.ID, err.Error()); markErr != nil {
				logrus.WithError(markErr).Error("outbox: failed to mark event failed")
			}
		}
	}
}
