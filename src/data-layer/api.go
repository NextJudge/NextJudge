package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/sirupsen/logrus"
	"goji.io/pat"
)

func postUser(w http.ResponseWriter, r *http.Request) {
	reqData := new(User)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	user, err := db.GetUserByUsername(reqData.Username)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user != nil {
		logrus.Warn("user already exists")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"user already exists"}`)
		return
	}

	err = db.CreateUser(*reqData)
	if err != nil {
		logrus.WithError(err).Error("error inserting user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting user"}`)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func getUsers(w http.ResponseWriter, r *http.Request) {
	users, err := db.GetUsers()
	if err != nil {
		logrus.WithError(err).Error("error retrieving users")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving users"}`)
		return
	}

	respJSON, err := json.Marshal(users)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprintf(w, string(respJSON))
	w.WriteHeader(http.StatusOK)
}

func getUser(w http.ResponseWriter, r *http.Request) {
	userIdParam := pat.Param(r, "user_id")

	userId, err := strconv.Atoi(userIdParam)
	if err != nil {
		logrus.WithError(err).Error("user id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"user id must be int"}`)
		return
	}

	user, err := db.GetUserByID(userId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving user"}`)
		return
	}
	if user == nil {
		logrus.WithError(err).Warn("user not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user not found"}`)
		return
	}

	respJSON, err := json.Marshal(user)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprintf(w, string(respJSON))
	w.WriteHeader(http.StatusOK)
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
	userIdParam := pat.Param(r, "user_id")

	userId, err := strconv.Atoi(userIdParam)
	if err != nil {
		logrus.WithError(err).Error("user id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"user id must be int"}`)
		return
	}

	user, err := db.GetUserByID(userId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving user"}`)
		return
	}
	if user == nil {
		logrus.WithError(err).Warn("user not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user not found"}`)
		return
	}

	err = db.DeleteUser(userId)
	if err != nil {
		logrus.WithError(err).Error("error deleting user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error deleting user"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
