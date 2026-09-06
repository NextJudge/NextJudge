package main

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"slices"
	"strings"
	"time"

	"golang.org/x/crypto/argon2"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

func addAuthRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/create_or_login_user"), createOrLoginUser)
	mux.HandleFunc(pat.Post("/v1/login_judge"), loginJudge)
	mux.HandleFunc(pat.Post("/v1/basic_register"), RateLimitMiddleware(basicRegister, authEndpointLimiter))
	mux.HandleFunc(pat.Post("/v1/basic_login"), RateLimitMiddleware(basicLogin, authEndpointLimiter))
	mux.HandleFunc(pat.Post("/v1/basic_request_password_reset"), RateLimitMiddleware(basicRequestPasswordReset, authEndpointLimiter))
	mux.HandleFunc(pat.Post("/v1/basic_reset_password"), RateLimitMiddleware(basicResetPassword, authEndpointLimiter))
}

type CreateTokenResponse struct {
	Token string    `json:"token"`
	Id    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Email string    `json:"email"`
	Image string    `json:"image,omitempty"`
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
	now := time.Now()
	claim := NextJudgeClaims{
		Id:   userId,
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	tokenString, err := token.SignedString(cfg.JwtSigningSecret)

	return tokenString, err
}

type AllowTokenFunc func(NextJudgeClaims *NextJudgeClaims) bool

func isSelfOrAdmin(token *NextJudgeClaims, targetID uuid.UUID) bool {
	return token != nil && (token.Id == targetID || token.Role == AdminRoleEnum)
}

func skipUserExistenceCheck(claims *NextJudgeClaims) bool {
	return claims.Role == JudgeRoleEnum && claims.Id == uuid.Nil
}

func validateTokenUserExists(w http.ResponseWriter, r *http.Request, claims *NextJudgeClaims) bool {
	if skipUserExistenceCheck(claims) {
		return true
	}

	user, err := db.GetUserByID(claims.Id)
	if err != nil {
		logrus.WithError(err).Error("error validating user for token")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
		return false
	}

	if user == nil {
		logrus.Warn("JWT token references deleted or missing user")
		api.WriteAPIError(w, r, http.StatusUnauthorized, "USER_NOT_FOUND", "User account no longer exists", nil)
		return false
	}

	return true
}

// Specify a call back to allow certain tokens through the auth middleware
func AuthValidate(next http.HandlerFunc, validateFunc AllowTokenFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth_header, ok := r.Header["Authorization"]

		if !ok {
			logrus.Error("Authorization header missing")
			api.WriteAPIError(w, r, http.StatusUnauthorized, "AUTHORIZATION_MISSING", "Authorization header missing", nil)
			return
		}

		if len(auth_header) != 1 {
			logrus.Error("Authorization header requires exactly one value")
			api.WriteAPIError(w, r, http.StatusUnauthorized, "AUTHORIZATION_INVALID", "Authorization header requires exactly one value", nil)
			return
		}

		authValue := extractAuthorizationValue(auth_header[0])

		if strings.HasPrefix(authValue, apiTokenPrefix) {
			claims, handled := tryAuthenticateAPIToken(w, r, authValue)
			if handled {
				return
			}
			if validateFunc != nil && !validateFunc(claims) {
				api.WriteAPIError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
				return
			}
			ctx := context.WithValue(r.Context(), ContextTokenKey, claims)
			r = r.WithContext(ctx)
			next(w, r)
			return
		}

		token, err := jwt.ParseWithClaims(authValue, &NextJudgeClaims{}, func(token *jwt.Token) (interface{}, error) {
			return cfg.JwtSigningSecret, nil
		}, jwt.WithValidMethods([]string{"HS256"}))
		if err != nil {
			logrus.Warn(err)
			api.WriteAPIError(w, r, http.StatusUnauthorized, "MALFORMED_JWT", "Malformed JWT token", nil)
			return
		}

		claims := token.Claims.(*NextJudgeClaims)

		if validateFunc != nil && !validateFunc(claims) {
			logrus.Warn(err)
			api.WriteAPIError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
			return
		}

		if !validateTokenUserExists(w, r, claims) {
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
	return token.Role == AdminRoleEnum
}

func AdminRequired(next http.HandlerFunc) http.HandlerFunc {
	return AuthValidate(next, adminRequiredRequiredChecker)
}

type LoginUserSubmission struct {
	Id    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Image string `json:"image"`
}

func createOrLoginUser(w http.ResponseWriter, r *http.Request) {
	reqData := new(LoginUserSubmission)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "500", "error reading request body", nil)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "500", "JSON parse error", nil)
		return
	}

	// Only a trusted application can create tokens
	// Read token from authorization header
	auth_header, ok := r.Header["Authorization"]

	if !ok {
		logrus.Error("Authorization header missing")
		api.WriteAPIError(w, r, http.StatusUnauthorized, "AUTHORIZATION_MISSING", "Authorization header missing", nil)
		return
	}

	if len(auth_header) != 1 {
		logrus.Error("Authorization header requires exactly one value")
		api.WriteAPIError(w, r, http.StatusUnauthorized, "AUTHORIZATION_INVALID", "Authorization header requires exactly one value", nil)
		return
	}

	if subtle.ConstantTimeCompare([]byte(auth_header[0]), cfg.WebBridgeSecret) == 1 {

		newUserData := User{
			AccountIdentifier: reqData.Id,
			Email:             reqData.Email,
			Name:              reqData.Name,
			Image:             reqData.Image,
			IsAdmin:           isAdminEmail(reqData.Email),
		}

		user, err := db.GetOrCreateUserByAccountIdentifier(&newUserData)
		if err != nil {
			logrus.WithError(err).Error("error creating or fetching user")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "DATABASE_ERROR", "error inserting user", nil)
			return
		}

		role := UserRoleEnum
		if user.IsAdmin {
			role = AdminRoleEnum
		}
		newToken, err := createToken(user.ID, role)
		if err != nil {
			logrus.WithError(err).Error("error creating JWT token")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "TOKEN_ERROR", "error creating JWT token", nil)
			return
		}

		respData := CreateTokenResponse{
			Token: newToken,
			Id:    user.ID,
			Name:  user.Name,
			Email: user.Email,
			Image: user.Image,
		}
		// Write the JSON token back!

		respJSON, err := json.Marshal(respData)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "500", "JSON parse error", nil)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, string(respJSON))

	} else {
		logrus.Warn("Auth failure in creating user")
		api.WriteAPIError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}
}

