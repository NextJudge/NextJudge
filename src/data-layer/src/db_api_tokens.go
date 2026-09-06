package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Database) CreateAPIToken(token *APIToken) error {
	token.CreatedAt = time.Now()
	return d.NextJudgeDB.Create(token).Error
}

func (d *Database) ListAPITokensForUser(userID uuid.UUID) ([]APIToken, error) {
	tokens := []APIToken{}
	err := d.NextJudgeDB.
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&tokens).Error
	return tokens, err
}

func (d *Database) GetAPITokenByIDForUser(tokenID, userID uuid.UUID) (*APIToken, error) {
	token := &APIToken{}
	err := d.NextJudgeDB.Where("id = ? AND user_id = ?", tokenID, userID).First(token).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return token, nil
}

func (d *Database) RevokeAPIToken(tokenID, userID uuid.UUID) error {
	now := time.Now()
	result := d.NextJudgeDB.Model(&APIToken{}).
		Where("id = ? AND user_id = ? AND revoked_at IS NULL", tokenID, userID).
		Update("revoked_at", now)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (d *Database) FindActiveAPITokenByHash(hash []byte) (*APIToken, error) {
	token := &APIToken{}
	err := d.NextJudgeDB.
		Where("token_hash = ? AND revoked_at IS NULL", hash).
		First(token).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if token.ExpiresAt != nil && token.ExpiresAt.Before(time.Now()) {
		return nil, nil
	}
	return token, nil
}

func (d *Database) TouchAPITokenLastUsed(tokenID uuid.UUID) error {
	now := time.Now()
	return d.NextJudgeDB.Model(&APIToken{}).Where("id = ?", tokenID).Update("last_used_at", now).Error
}

func (d *Database) InsertAuditEvent(event *AuditEvent) error {
	event.CreatedAt = time.Now()
	return d.NextJudgeDB.Create(event).Error
}

func toAPITokenPublic(token APIToken) APITokenPublic {
	return APITokenPublic{
		ID:          token.ID,
		UserID:      token.UserID,
		Name:        token.Name,
		TokenPrefix: token.TokenPrefix,
		Scopes:      token.Scopes,
		ExpiresAt:   token.ExpiresAt,
		LastUsedAt:  token.LastUsedAt,
		RevokedAt:   token.RevokedAt,
		CreatedAt:   token.CreatedAt,
	}
}
