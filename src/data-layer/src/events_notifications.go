package main

import (
	"net/http"

	"github.com/sirupsen/logrus"
)

func getNotificationsCount(w http.ResponseWriter, r *http.Request) {
	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusInternalServerError, "Error in token", "500")
		return
	}

	count, err := db.GetUnreadNotificationsCount(token.Id)
	if err != nil {
		logrus.WithError(err).Error("error getting notifications count")
		WriteError(w, http.StatusInternalServerError, "error getting notifications count", "500")
		return
	}

	type NotificationCount struct {
		Count int64 `json:"count"`
	}

	WriteJSON(w, http.StatusOK, NotificationCount{Count: count})
}

func getUserNotifications(w http.ResponseWriter, r *http.Request) {
	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusInternalServerError, "Error in token", "500")
		return
	}

	notifications, err := db.GetUserNotifications(token.Id)
	if err != nil {
		logrus.WithError(err).Error("error getting user notifications")
		WriteError(w, http.StatusInternalServerError, "error getting user notifications", "500")
		return
	}

	WriteJSON(w, http.StatusOK, notifications)
}

func markNotificationsAsRead(w http.ResponseWriter, r *http.Request) {
	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusInternalServerError, "Error in token", "500")
		return
	}

	err := db.MarkAllNotificationsAsRead(token.Id)
	if err != nil {
		logrus.WithError(err).Error("error marking notifications as read")
		WriteError(w, http.StatusInternalServerError, "error marking notifications as read", "500")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "notifications marked as read"})
}
