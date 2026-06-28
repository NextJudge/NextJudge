package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
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

func (d *Database) UpdateSubmission(submission *Submission) error {
	// update submission fields
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

	// handle test case results if present
	if len(submission.TestCaseResults) > 0 {
		// delete existing results for this submission
		err = d.NextJudgeDB.Where("submission_id = ?", submission.ID).Delete(&SubmissionTestCaseResult{}).Error
		if err != nil {
			return err
		}

		// set submission_id on all results and insert
		for i := range submission.TestCaseResults {
			submission.TestCaseResults[i].SubmissionID = submission.ID
		}
		err = d.NextJudgeDB.Create(&submission.TestCaseResults).Error
		if err != nil {
			return err
		}
	}

	return nil
}
