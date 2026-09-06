package main

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Database) GetLatestPublishedRevision(problemID int) (*ProblemRevision, error) {
	revision := &ProblemRevision{}
	err := d.NextJudgeDB.
		Where("problem_id = ? AND state = ?", problemID, ProblemPublished).
		Order("revision_number DESC").
		First(revision).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return revision, nil
}

func (d *Database) GetEditorialByRevisionID(revisionID uuid.UUID) (*Editorial, error) {
	editorial := &Editorial{}
	err := d.NextJudgeDB.Where("revision_id = ?", revisionID).First(editorial).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return editorial, nil
}

func (d *Database) GetEditorialForProblem(problemID int) (*EditorialWithRevision, error) {
	revision, err := d.GetLatestPublishedRevision(problemID)
	if err != nil {
		return nil, err
	}
	if revision == nil {
		return nil, nil
	}

	editorial, err := d.GetEditorialByRevisionID(revision.ID)
	if err != nil {
		return nil, err
	}
	if editorial == nil {
		return nil, nil
	}

	return &EditorialWithRevision{
		Editorial: *editorial,
		Revision:  *revision,
	}, nil
}

func (d *Database) UserHasAcceptedProblem(userID uuid.UUID, problemID int) (bool, error) {
	var count int64
	err := d.NextJudgeDB.Model(&Submission{}).
		Where("user_id = ? AND problem_id = ? AND status = ?", userID, problemID, Accepted).
		Limit(1).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (d *Database) UserHasEventAcceptedProblem(userID uuid.UUID, problemID int) (bool, error) {
	var count int64
	err := d.NextJudgeDB.Model(&Submission{}).
		Where(
			"user_id = ? AND problem_id = ? AND status = ? AND event_id IS NOT NULL",
			userID,
			problemID,
			Accepted,
		).
		Limit(1).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
