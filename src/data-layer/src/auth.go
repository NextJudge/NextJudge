package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"golang.org/x/crypto/argon2"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

// var AUTH_ENABLED = false

func addAuthRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/create_or_login_user"), createOrLoginUser)
	mux.HandleFunc(pat.Post("/v1/login_judge"), loginJudge)
	mux.HandleFunc(pat.Post("/v1/basic_register"), basicRegister)
	mux.HandleFunc(pat.Post("/v1/basic_login"), basicLogin)

	if cfg.AuthDisabled {
		// Get (and create) dummy users for testing
		mux.HandleFunc(pat.Post("/v1/auth_test/user_creds"), getUserCreds)
		// mux.HandleFunc(pat.Get("/v1/auth_test/admin_creds"), getAdminCreds)
	}
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
		// if !AUTH_ENABLED {
		if cfg.AuthDisabled {
			// If a header is included, add it to the context anyways
			auth_header, ok := r.Header["Authorization"]

			if ok && len(auth_header) == 1 {
				token, err := jwt.ParseWithClaims(auth_header[0], &NextJudgeClaims{}, func(token *jwt.Token) (interface{}, error) {
					return cfg.JwtSigningSecret, nil
				}, jwt.WithValidMethods([]string{"HS256"}))

				if err == nil {
					claims := token.Claims.(*NextJudgeClaims)

					// TODO: revisit this
					// if validateFunc != nil && !validateFunc(claims) {
					// 	logrus.Warn(err)
					// 	w.WriteHeader(http.StatusUnauthorized)
					// 	fmt.Fprint(w, `{"error":"Unauthorized"}`)
					// 	return
					// }

					ctx := context.WithValue(r.Context(), ContextTokenKey, claims)
					r = r.WithContext(ctx)
				}
			}

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
	// TODO - check this out
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

type BasicUserPost struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func basicRegister(w http.ResponseWriter, r *http.Request) {
	reqData := new(BasicUserPost)
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

	accountIdentifier := "basic-" + reqData.Email

	user, err := db.GetUserByAccountIdentifier(accountIdentifier)

	if err != nil {
		// Database error
		logrus.WithError(err).Error("Database error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error"}`)
	}

	if user != nil {
		// User already exists
		logrus.WithError(err).Error("User already exists")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"User with that name already exists"}`)
		return
	}

	// No such user

	salt := make([]byte, 16)
	_, err = rand.Read(salt)
	if err != nil {
		logrus.Error("User registration failed - could not create random number")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"error":"User registration failed"}`)
		return
	}

	passwordHash := argon2.IDKey([]byte(reqData.Password), salt, 1, 64*1024, 4, 32)

	newUserData := UserWithPassword{
		User: User{
			AccountIdentifier: accountIdentifier,
			Email:             reqData.Email,
		},
		Salt:         salt,
		PasswordHash: passwordHash,
	}

	newUser, err := db.CreateUserWithPasswordHash(&newUserData)

	if err != nil {
		logrus.Error("User registration failed - database failure")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"error":"User registration failed"}`)
		return
	}

	// Now, create a token with this new user and return it
	newToken, err := createToken(newUser.ID, UserRoleEnum)

	if err != nil {
		logrus.WithError(err).Error("error creating JWT token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"error creating JWT token"}`)
		return
	}

	respData := CreateTokenResponse{
		Token: newToken,
		Id:    newUser.ID,
	}

	respJSON, err := json.Marshal(respData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"JSON parse error"}`)
		return
	}
	fmt.Println("User creation success")
	fmt.Fprint(w, string(respJSON))
}

func basicLogin(w http.ResponseWriter, r *http.Request) {
	reqData := new(BasicUserPost)
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

	accountIdentifier := "basic-" + reqData.Email
	user, err := db.GetUserByAccountIdentifierWithPasswordHash(accountIdentifier)

	if user == nil {
		// Database error
		logrus.WithError(err).Error("No such user or database error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error"}`)
		return
	}

	currentPasswordHash := argon2.IDKey([]byte(reqData.Password), user.Salt, 1, 64*1024, 4, 32)

	if subtle.ConstantTimeCompare([]byte(currentPasswordHash), user.PasswordHash) == 1 {

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

		respJSON, err := json.Marshal(respData)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"message":"JSON parse error"}`)
			return
		}
		fmt.Println("Login Success", user.AccountIdentifier)
		fmt.Fprint(w, string(respJSON))
	} else {
		logrus.Warn("Incorrect credential attempt")
		w.WriteHeader(http.StatusUnauthorized)
		fmt.Fprint(w, `{"error":"Incorrect credentials"}`)
		return
	}
}

const AUTH_TEST_USER = "__nextjudge_auth_test_user"

func getUserCreds(w http.ResponseWriter, r *http.Request) {
	user, err := db.GetUserByName(AUTH_TEST_USER)
	if err != nil {
		logrus.WithError(err).Error("error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"error"}`)
		return
	}
	if user == nil {
		user, err = db.CreateUser(
			&User{
				Name: AUTH_TEST_USER,
			},
		)
		if err != nil {
			logrus.WithError(err).Error("error")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"message":"error"}`)
			return
		}
	}

	// Now, create a token with this new user and return it
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

	respJSON, err := json.Marshal(respData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}
