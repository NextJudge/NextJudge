package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PasswordResetToken struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	UserID    uuid.UUID `gorm:"type:uuid;not null"`
	TokenHash []byte    `gorm:"not null"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time `gorm:"not null;default:now()"`
}

func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}

func hashPasswordResetToken(plainToken string) []byte {
	sum := sha256.Sum256([]byte(plainToken))
	return sum[:]
}

func (d *Database) DeletePasswordResetTokensForUser(userID uuid.UUID) error {
	return d.NextJudgeDB.Where("user_id = ?", userID).Delete(&PasswordResetToken{}).Error
}

func (d *Database) CreatePasswordResetToken(userID uuid.UUID, plainToken string, ttl time.Duration) error {
	if err := d.DeletePasswordResetTokensForUser(userID); err != nil {
		return err
	}

	record := &PasswordResetToken{
		UserID:    userID,
		TokenHash: hashPasswordResetToken(plainToken),
		ExpiresAt: time.Now().Add(ttl),
	}
	return d.NextJudgeDB.Create(record).Error
}

func (d *Database) ValidatePasswordResetToken(email, plainToken string) (*User, error) {
	user, err := d.GetUserByEmail(email)
	if err != nil || user == nil {
		return nil, err
	}

	tokenHash := hashPasswordResetToken(plainToken)
	record := &PasswordResetToken{}
	err = d.NextJudgeDB.Where(
		"user_id = ? AND token_hash = ? AND expires_at > ?",
		user.ID,
		tokenHash,
		time.Now(),
	).First(record).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return user, nil
}

func (d *Database) ConsumePasswordResetToken(userID uuid.UUID, plainToken string) error {
	tokenHash := hashPasswordResetToken(plainToken)
	result := d.NextJudgeDB.Where(
		"user_id = ? AND token_hash = ? AND expires_at > ?",
		userID,
		tokenHash,
		time.Now(),
	).Delete(&PasswordResetToken{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func generatePasswordResetPlainToken() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return hex.EncodeToString(raw), nil
}
