package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PublicProfile struct {
	ID              uuid.UUID `json:"id"`
	Handle          string    `json:"handle"`
	Name            string    `json:"name"`
	Image           string    `json:"image"`
	JoinDate        time.Time `json:"join_date"`
	Rating          *int      `json:"rating,omitempty"`
	MaxRating       *int      `json:"max_rating,omitempty"`
	ContestCount    int64     `json:"contest_count"`
	SubmissionCount int64     `json:"submission_count"`
}

type UserWithStats struct {
	User
	ContestCount    int64 `json:"contest_count"`
	SubmissionCount int64 `json:"submission_count"`
}

func (d *Database) GetUserByHandleNormalized(handleNormalized string) (*User, error) {
	user := &User{}
	err := d.NextJudgeDB.
		Where("handle_normalized = ?", handleNormalized).
		First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUserByHandleNormalizedExcludingUser(handleNormalized string, excludeUserID uuid.UUID) (*User, error) {
	user := &User{}
	err := d.NextJudgeDB.
		Where("handle_normalized = ? AND id <> ?", handleNormalized, excludeUserID).
		First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) CountUserSubmissions(userID uuid.UUID) (int64, error) {
	var count int64
	err := d.NextJudgeDB.Model(&Submission{}).Where("user_id = ?", userID).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (d *Database) CountUserContests(userID uuid.UUID) (int64, error) {
	var count int64
	err := d.NextJudgeDB.
		Table("event_users").
		Where("user_id = ?", userID).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}

func (d *Database) GetUserRating(userID uuid.UUID) (*UserRating, error) {
	rating := &UserRating{}
	err := d.NextJudgeDB.First(rating, "user_id = ?", userID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return rating, nil
}

func (d *Database) GetPublicProfileByHandle(handle string) (*PublicProfile, error) {
	user, err := d.GetUserByHandleNormalized(normalizeHandle(handle))
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, nil
	}

	contestCount, err := d.CountUserContests(user.ID)
	if err != nil {
		return nil, err
	}

	submissionCount, err := d.CountUserSubmissions(user.ID)
	if err != nil {
		return nil, err
	}

	profile := &PublicProfile{
		ID:              user.ID,
		Handle:          user.Handle,
		Name:            user.Name,
		Image:           user.Image,
		JoinDate:        user.JoinDate,
		ContestCount:    contestCount,
		SubmissionCount: submissionCount,
	}

	userRating, err := d.GetUserRating(user.ID)
	if err != nil {
		return nil, err
	}
	if userRating != nil {
		profile.Rating = &userRating.Rating
		profile.MaxRating = &userRating.MaxRating
	}

	return profile, nil
}

func (d *Database) GetTopUsersByContests(limit int) ([]UserWithStats, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	type leaderboardRow struct {
		User
		ContestCount    int64
		SubmissionCount int64
	}

	rows := []leaderboardRow{}
	err := d.NextJudgeDB.
		Table("users").
		Select(`
			users.*,
			COUNT(DISTINCT event_users.event_id) AS contest_count,
			(
				SELECT COUNT(*)
				FROM submissions
				WHERE submissions.user_id = users.id
			) AS submission_count
		`).
		Joins("JOIN event_users ON event_users.user_id = users.id").
		Where("users.deleted_at IS NULL").
		Group("users.id").
		Order("contest_count DESC, submission_count DESC, users.join_date ASC").
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	results := make([]UserWithStats, 0, len(rows))
	for _, row := range rows {
		results = append(results, UserWithStats{
			User:            row.User,
			ContestCount:    row.ContestCount,
			SubmissionCount: row.SubmissionCount,
		})
	}
	return results, nil
}

func (d *Database) findAvailableHandle(base string) (string, string, error) {
	candidate := base
	for suffix := 0; suffix < 1000; suffix++ {
		if suffix > 0 {
			suffixText := fmt.Sprintf("_%d", suffix)
			maxBaseLen := 32 - len(suffixText)
			if maxBaseLen < 3 {
				return "", "", errInvalidHandle
			}
			trimmedBase := base
			if len(trimmedBase) > maxBaseLen {
				trimmedBase = trimmedBase[:maxBaseLen]
			}
			candidate = trimmedBase + suffixText
		}

		if err := validateHandle(candidate); err != nil {
			return "", "", err
		}

		existing, err := d.GetUserByHandleNormalized(normalizeHandle(candidate))
		if err != nil {
			return "", "", err
		}
		if existing == nil {
			return candidate, normalizeHandle(candidate), nil
		}
	}

	return "", "", errInvalidHandle
}

func (d *Database) AssignHandleForUser(user *User) error {
	if user.Handle != "" && user.HandleNormalized != "" {
		return nil
	}

	base := sanitizeHandleBase(user.Name)
	if base == "" {
		base = "user_" + strings.ReplaceAll(user.ID.String()[:8], "-", "")
	}

	handle, normalized, err := d.findAvailableHandle(base)
	if err != nil {
		return err
	}

	user.Handle = handle
	user.HandleNormalized = normalized
	return d.NextJudgeDB.Model(user).Updates(map[string]interface{}{
		"handle":            handle,
		"handle_normalized": normalized,
	}).Error
}

func (d *Database) UpdateUserHandle(user *User, newHandle string, changedAt time.Time) error {
	normalized := normalizeHandle(newHandle)
	return d.NextJudgeDB.Model(user).Updates(map[string]interface{}{
		"handle":            newHandle,
		"handle_normalized": normalized,
		"handle_changed_at": changedAt,
	}).Error
}

func (d *Database) SearchPublicProblems(query string, limit int) ([]GetEventProblemType, error) {
	return d.SearchProblems(query, limit, true)
}

func (d *Database) SearchProblems(query string, limit int, publicOnly bool) ([]GetEventProblemType, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	problemDescriptions := []ProblemDescription{}
	dbQuery := d.NextJudgeDB.
		Where("title_search @@ plainto_tsquery('english', ?)", query).
		Order(gorm.Expr("ts_rank(title_search, plainto_tsquery('english', ?)) DESC", query)).
		Limit(limit)
	if publicOnly {
		dbQuery = dbQuery.Where("public = ?", true)
	}

	err := dbQuery.Find(&problemDescriptions).Error
	if err != nil {
		return nil, err
	}

	problems := make([]GetEventProblemType, 0, len(problemDescriptions))
	for _, problemDescription := range problemDescriptions {
		categories, err := d.GetProblemCategories(problemDescription.ID)
		if err != nil {
			return nil, err
		}

		problems = append(problems, GetEventProblemType{
			ID:               problemDescription.ID,
			Title:            problemDescription.Title,
			Prompt:           problemDescription.Prompt,
			Source:           problemDescription.Source,
			Difficulty:       problemDescription.Difficulty,
			UserID:           problemDescription.UserID,
			UploadDate:       problemDescription.UploadDate,
			UpdatedAt:        problemDescription.UpdatedAt,
			Public:           problemDescription.Public,
			AcceptTimeout:    problemDescription.DefaultAcceptTimeout,
			ExecutionTimeout: problemDescription.DefaultExecutionTimeout,
			MemoryLimit:      problemDescription.DefaultMemoryLimit,
			Identifier:       problemDescription.Identifier,
			Categories:       categories,
		})
	}

	return problems, nil
}
