package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

func addUserRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/users"), getUsers)
	mux.HandleFunc(pat.Get("/v1/users/:user_id"), getUser)
	mux.HandleFunc(pat.Delete("/v1/users/:user_id"), deleteUser)
	mux.HandleFunc(pat.Post("/v1/users"), postUser)
	mux.HandleFunc(pat.Put("/v1/users/:user_id"), updateUser)
}

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

	newUser, err := db.CreateUser(reqData)
	if err != nil {
		logrus.WithError(err).Error("error inserting user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting user"}`)
		return
	}

	respJSON, err := json.Marshal(newUser)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func getUsers(w http.ResponseWriter, r *http.Request) {
	username := r.URL.Query().Get("username")
	if username != "" {
		users := []User{}
		user, err := db.GetUserByUsername(username)
		if err != nil {
			logrus.WithError(err).Error("error retrieving users")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving users"}`)
			return
		}
		if user != nil {
			users = append(users, *user)
		}
		respJSON, err := json.Marshal(users)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
			return
		}
		fmt.Fprint(w, string(respJSON))
	} else {
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
		fmt.Fprint(w, string(respJSON))
	}
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
	fmt.Fprint(w, string(respJSON))
}

func updateUser(w http.ResponseWriter, r *http.Request) {

	userIdParam := pat.Param(r, "user_id")
	userId, err := strconv.Atoi(userIdParam)
	if err != nil {
		logrus.Warn("user id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"user id must be int"}`)
		return
	}

	reqData := new(PutUserRequestBody)
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

	if reqData.ID != userId {
		logrus.Warn("user id in body does not match")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"user id in body does not match"}`)
		return
	}

	user, err := db.GetUserByID(reqData.ID)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user == nil {
		logrus.Warn("user does not exist")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"user does not exist"}`)
		return
	}
	if user.Username != reqData.Username {
		existingUser, err := db.GetUserByUsername(reqData.Username)
		if err != nil {
			logrus.WithError(err).Error("error checking for existing user")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
			return
		}
		if existingUser != nil {
			logrus.Warn("user with desired username already exists")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"user with desired username already exists"}`)
			return
		}
	}

	time, err := time.Parse(time.RFC3339, reqData.JoinDate)
	if err != nil {
		logrus.WithError(err).Error("error parsing time string")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"error parsing time string"}`)
		return
	}

	updatedUser := &User{
		ID:           reqData.ID,
		Username:     reqData.Username,
		PasswordHash: reqData.PasswordHash,
		IsAdmin:      reqData.IsAdmin,
		JoinDate:     time,
	}

	err = db.UpdateUser(updatedUser)
	if err != nil {
		logrus.WithError(err).Error("error inserting user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting user"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
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

	err = db.DeleteUser(user)
	if err != nil {
		logrus.WithError(err).Error("error deleting user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error deleting user"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