func loginJudge(w http.ResponseWriter, r *http.Request) {
	auth_header, ok := r.Header["Authorization"]

	if !ok {
		logrus.Error("Authorization header missing")
		api.WriteAPIError(w, r, http.StatusUnauthorized, "AUTHORIZATION_MISSING", "Authorization header missing", nil)
		return
	}

	if len(auth_header) != 1 {
		logrus.Error("Authorization header requires exactly one value")
		api.WriteAPIError(w, r, http.StatusUnauthorized, "AUTHORIZATION_INVALID", "Authorization header requires exactly one value", nil)
		return
	}

	if subtle.ConstantTimeCompare([]byte(auth_header[0]), cfg.JudgePassword) == 1 {

		newToken, err := createToken(uuid.Nil, JudgeRoleEnum)
		if err != nil {
			logrus.WithError(err).Error("error creating JWT token")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "TOKEN_ERROR", "error creating JWT token", nil)
			return
		}

		respData := CreateTokenResponse{
			Token: newToken,
		}

		respJSON, err := json.Marshal(respData)
		if err != nil {
			logrus.WithError(err).Error("JSON parse error")
			api.WriteAPIError(w, r, http.StatusInternalServerError, "500", "JSON parse error", nil)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, string(respJSON))
	} else {
		logrus.Warn("Auth failure in creating user")
		api.WriteAPIError(w, r, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
		return
	}
}

type BasicUserPost struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Image    string `json:"image"`
}

func isAdminEmail(email string) bool {
	if slices.Contains(cfg.AdminEmails, email) {
		logrus.Info("Email ", email, " is an admin email")
		return true
	}
	logrus.Info("Email ", email, " is NOT an admin email")
	return false
}

func writeErrorResponse(w http.ResponseWriter, r *http.Request, statusCode int, errorMsg string, errorCode string) {
	api.WriteAPIError(w, r, statusCode, errorCode, errorMsg, nil)
}

