package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

func addUserRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/users/top-by-contests"), AuthRequired(getTopUsersByContests))
	mux.HandleFunc(pat.Put("/v1/users/me/handle"), AuthRequired(putMyHandle))
	mux.HandleFunc(pat.Get("/v1/users/:user_id/submissions/count"), AuthRequired(getUserSubmissionCount))
	mux.HandleFunc(pat.Get("/v1/users/:user_id/contests/count"), AuthRequired(getUserContestCount))
	mux.HandleFunc(pat.Get("/v1/users"), AdminRequired(getUsers))
	mux.HandleFunc(pat.Get("/v1/users/:user_id"), AuthRequired(getUser))
	mux.HandleFunc(pat.Delete("/v1/users/:user_id"), AuthRequired(deleteUser))
	mux.HandleFunc(pat.Post("/v1/users"), AdminRequired(postUser))
	mux.HandleFunc(pat.Put("/v1/users/:user_id"), AdminRequired(updateUser))
}

type PutUserRequestBody struct {
	Name    string `json:"name"`
	Image   string `json:"image"`
	IsAdmin *bool  `json:"is_admin"`
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

	if reqData.Email == "" {
		logrus.Warn("email cannot be blank")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"email cannot be blank"}`)
		return
	}

	if reqData.Name == "" {
		logrus.Warn("name cannot be blank")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"name cannot be blank"}`)
		return
	}

	user, err := db.GetUserByName(reqData.Name)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user != nil {
		logrus.Warn("user with name already exists")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"user with name already exists"}`)
		return
	}

	user, err = db.GetUserByEmail(reqData.Email)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user != nil {
		logrus.Warn("user with email already exists")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"user with email already exists"}`)
		return
	}

	if reqData.AccountIdentifier == "" {
		reqData.AccountIdentifier = fmt.Sprintf("admin-created-%s", reqData.Email)
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
	name := r.URL.Query().Get("name")
	if name != "" {
		users := []User{}
		user, err := db.GetUserByName(name)
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
	userId, err := uuid.Parse(userIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	var token *NextJudgeClaims
	if raw := r.Context().Value(ContextTokenKey); raw != nil {
		token, _ = raw.(*NextJudgeClaims)
	}

	if token == nil || !isSelfOrAdmin(token, userId) {
		if token == nil {
			writeNotAuthenticated(w)
			return
		}
		logrus.Warn("User attempting to get info on another user")
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, `{"code":"403", "message":"forbidden"}`)
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
	userId, err := uuid.Parse(userIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
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

	user, err := db.GetUserByID(userId)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user == nil {
		logrus.Warn("user does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user does not exist"}`)
		return
	}
	if user.Name != reqData.Name {
		existingUser, err := db.GetUserByName(reqData.Name)
		if err != nil {
			logrus.WithError(err).Error("error checking for existing user")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
			return
		}
		if existingUser != nil {
			logrus.Warn("user with desired name already exists")
			w.WriteHeader(http.StatusBadRequest)
			fmt.Fprint(w, `{"code":"400", "message":"user with desired name already exists"}`)
			return
		}
	}

	if reqData.Image != "" {
		user.Image = reqData.Image
	}

	if reqData.IsAdmin != nil {
		user.IsAdmin = *reqData.IsAdmin
	}

	if reqData.Name != "" {
		user.Name = reqData.Name
	}

	err = db.UpdateUser(user)
	if err != nil {
		logrus.WithError(err).Error("error updating user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating user"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func wouldBlockLastAdminDeletion(isAdmin bool, adminCount int64) bool {
	return isAdmin && adminCount == 1
}

func deleteUser(w http.ResponseWriter, r *http.Request) {
	userIdParam := pat.Param(r, "user_id")
	userId, err := uuid.Parse(userIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil || !isSelfOrAdmin(token, userId) {
		if token == nil {
			writeNotAuthenticated(w)
			return
		}
		logrus.Warn("user attempted to delete another account")
		w.WriteHeader(http.StatusForbidden)
		fmt.Fprint(w, `{"code":"403", "message":"forbidden"}`)
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

	if user.IsAdmin {
		adminCount, err := db.CountAdmins()
		if err != nil {
			logrus.WithError(err).Error("error counting admin users")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error counting admin users"}`)
			return
		}
		if wouldBlockLastAdminDeletion(user.IsAdmin, adminCount) {
			logrus.Warn("attempt to delete the last admin user")
			w.WriteHeader(http.StatusForbidden)
			fmt.Fprint(w, `{"code":"403", "message":"cannot delete the last admin user"}`)
			return
		}
	}

	err = db.SoftDeleteUser(user)
	if err != nil {
		logrus.WithError(err).Error("error deleting user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error deleting user"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

type PutMyHandleRequestBody struct {
	Handle string `json:"handle"`
}

type PutMyHandleResponseBody struct {
	Handle          string     `json:"handle"`
	HandleChangedAt *time.Time `json:"handle_changed_at,omitempty"`
}

func putMyHandle(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	reqData := new(PutMyHandleRequestBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error reading request body", nil)
		return
	}

	if err := json.Unmarshal(reqBodyBytes, reqData); err != nil {
		logrus.WithError(err).Error("JSON parse error")
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "JSON parse error", nil)
		return
	}

	newHandle := reqData.Handle
	if err := validateHandle(newHandle); err != nil {
		code := "INVALID_HANDLE"
		if err == errReservedHandle {
			code = "RESERVED_HANDLE"
		}
		api.WriteAPIError(w, r, http.StatusBadRequest, code, err.Error(), nil)
		return
	}

	user, err := db.GetUserByID(claims.Id)
	if err != nil {
		logrus.WithError(err).Error("error retrieving user")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error retrieving user", nil)
		return
	}
	if user == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "USER_NOT_FOUND", "user not found", nil)
		return
	}

	if normalizeHandle(user.Handle) == normalizeHandle(newHandle) {
		respJSON, err := json.Marshal(PutMyHandleResponseBody{
			Handle:          user.Handle,
			HandleChangedAt: user.HandleChangedAt,
		})
		if err != nil {
			logrus.WithError(err).Error("JSON marshal error")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "JSON marshal error", nil)
			return
		}
		fmt.Fprint(w, string(respJSON))
		return
	}

	if remaining := handleCooldownRemaining(user.HandleChangedAt, time.Now()); remaining > 0 {
		api.WriteAPIError(w, r, http.StatusTooManyRequests, "HANDLE_COOLDOWN", "handle can only be changed once every 30 days", map[string]int64{
			"retry_after_seconds": int64(remaining.Seconds()),
		})
		return
	}

	existing, err := db.GetUserByHandleNormalizedExcludingUser(normalizeHandle(newHandle), user.ID)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing handle")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error checking for existing handle", nil)
		return
	}
	if existing != nil {
		api.WriteAPIError(w, r, http.StatusConflict, "HANDLE_TAKEN", "handle is already taken", nil)
		return
	}

	changedAt := time.Now()
	if err := db.UpdateUserHandle(user, newHandle, changedAt); err != nil {
		logrus.WithError(err).Error("error updating handle")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error updating handle", nil)
		return
	}

	respJSON, err := json.Marshal(PutMyHandleResponseBody{
		Handle:          newHandle,
		HandleChangedAt: &changedAt,
	})
	if err != nil {
		logrus.WithError(err).Error("JSON marshal error")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "JSON marshal error", nil)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func getUserSubmissionCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := parseAuthorizedUserID(w, r)
	if !ok {
		return
	}

	count, err := db.CountUserSubmissions(userID)
	if err != nil {
		logrus.WithError(err).Error("error counting submissions")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error counting submissions", nil)
		return
	}

	fmt.Fprintf(w, `{"count":%d}`, count)
}

func getUserContestCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := parseAuthorizedUserID(w, r)
	if !ok {
		return
	}

	count, err := db.CountUserContests(userID)
	if err != nil {
		logrus.WithError(err).Error("error counting contests")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error counting contests", nil)
		return
	}

	fmt.Fprintf(w, `{"count":%d}`, count)
}

func getTopUsersByContests(w http.ResponseWriter, r *http.Request) {
	limit := 10
	limitParam := r.URL.Query().Get("limit")
	if limitParam != "" {
		parsedLimit, err := strconv.Atoi(limitParam)
		if err != nil || parsedLimit <= 0 {
			api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_LIMIT", "limit must be a positive integer", nil)
			return
		}
		limit = parsedLimit
	}

	users, err := db.GetTopUsersByContests(limit)
	if err != nil {
		logrus.WithError(err).Error("error retrieving top users")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error retrieving top users", nil)
		return
	}

	respJSON, err := json.Marshal(users)
	if err != nil {
		logrus.WithError(err).Error("JSON marshal error")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "JSON marshal error", nil)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func parseAuthorizedUserID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	userIDParam := pat.Param(r, "user_id")
	userID, err := uuid.Parse(userIDParam)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_USER_ID", "bad uuid", nil)
		return uuid.Nil, false
	}

	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return uuid.Nil, false
	}

	if !isSelfOrAdmin(claims, userID) {
		api.WriteAPIError(w, r, http.StatusForbidden, "FORBIDDEN", "forbidden", nil)
		return uuid.Nil, false
	}

	return userID, true
}
