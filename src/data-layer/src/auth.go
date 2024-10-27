package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

var AUTH_ENABLED = true

func addAuthRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/create_or_login_user"), createOrLoginUser)
	mux.HandleFunc(pat.Post("/v1/login_judge"), loginJudge)
}

type CreateTokenResponse struct {
	Token string    `json:"token"`
	Id    uuid.UUID `json:"id"`
}

type RoleEnum int

const (
	UserRoleEnum  RoleEnum = 0
	JudgeRoleEnum RoleEnum = 1
	AdminRoleEnum RoleEnum = 2
)

type NextJudgeClaims struct {
	Id   uuid.UUID `json:"id"`
	Role RoleEnum  `json:"role"`
	jwt.RegisteredClaims
}

type ContextKeyType string

const ContextTokenKey ContextKeyType = "token"

func createToken(userId uuid.UUID, role RoleEnum) (string, error) {

	claim := NextJudgeClaims{
		Id:   userId,
		Role: role,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	tokenString, err := token.SignedString(cfg.JwtSigningSecret)

	return tokenString, err
}

type AllowTokenFunc func(NextJudgeClaims *NextJudgeClaims) bool

// Specify a call back to allow certain tokens through the auth middleware
func AuthValidate(next http.HandlerFunc, validateFunc AllowTokenFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !AUTH_ENABLED {
			next(w, r)
			return
		}

		// Read token from authorization header
		auth_header, ok := r.Header["Authorization"]

		if !ok {
			logrus.Error("Authorization header missing")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"error":"Authorization header missing"}`)
			return
		}

		if len(auth_header) != 1 {
			logrus.Error("Authorization header requires exactly one value")
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"error":"Authorization header requires exactly one value"}`)
			return
		}

		token, err := jwt.ParseWithClaims(auth_header[0], &NextJudgeClaims{}, func(token *jwt.Token) (interface{}, error) {
			return cfg.JwtSigningSecret, nil
		}, jwt.WithValidMethods([]string{"HS256"}))

		if err != nil {
			logrus.Warn(err)
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"error":"Malformed JWT token"}`)
			return
		}

		claims := token.Claims.(*NextJudgeClaims)

		if validateFunc != nil && !validateFunc(claims) {
			logrus.Warn(err)
			w.WriteHeader(http.StatusUnauthorized)
			fmt.Fprint(w, `{"error":"Unauthorized"}`)
			return
		}

		ctx := context.WithValue(r.Context(), ContextTokenKey, claims)
		r = r.WithContext(ctx)

		next(w, r)
	}
}

func AuthRequired(next http.HandlerFunc) http.HandlerFunc {
	return AuthValidate(next, nil)
}

func atLeastJudgeRequiredChecker(token *NextJudgeClaims) bool {
	return token.Role >= JudgeRoleEnum
}

func AtLeastJudgeRequired(next http.HandlerFunc) http.HandlerFunc {
	return AuthValidate(next, atLeastJudgeRequiredChecker)
}

func adminRequiredRequiredChecker(token *NextJudgeClaims) bool {
	return token.Role == JudgeRoleEnum
}

func AdminRequired(next http.HandlerFunc) http.HandlerFunc {
	return AuthValidate(next, adminRequiredRequiredChecker)
}

type LoginUserSubmission struct {
	Id    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func createOrLoginUser(w http.ResponseWriter, r *http.Request) {
	reqData := new(LoginUserSubmission)
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

	// Only a trusted application can create tokens
	// Read token from authorization header
	auth_header, ok := r.Header["Authorization"]

	if !ok {
		logrus.Error("Authorization header missing")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `Authorization header missing`)
		return
	}

	if len(auth_header) != 1 {
		logrus.Error("Authorization header requires exactly one value")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `Authorization header requires exactly one value`)
		return
	}

	if subtle.ConstantTimeCompare([]byte(auth_header[0]), cfg.AuthProviderPassword) == 1 {

		newUserData := User{
			AccountIdentifier: reqData.Id,
			Email:             reqData.Email,
			Name:              reqData.Name,
			IsAdmin:           false,
		}

		user, err := db.GetOrCreateUserByAccountIdentifier(&newUserData)

		if err != nil {
			logrus.WithError(err).Error("error creating or fetching user")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"message":"error inserting user"}`)
			return
		}

		newToken, err := createToken(user.ID, UserRoleEnum)

		if err != nil {
			logrus.WithError(err).Error("error creating JWT token")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"message":"error creating JWT token"}`)
			return
		}

		respData := CreateTokenResponse{
			Token: newToken,
			Id:    user.ID,
		}
		// Write the JSON token back!

		respJSON, err := json.Marshal(respData)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"message":"JSON parse error"}`)
			return
		}
		fmt.Fprint(w, string(respJSON))

	} else {
		logrus.Warn("Auth failure in creating user")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"error":"Unauthorized"}`)
		return
	}
}

func loginJudge(w http.ResponseWriter, r *http.Request) {
	auth_header, ok := r.Header["Authorization"]

	if !ok {
		logrus.Error("Authorization header missing")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `Authorization header missing`)
		return
	}

	if len(auth_header) != 1 {
		logrus.Error("Authorization header requires exactly one value")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `Authorization header requires exactly one value`)
		return
	}

	if subtle.ConstantTimeCompare([]byte(auth_header[0]), cfg.JudgePassword) == 1 {

		newToken, err := createToken(uuid.Nil, JudgeRoleEnum)

		if err != nil {
			logrus.WithError(err).Error("error creating JWT token")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"message":"error creating JWT token"}`)
			return
		}

		respData := CreateTokenResponse{
			Token: newToken,
		}

		respJSON, err := json.Marshal(respData)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"message":"JSON parse error"}`)
			return
		}
		fmt.Fprint(w, string(respJSON))

	} else {
		logrus.Warn("Auth failure in creating user")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"error":"Unauthorized"}`)
		return
	}
}