func basicRegister(w http.ResponseWriter, r *http.Request) {
	if !cfg.BasicRegistrationEnabled {
<<<<<<< HEAD
		writeErrorResponse(w, r, http.StatusForbidden, "Basic registration is disabled; use GitHub to create an account", "BASIC_REGISTRATION_DISABLED")
=======
		writeErrorResponse(w, http.StatusForbidden, "Basic registration is disabled; use GitHub to create an account", "BASIC_REGISTRATION_DISABLED")
>>>>>>> origin/main
		return
	}

	reqData := new(BasicUserPost)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid request body", "INVALID_BODY")
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	accountIdentifier := "basic-" + reqData.Email

	user, err := db.GetUserByAccountIdentifier(accountIdentifier)
	if err != nil {
		logrus.WithError(err).Error("Database error")
		writeErrorResponse(w, r, http.StatusInternalServerError, "Database error", "DATABASE_ERROR")
		return
	}

	if user != nil {
		logrus.Error("User already exists")
		writeErrorResponse(w, r, http.StatusConflict, "User already exists", "USER_EXISTS")
		return
	}

	salt := make([]byte, 16)
	_, err = rand.Read(salt)
	if err != nil {
		logrus.Error("User registration failed - could not create random number")
		writeErrorResponse(w, r, http.StatusInternalServerError, "Registration failed", "SALT_GENERATION_ERROR")
		return
	}

	passwordHash := argon2.IDKey([]byte(reqData.Password), salt, 1, 64*1024, 4, 32)

	newUserData := UserWithPassword{
		User: User{
			AccountIdentifier: accountIdentifier,
			Name:              reqData.Name,
			Email:             reqData.Email,
			Image:             reqData.Image,
			IsAdmin:           isAdminEmail(reqData.Email),
		},
		Salt:         salt,
		PasswordHash: passwordHash,
	}

	newUser, err := db.CreateUserWithPasswordHash(&newUserData)
	if err != nil {
		logrus.Error("User registration failed - database failure")
		writeErrorResponse(w, r, http.StatusInternalServerError, "Registration failed", "DATABASE_ERROR")
		return
	}

	role := UserRoleEnum
	if newUser.IsAdmin {
		role = AdminRoleEnum
	}
	newToken, err := createToken(newUser.ID, role)
	if err != nil {
		logrus.WithError(err).Error("error creating JWT token")
		writeErrorResponse(w, r, http.StatusInternalServerError, "Token creation failed", "TOKEN_ERROR")
		return
	}

	respData := CreateTokenResponse{
		Token: newToken,
		Id:    newUser.ID,
		Name:  newUser.Name,
		Email: newUser.Email,
		Image: newUser.Image,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(respData)
}

func basicLogin(w http.ResponseWriter, r *http.Request) {
	reqData := new(BasicUserPost)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid request body", "INVALID_BODY")
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	accountIdentifier := "basic-" + reqData.Email
	user, err := db.GetUserByAccountIdentifierWithPasswordHash(accountIdentifier)

	if user == nil {
		logrus.WithError(err).Error("No such user or database error")
		writeErrorResponse(w, r, http.StatusUnauthorized, "Invalid credentials", "INVALID_CREDENTIALS")
		return
	}

	currentPasswordHash := argon2.IDKey([]byte(reqData.Password), user.Salt, 1, 64*1024, 4, 32)

	if subtle.ConstantTimeCompare([]byte(currentPasswordHash), user.PasswordHash) != 1 {
		logrus.Warn("Incorrect credential attempt")
		writeErrorResponse(w, r, http.StatusUnauthorized, "Invalid credentials", "INVALID_CREDENTIALS")
		return
	}

	role := UserRoleEnum
	if user.IsAdmin {
		role = AdminRoleEnum
	}

	newToken, err := createToken(user.ID, role)
	if err != nil {
		logrus.WithError(err).Error("error creating JWT token")
		writeErrorResponse(w, r, http.StatusInternalServerError, "Token creation failed", "TOKEN_ERROR")
		return
	}

	respData := CreateTokenResponse{
		Token: newToken,
		Id:    user.ID,
		Name:  user.Name,
		Email: user.Email,
		Image: user.Image,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(respData)
}

type PasswordResetRequest struct {
	Email string `json:"email"`
}

type PasswordResetDirect struct {
	Email       string `json:"email"`
	NewPassword string `json:"new_password"`
	Token       string `json:"token"`
}

type PasswordResetRequestResponse struct {
	Status string `json:"status"`
	Token  string `json:"token,omitempty"`
}

func isTrustedWebBridgeRequest(r *http.Request) bool {
	authHeaders, ok := r.Header["Authorization"]
	return len(cfg.WebBridgeSecret) > 0 && ok && len(authHeaders) == 1 &&
		subtle.ConstantTimeCompare([]byte(authHeaders[0]), cfg.WebBridgeSecret) == 1
}

// validates the email exists and stores a single-use reset token.
func basicRequestPasswordReset(w http.ResponseWriter, r *http.Request) {
	req := new(PasswordResetRequest)
	body, err := readLimitedBody(r)
	if err != nil {
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid request body", "INVALID_BODY")
		return
	}
	if err := json.Unmarshal(body, req); err != nil {
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if req.Email == "" {
		writeErrorResponse(w, r, http.StatusBadRequest, "Email required", "EMAIL_REQUIRED")
		return
	}

	user, err := db.GetUserByEmail(req.Email)
	if err != nil {
		writeErrorResponse(w, r, http.StatusInternalServerError, "Database error", "DATABASE_ERROR")
		return
	}

	resp := PasswordResetRequestResponse{Status: "ok"}
	if user != nil {
		plainToken, tokenErr := generatePasswordResetPlainToken()
		if tokenErr != nil {
			writeErrorResponse(w, r, http.StatusInternalServerError, "Token generation failed", "TOKEN_GENERATION_ERROR")
			return
		}
		if storeErr := db.CreatePasswordResetToken(user.ID, plainToken, time.Hour); storeErr != nil {
			writeErrorResponse(w, r, http.StatusInternalServerError, "Database error", "DATABASE_ERROR")
			return
		}
		if cfg.PasswordResetDebug || isTrustedWebBridgeRequest(r) {
			resp.Token = plainToken
		}
		if cfg.PasswordResetDebug {
			logrus.WithField("email", req.Email).Warn("PASSWORD_RESET_DEBUG enabled: reset token issued")
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func basicResetPassword(w http.ResponseWriter, r *http.Request) {
	req := new(PasswordResetDirect)
	body, err := readLimitedBody(r)
	if err != nil {
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid request body", "INVALID_BODY")
		return
	}
	if err := json.Unmarshal(body, req); err != nil {
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid JSON", "INVALID_JSON")
		return
	}

	if req.Email == "" || req.NewPassword == "" {
		writeErrorResponse(w, r, http.StatusBadRequest, "Email and new_password required", "INPUT_REQUIRED")
		return
	}

	if cfg.AllowInsecurePasswordReset && req.Token == "" {
		basicResetPasswordInsecure(w, r, req)
		return
	}

	if req.Token == "" {
		writeErrorResponse(w, r, http.StatusBadRequest, "Reset token required", "TOKEN_REQUIRED")
		return
	}

	user, err := db.ValidatePasswordResetToken(req.Email, req.Token)
	if err != nil {
		writeErrorResponse(w, r, http.StatusInternalServerError, "Database error", "DATABASE_ERROR")
		return
	}
	if user == nil {
		writeErrorResponse(w, r, http.StatusBadRequest, "Invalid or expired reset token", "INVALID_TOKEN")
		return
	}

	if err := applyPasswordReset(w, r, user, req.NewPassword); err != nil {
		return
	}

	if err := db.ConsumePasswordResetToken(user.ID, req.Token); err != nil {
		logrus.WithError(err).Warn("failed to consume password reset token")
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"status":"ok"}`)
}

func basicResetPasswordInsecure(w http.ResponseWriter, r *http.Request, req *PasswordResetDirect) {
	logrus.Warn("ALLOW_INSECURE_PASSWORD_RESET enabled: resetting password without token")
	user, err := db.GetUserByEmail(req.Email)
	if err != nil {
		writeErrorResponse(w, r, http.StatusInternalServerError, "Database error", "DATABASE_ERROR")
		return
	}
	if user == nil {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprint(w, `{"status":"ok"}`)
		return
	}
	if err := applyPasswordReset(w, r, user, req.NewPassword); err != nil {
		return
	}
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, `{"status":"ok"}`)
}

func applyPasswordReset(w http.ResponseWriter, r *http.Request, user *User, newPassword string) error {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		writeErrorResponse(w, r, http.StatusInternalServerError, "Salt generation failed", "SALT_GENERATION_ERROR")
		return err
	}
	passwordHash := argon2.IDKey([]byte(newPassword), salt, 1, 64*1024, 4, 32)

	updatedUser, err := db.UpdateUserPasswordByEmail(user.Email, salt, passwordHash)
	if err != nil {
		writeErrorResponse(w, r, http.StatusInternalServerError, "Database error", "DATABASE_ERROR")
		return err
	}
	if updatedUser == nil {
		writeErrorResponse(w, r, http.StatusInternalServerError, "Database error", "DATABASE_ERROR")
		return fmt.Errorf("user not updated")
	}
	return nil
}
