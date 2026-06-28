package main

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Database) GetUserByAccountIdentifier(accountIdentifier string) (*User, error) {
	user := &User{}
	err := d.NextJudgeDB.Where("account_identifier = ?", accountIdentifier).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUserByAccountIdentifierWithPasswordHash(accountIdentifier string) (*UserWithPassword, error) {
	user := &UserWithPassword{}
	err := d.NextJudgeDB.Where("account_identifier = ?", accountIdentifier).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) updateUserFromOAuthData(user *User, newUserData *User) error {
	updated := false
	if newUserData.Image != "" && user.Image != newUserData.Image {
		user.Image = newUserData.Image
		updated = true
	}
	if newUserData.Name != "" && user.Name != newUserData.Name {
		user.Name = newUserData.Name
		updated = true
	}
	if newUserData.Email != "" && user.Email != newUserData.Email {
		user.Email = newUserData.Email
		updated = true
	}
	if updated {
		return d.NextJudgeDB.Save(user).Error
	}
	return nil
}

func (d *Database) GetOrCreateUserByAccountIdentifier(newUserData *User) (*User, error) {
	user, err := d.GetUserByAccountIdentifier(newUserData.AccountIdentifier)
	if err != nil {
		return nil, err
	}

	if user != nil {
		err = d.updateUserFromOAuthData(user, newUserData)
		if err != nil {
			return nil, err
		}
		return user, nil
	}

	newUserData.JoinDate = time.Now()
	err = d.NextJudgeDB.Create(newUserData).Error
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			user, fetchErr := d.GetUserByAccountIdentifier(newUserData.AccountIdentifier)
			if fetchErr != nil {
				return nil, fetchErr
			}
			if user != nil {
				err = d.updateUserFromOAuthData(user, newUserData)
				if err != nil {
					return nil, err
				}
				return user, nil
			}
		}
		return nil, err
	}

	return newUserData, nil
}

func (d *Database) CreateUser(user *User) (*User, error) {
	user.JoinDate = time.Now()
	err := d.NextJudgeDB.Create(user).Error
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (d *Database) CreateUserWithPasswordHash(user *UserWithPassword) (*User, error) {
	user.JoinDate = time.Now()

	err := d.NextJudgeDB.Create(user).Error
	if err != nil {
		return nil, err
	}

	response := &User{
		ID:                user.ID,
		AccountIdentifier: user.AccountIdentifier,
		Email:             user.Email,
		Name:              user.Name,
		Image:             user.Image,
		EmailVerified:     user.EmailVerified,
		JoinDate:          user.JoinDate,
		IsAdmin:           user.IsAdmin,
	}

	return response, nil
}

func (d *Database) GetUsers() ([]User, error) {
	users := []User{}
	err := d.NextJudgeDB.Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (d *Database) GetUserByID(userId uuid.UUID) (*User, error) {
	user := &User{}
	err := d.NextJudgeDB.First(user, userId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUserByName(name string) (*User, error) {
	user := &User{}
	err := d.NextJudgeDB.Where("name = ?", name).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUserByEmail(email string) (*User, error) {
	user := &User{}
	err := d.NextJudgeDB.Where("email = ?", email).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

// update the user's password_hash and salt by email.
func (d *Database) UpdateUserPasswordByEmail(email string, salt []byte, passwordHash []byte) (*User, error) {
    // Ensure user exists first
    user := &User{}
    err := d.NextJudgeDB.Where("email = ?", email).First(user).Error
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, nil
        }
        return nil, err
    }

    // Perform partial update on sensitive fields
    err = d.NextJudgeDB.Model(&UserWithPassword{}).
        Where("email = ?", email).
        Updates(map[string]interface{}{
            "salt":          salt,
            "password_hash": passwordHash,
        }).Error
    if err != nil {
        return nil, err
    }

    return user, nil
}

func (d *Database) UpdateUser(user *User) error {
	err := d.NextJudgeDB.Save(user).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) DeleteUser(user *User) error {
	err := d.NextJudgeDB.Delete(user).Error
	if err != nil {
		return err
	}
	return nil
}

func deletedUserAccountIdentifier(userID uuid.UUID) string {
	return "deleted-" + userID.String()
}

func deletedUserEmail(userID uuid.UUID) string {
	return "deleted-" + userID.String() + "@deleted.local"
}

func (d *Database) SoftDeleteUser(user *User) error {
	return d.NextJudgeDB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&InputSubmission{}).Where("user_id = ?", user.ID).Update("user_id", nil).Error; err != nil {
			return err
		}

		if err := tx.Model(&User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
			"name":               DeletedUserDisplayName,
			"email":              deletedUserEmail(user.ID),
			"image":              "",
			"account_identifier": deletedUserAccountIdentifier(user.ID),
			"is_admin":           false,
		}).Error; err != nil {
			return err
		}

		if err := tx.Model(&UserWithPassword{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
			"password_hash": nil,
			"salt":          nil,
		}).Error; err != nil {
			return err
		}

		if err := tx.Delete(user).Error; err != nil {
			return err
		}
		return nil
	})
}

func (d *Database) CountAdmins() (int64, error) {
	var count int64
	err := d.NextJudgeDB.Model(&User{}).Where("is_admin = ?", true).Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}
