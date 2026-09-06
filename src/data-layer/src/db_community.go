package main

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ListCommunitySolutionsFilter struct {
	ProblemID int
	Cursor    string
	Limit     int
}

func (d *Database) CreateCommunitySolution(solution *CommunitySolution) (*CommunitySolution, error) {
	now := time.Now()
	solution.CreatedAt = now
	solution.UpdatedAt = now
	if solution.Status == "" {
		solution.Status = CommunitySolutionPublished
	}
	if err := d.NextJudgeDB.Create(solution).Error; err != nil {
		return nil, err
	}
	return solution, nil
}

func (d *Database) GetCommunitySolutionByID(id uuid.UUID) (*CommunitySolution, error) {
	solution := &CommunitySolution{}
	err := d.NextJudgeDB.Where("id = ?", id).First(solution).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return solution, nil
}

func (d *Database) ListCommunitySolutions(filter ListCommunitySolutionsFilter) ([]CommunitySolutionExt, string, error) {
	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	}

	query := d.NextJudgeDB.
		Model(&CommunitySolutionExt{}).
		Preload("User").
		Preload("Language").
		Where("problem_id = ? AND status = ?", filter.ProblemID, CommunitySolutionPublished).
		Order("created_at DESC, id DESC").
		Limit(limit + 1)

	if filter.Cursor != "" {
		cursorTime, cursorID, err := decodeCommunitySolutionCursor(filter.Cursor)
		if err != nil {
			return nil, "", err
		}
		query = query.Where(
			"(created_at < ?) OR (created_at = ? AND id < ?)",
			cursorTime,
			cursorTime,
			cursorID,
		)
	}

	var solutions []CommunitySolutionExt
	if err := query.Find(&solutions).Error; err != nil {
		return nil, "", err
	}

	nextCursor := ""
	if len(solutions) > limit {
		last := solutions[limit-1]
		nextCursor = encodeCommunitySolutionCursor(last.CreatedAt, last.ID)
		solutions = solutions[:limit]
	}

	if len(solutions) == 0 {
		return solutions, "", nil
	}

	solutionIDs := make([]uuid.UUID, len(solutions))
	for i, solution := range solutions {
		solutionIDs[i] = solution.ID
	}

	type voteAggregate struct {
		SolutionID uuid.UUID
		Score      int
	}
	var aggregates []voteAggregate
	if err := d.NextJudgeDB.
		Model(&SolutionVote{}).
		Select("solution_id, COALESCE(SUM(vote), 0) AS score").
		Where("solution_id IN ?", solutionIDs).
		Group("solution_id").
		Scan(&aggregates).Error; err != nil {
		return nil, "", err
	}

	scoreBySolution := make(map[uuid.UUID]int, len(aggregates))
	for _, aggregate := range aggregates {
		scoreBySolution[aggregate.SolutionID] = aggregate.Score
	}
	for i := range solutions {
		solutions[i].VoteScore = scoreBySolution[solutions[i].ID]
	}

	return solutions, nextCursor, nil
}

func encodeCommunitySolutionCursor(createdAt time.Time, id uuid.UUID) string {
	return createdAt.UTC().Format(time.RFC3339Nano) + "|" + id.String()
}

func decodeCommunitySolutionCursor(cursor string) (time.Time, uuid.UUID, error) {
	parts := splitCursor(cursor)
	if len(parts) != 2 {
		return time.Time{}, uuid.Nil, fmt.Errorf("invalid cursor")
	}
	parsedTime, err := time.Parse(time.RFC3339Nano, parts[0])
	if err != nil {
		return time.Time{}, uuid.Nil, err
	}
	id, err := uuid.Parse(parts[1])
	if err != nil {
		return time.Time{}, uuid.Nil, err
	}
	return parsedTime, id, nil
}

func splitCursor(cursor string) []string {
	for i := len(cursor) - 1; i >= 0; i-- {
		if cursor[i] == '|' {
			return []string{cursor[:i], cursor[i+1:]}
		}
	}
	return []string{cursor}
}

func (d *Database) ListCommentsForSolution(solutionID uuid.UUID) ([]CommentExt, error) {
	var comments []CommentExt
	err := d.NextJudgeDB.
		Preload("User").
		Where("community_solution_id = ?", solutionID).
		Order("created_at ASC, id ASC").
		Find(&comments).Error
	if err != nil {
		return nil, err
	}
	return comments, nil
}

