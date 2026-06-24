package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	maxEnqueueAttempts   = 20
	staleQueuedThreshold = 5 * time.Minute
)

func (d *Database) CreateInputSubmission(submission *InputSubmission) (*InputSubmission, error) {
	submission.CreatedAt = time.Now()
	submission.EnqueueState = EnqueuePending
	err := d.NextJudgeDB.Create(submission).Error
	if err != nil {
		return nil, err
	}
	return submission, nil
}

func (d *Database) GetInputSubmission(submissionID uuid.UUID) (*InputSubmission, error) {
	submission := &InputSubmission{}
	err := d.NextJudgeDB.First(submission, submissionID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submission, nil
}

func (d *Database) UpdateInputSubmissionResult(submission *InputSubmission) error {
	return d.NextJudgeDB.Model(submission).Select(
		"status",
		"stdout",
		"stderr",
		"runtime",
		"finished",
	).Updates(submission).Error
}

func (d *Database) MarkSubmissionEnqueued(submissionID uuid.UUID) error {
	now := time.Now()
	return d.NextJudgeDB.Model(&Submission{}).
		Where("id = ?", submissionID).
		Updates(map[string]interface{}{
			"enqueue_state": EnqueueQueued,
			"enqueued_at":   now,
		}).Error
}

func (d *Database) IncrementSubmissionEnqueueAttempt(submissionID uuid.UUID) error {
	return d.NextJudgeDB.Model(&Submission{}).
		Where("id = ?", submissionID).
		UpdateColumn("enqueue_attempts", gorm.Expr("enqueue_attempts + 1")).Error
}

func (d *Database) MarkSubmissionEnqueueFailed(submissionID uuid.UUID) error {
	return d.NextJudgeDB.Model(&Submission{}).
		Where("id = ?", submissionID).
		Update("enqueue_state", EnqueueFailed).Error
}

func (d *Database) MarkInputSubmissionEnqueued(submissionID uuid.UUID) error {
	now := time.Now()
	return d.NextJudgeDB.Model(&InputSubmission{}).
		Where("id = ?", submissionID).
		Updates(map[string]interface{}{
			"enqueue_state": EnqueueQueued,
			"enqueued_at":   now,
		}).Error
}

func (d *Database) IncrementInputSubmissionEnqueueAttempt(submissionID uuid.UUID) error {
	return d.NextJudgeDB.Model(&InputSubmission{}).
		Where("id = ?", submissionID).
		UpdateColumn("enqueue_attempts", gorm.Expr("enqueue_attempts + 1")).Error
}

func (d *Database) MarkInputSubmissionEnqueueFailed(submissionID uuid.UUID) error {
	return d.NextJudgeDB.Model(&InputSubmission{}).
		Where("id = ?", submissionID).
		Update("enqueue_state", EnqueueFailed).Error
}

func (d *Database) ListSubmissionsNeedingEnqueue(limit int) ([]Submission, error) {
	cutoff := time.Now().Add(-staleQueuedThreshold)
	submissions := []Submission{}
	err := d.NextJudgeDB.
		Where("status = ?", Pending).
		Where("enqueue_state IN ?", []EnqueueState{EnqueuePending, EnqueueQueued}).
		Where("enqueue_attempts < ?", maxEnqueueAttempts).
		Where("enqueue_state = ? OR enqueued_at IS NULL OR enqueued_at < ?", EnqueuePending, cutoff).
		Order("submit_time ASC").
		Limit(limit).
		Find(&submissions).Error
	if err != nil {
		return nil, err
	}
	return submissions, nil
}

func (d *Database) ListInputSubmissionsNeedingEnqueue(limit int) ([]InputSubmission, error) {
	cutoff := time.Now().Add(-staleQueuedThreshold)
	submissions := []InputSubmission{}
	err := d.NextJudgeDB.
		Where("finished = ?", false).
		Where("enqueue_state IN ?", []EnqueueState{EnqueuePending, EnqueueQueued}).
		Where("enqueue_attempts < ?", maxEnqueueAttempts).
		Where("enqueue_state = ? OR enqueued_at IS NULL OR enqueued_at < ?", EnqueuePending, cutoff).
		Order("created_at ASC").
		Limit(limit).
		Find(&submissions).Error
	if err != nil {
		return nil, err
	}
	return submissions, nil
}
