package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"main/src/api"
)

func preloadUserIncludingDeleted(db *gorm.DB) *gorm.DB {
	return db.Unscoped()
}
func (d *Database) CreateSubmission(submission *Submission) (*Submission, error) {
	submission.SubmitTime = time.Now()
	submission.EnqueueState = EnqueuePending
	err := d.NextJudgeDB.Create(submission).Error
	if err != nil {
		return nil, err
	}
	return submission, nil
}

func (d *Database) CreateSubmissionRun(submissionID uuid.UUID) (*SubmissionRun, error) {
	var maxRunNumber int
	err := d.NextJudgeDB.Model(&SubmissionRun{}).
		Where("submission_id = ?", submissionID).
		Select("COALESCE(MAX(run_number), 0)").
		Scan(&maxRunNumber).Error
	if err != nil {
		return nil, err
	}

	run := &SubmissionRun{
		SubmissionID: submissionID,
		RunNumber:    maxRunNumber + 1,
		Status:       Pending,
		StartedAt:    time.Now(),
	}
	err = d.NextJudgeDB.Create(run).Error
	if err != nil {
		return nil, err
	}
	return run, nil
}

func (d *Database) GetSubmissionRun(runID uuid.UUID) (*SubmissionRun, error) {
	run := &SubmissionRun{}
	err := d.NextJudgeDB.First(run, runID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return run, nil
}

func (d *Database) GetLatestPendingSubmissionRun(submissionID uuid.UUID) (*SubmissionRun, error) {
	run := &SubmissionRun{}
	err := d.NextJudgeDB.
		Where("submission_id = ? AND status = ?", submissionID, Pending).
		Order("run_number DESC").
		First(run).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return run, nil
}

func (d *Database) GetSubmissionRuns(submissionID uuid.UUID) ([]SubmissionRun, error) {
	runs := []SubmissionRun{}
	err := d.NextJudgeDB.
		Where("submission_id = ?", submissionID).
		Order("run_number ASC").
		Find(&runs).Error
	if err != nil {
		return nil, err
	}
	return runs, nil
}

func (d *Database) UpdateSubmissionRun(run *SubmissionRun) error {
	return d.NextJudgeDB.Model(run).Select(
		"status",
		"reason",
		"judge_worker_id",
		"stdout",
		"stderr",
		"time_elapsed",
		"finished_at",
	).Updates(run).Error
}

func (d *Database) GetSubmission(submissionId uuid.UUID) (*Submission, error) {
	submission := &Submission{}
	err := d.NextJudgeDB.Preload("Language").Preload("Problem").Preload("User", preloadUserIncludingDeleted).Preload("TestCaseResults").First(submission, submissionId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submission, nil
}

func (d *Database) GetSubmissionsByUserID(userId uuid.UUID) ([]Submission, error) {
	submissions := []Submission{}
	err := d.NextJudgeDB.Order("submit_time desc").Limit(25).Preload("Language").Preload("User", preloadUserIncludingDeleted).Preload("Problem", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "title", "difficulty", "identifier")
	}).Where("user_id = ?", userId).Find(&submissions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submissions, nil
}

type ListSubmissionsFilter struct {
	UserID           uuid.UUID
	Status           *Status
	ProblemID        *int
	LanguageID       *uuid.UUID
	CursorSubmitTime *time.Time
	CursorID         *uuid.UUID
	Limit            int
}

func (d *Database) ListSubmissions(filter ListSubmissionsFilter) ([]Submission, string, error) {
	limit := api.NormalizeCursorLimit(filter.Limit)

	query := d.NextJudgeDB.
		Order("submit_time desc, id desc").
		Preload("Language").
		Preload("User", preloadUserIncludingDeleted).
		Preload("Problem", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "title", "difficulty", "identifier")
		}).
		Where("user_id = ?", filter.UserID)

	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.ProblemID != nil {
		query = query.Where("problem_id = ?", *filter.ProblemID)
	}
	if filter.LanguageID != nil {
		query = query.Where("language_id = ?", *filter.LanguageID)
	}
	if filter.CursorSubmitTime != nil && filter.CursorID != nil {
		query = query.Where(
			"(submit_time < ? OR (submit_time = ? AND id < ?))",
			*filter.CursorSubmitTime,
			*filter.CursorSubmitTime,
			*filter.CursorID,
		)
	}

	submissions := []Submission{}
	err := query.Limit(limit + 1).Find(&submissions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return []Submission{}, "", nil
		}
		return nil, "", err
	}

	nextCursor := ""
	if len(submissions) > limit {
		last := submissions[limit-1]
		nextCursor = api.EncodeTimeIDCursor(last.SubmitTime, last.ID)
		submissions = submissions[:limit]
	}

	for i := range submissions {
		submissions[i].SourceCode = ""
	}

	return submissions, nextCursor, nil
}

func (d *Database) GetProblemSubmissionsByUserID(userId uuid.UUID, problemId int) ([]Submission, error) {
	submissions := []Submission{}
	err := d.NextJudgeDB.Order("submit_time desc").Limit(25).Preload("Language").Preload("User", preloadUserIncludingDeleted).Preload("Problem", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "title", "difficulty", "identifier")
	}).Where("user_id = ?", userId).Where("problem_id = ?", problemId).Find(&submissions).Error
	// err := d.NextJudgeDB.Preload("Language").Preload("Problem").Where("user_id = ?", userId).Where("problem_id = ?", problemId).Find(&submissions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submissions, nil
}

func (d *Database) UpdateSubmission(submission *Submission, runID uuid.UUID) error {
	err := d.NextJudgeDB.Model(submission).Select(
		"status",
		"failed_test_case_id",
		"stdout",
		"stderr",
		"time_elapsed",
	).Updates(submission).Error
	if err != nil {
		return err
	}

	if len(submission.TestCaseResults) > 0 {
		err = d.NextJudgeDB.Where("run_id = ?", runID).Delete(&SubmissionTestCaseResult{}).Error
		if err != nil {
			return err
		}

		for i := range submission.TestCaseResults {
			submission.TestCaseResults[i].SubmissionID = submission.ID
			submission.TestCaseResults[i].RunID = &runID
		}
		err = d.NextJudgeDB.Create(&submission.TestCaseResults).Error
		if err != nil {
			return err
		}
	}

	return nil
}