func (d *Database) GetCommentByID(id uuid.UUID) (*Comment, error) {
	comment := &Comment{}
	err := d.NextJudgeDB.Where("id = ?", id).First(comment).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return comment, nil
}

func (d *Database) CreateComment(comment *Comment) (*Comment, error) {
	now := time.Now()
	comment.CreatedAt = now
	comment.UpdatedAt = now
	if err := d.NextJudgeDB.Create(comment).Error; err != nil {
		return nil, err
	}
	return comment, nil
}

func (d *Database) SoftDeleteComment(id uuid.UUID) error {
	now := time.Now()
	return d.NextJudgeDB.Model(&Comment{}).
		Where("id = ? AND deleted_at IS NULL", id).
		Updates(map[string]interface{}{
			"deleted_at": now,
			"updated_at": now,
			"body":       "",
		}).Error
}

func (d *Database) CreateReport(report *Report) (*Report, error) {
	report.CreatedAt = time.Now()
	if report.Status == "" {
		report.Status = ReportPending
	}
	if err := d.NextJudgeDB.Create(report).Error; err != nil {
		return nil, err
	}
	return report, nil
}

func (d *Database) EnqueueModerationItem(item *ModerationQueueItem) (*ModerationQueueItem, error) {
	item.CreatedAt = time.Now()
	if item.Status == "" {
		item.Status = ModerationQueuePending
	}
	if err := d.NextJudgeDB.Create(item).Error; err != nil {
		return nil, err
	}
	return item, nil
}

func (d *Database) QueueSubmissionFingerprint(submissionID uuid.UUID, problemID int) error {
	fingerprint := &SubmissionFingerprint{
		SubmissionID: submissionID,
		ProblemID:    problemID,
		Status:       FingerprintPending,
	}
	return d.NextJudgeDB.
		Where("submission_id = ?", submissionID).
		Assign(map[string]interface{}{
			"problem_id": problemID,
			"status":     FingerprintPending,
		}).
		FirstOrCreate(fingerprint).Error
}

func (d *Database) ListPendingFingerprints(limit int) ([]SubmissionFingerprint, error) {
	var fingerprints []SubmissionFingerprint
	err := d.NextJudgeDB.
		Where("status = ?", FingerprintPending).
		Order("created_at ASC").
		Limit(limit).
		Find(&fingerprints).Error
	if err != nil {
		return nil, err
	}
	return fingerprints, nil
}

func (d *Database) MarkFingerprintComputed(submissionID uuid.UUID, hash string) error {
	now := time.Now()
	return d.NextJudgeDB.Model(&SubmissionFingerprint{}).
		Where("submission_id = ?", submissionID).
		Updates(map[string]interface{}{
			"fingerprint_hash": hash,
			"status":           FingerprintComputed,
			"computed_at":      now,
		}).Error
}

func (d *Database) MarkFingerprintFailed(submissionID uuid.UUID) error {
	return d.NextJudgeDB.Model(&SubmissionFingerprint{}).
		Where("submission_id = ?", submissionID).
		Update("status", FingerprintFailed).Error
}

func (d *Database) FindMatchingFingerprints(problemID int, hash string, excludeSubmissionID uuid.UUID) ([]SubmissionFingerprint, error) {
	var fingerprints []SubmissionFingerprint
	err := d.NextJudgeDB.
		Where(
			"problem_id = ? AND fingerprint_hash = ? AND status = ? AND submission_id <> ?",
			problemID,
			hash,
			FingerprintComputed,
			excludeSubmissionID,
		).
		Find(&fingerprints).Error
	if err != nil {
		return nil, err
	}
	return fingerprints, nil
}

func (d *Database) CreateSimilarityCase(caseItem *SimilarityCase) (*SimilarityCase, error) {
	if caseItem.Status == "" {
		caseItem.Status = SimilarityCasePending
	}
	caseItem.DetectedAt = time.Now()
	if err := d.NextJudgeDB.Create(caseItem).Error; err != nil {
		return nil, err
	}
	return caseItem, nil
}

func (d *Database) RecordIntegritySignal(signal *IntegritySignal) error {
	signal.RecordedAt = time.Now()
	return d.NextJudgeDB.Create(signal).Error
}
