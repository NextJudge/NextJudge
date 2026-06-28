package main

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Database) CreateEventQuestion(question *EventQuestion) (*EventQuestion, error) {
	question.CreatedAt = time.Now()
	question.UpdatedAt = time.Now()
	err := d.NextJudgeDB.Create(question).Error
	if err != nil {
		return nil, err
	}
	return question, nil
}

func (d *Database) GetEventQuestions(eventID int) ([]EventQuestionExt, error) {
	var questions []EventQuestionExt
	err := d.NextJudgeDB.Preload("User", preloadUserIncludingDeleted).Preload("Problem").Preload("Answerer", preloadUserIncludingDeleted).
		Where("event_id = ?", eventID).
		Order("created_at DESC").
		Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}

func (d *Database) GetEventQuestionByID(questionID uuid.UUID) (*EventQuestionExt, error) {
	var question EventQuestionExt
	err := d.NextJudgeDB.Preload("User", preloadUserIncludingDeleted).Preload("Problem").Preload("Answerer", preloadUserIncludingDeleted).
		Where("id = ?", questionID).
		First(&question).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &question, nil
}

func (d *Database) UpdateEventQuestion(question *EventQuestion) error {
	question.UpdatedAt = time.Now()
	err := d.NextJudgeDB.Save(question).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) AnswerEventQuestion(questionID uuid.UUID, answer string, answeredBy uuid.UUID) error {
	now := time.Now()
	err := d.NextJudgeDB.Model(&EventQuestion{}).
		Where("id = ?", questionID).
		Updates(map[string]interface{}{
			"answer":      answer,
			"is_answered": true,
			"answered_at": &now,
			"answered_by": answeredBy,
			"updated_at":  now,
		}).Error
	return err
}

// Legacy functions - commented out but kept for reference
// func (d *Database) GetUnansweredQuestionsCount(userID uuid.UUID) (int64, error) {
// 	var count int64
// 	err := d.NextJudgeDB.Model(&EventQuestion{}).
// 		Where("user_id = ? AND is_answered = ?", userID, false).
// 		Count(&count).Error
// 	return count, err
// }

// func (d *Database) GetUserQuestionNotifications(userID uuid.UUID) ([]EventQuestionExt, error) {
// 	var questions []EventQuestionExt
// 	err := d.NextJudgeDB.Preload("User", preloadUserIncludingDeleted).Preload("Problem").Preload("Answerer", preloadUserIncludingDeleted).
// 		Where("user_id = ? AND is_answered = ?", userID, true).
// 		Where("answered_at > ?", time.Now().Add(-24*time.Hour)).
// 		Order("answered_at DESC").
// 		Limit(10).
// 		Find(&questions).Error
// 	if err != nil {
// 		return nil, err
// 	}
// 	return questions, nil
// }

// notification functions
func (d *Database) CreateQuestionNotifications(eventID int, questionID uuid.UUID, questionAuthorID uuid.UUID) error {
	// get all users in the event except the question author
	var users []EventUser
	err := d.NextJudgeDB.Where("event_id = ? AND user_id != ?", eventID, questionAuthorID).Find(&users).Error
	if err != nil {
		return err
	}

	// create notifications for all other users
	for _, user := range users {
		notification := &Notification{
			UserID:           user.UserID,
			EventID:          eventID,
			QuestionID:       questionID,
			NotificationType: "question",
			IsRead:           false,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		err = d.NextJudgeDB.Create(notification).Error
		if err != nil {
			// ignore unique constraint violations
			continue
		}
	}
	return nil
}

func (d *Database) CreateAnswerNotification(eventID int, questionID uuid.UUID, questionAuthorID uuid.UUID) error {
	// create notification for the question author
	notification := &Notification{
		UserID:           questionAuthorID,
		EventID:          eventID,
		QuestionID:       questionID,
		NotificationType: "answer",
		IsRead:           false,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	return d.NextJudgeDB.Create(notification).Error
}

func (d *Database) GetUnreadNotificationsCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := d.NextJudgeDB.Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (d *Database) GetUserNotifications(userID uuid.UUID) ([]NotificationExt, error) {
	var notifications []NotificationExt
	err := d.NextJudgeDB.Table("notifications").
		Preload("Question").Preload("Question.User", preloadUserIncludingDeleted).Preload("Question.Problem").Preload("Question.Answerer", preloadUserIncludingDeleted).
		Where("user_id = ?", userID).
		Where("is_read = ? OR (is_read = ? AND created_at > ?)", false, true, time.Now().Add(-24*time.Hour)).
		Order("created_at DESC").
		Limit(20).
		Find(&notifications).Error
	if err != nil {
		return nil, err
	}
	return notifications, nil
}

func (d *Database) MarkNotificationAsRead(notificationID uuid.UUID) error {
	return d.NextJudgeDB.Model(&Notification{}).
		Where("id = ?", notificationID).
		Update("is_read", true).Error
}

func (d *Database) MarkAllNotificationsAsRead(userID uuid.UUID) error {
	return d.NextJudgeDB.Model(&Notification{}).
		Where("user_id = ?", userID).
		Update("is_read", true).Error
}
