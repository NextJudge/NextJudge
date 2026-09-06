package main

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

const apiTokenPrefix = "nj_"

func addTokenRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/auth/whoami"), AuthRequired(whoami))
	mux.HandleFunc(pat.Get("/v1/tokens"), AuthRequired(listTokens))
	mux.HandleFunc(pat.Post("/v1/tokens"), AuthRequired(createAPITokenHandler))
	mux.HandleFunc(pat.Delete("/v1/tokens/:token_id"), AuthRequired(revokeToken))
}

type createTokenRequest struct {
	Name           string   `json:"name"`
	Scopes         []string `json:"scopes"`
	ExpiresInDays  *int     `json:"expires_in_days"`
}

type createTokenResponse struct {
	Token APITokenPublic `json:"token"`
	Secret string        `json:"secret"`
}

func generateAPITokenSecret() (string, []byte, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", nil, "", err
	}
	secret := apiTokenPrefix + base64.RawURLEncoding.EncodeToString(raw)
	hash := sha256.Sum256([]byte(secret))
	prefix := secret
	if len(prefix) > 12 {
		prefix = prefix[:12]
	}
	return secret, hash[:], prefix, nil
}

func authenticateAPIToken(secret string) (*NextJudgeClaims, *APIToken, error) {
	if !strings.HasPrefix(secret, apiTokenPrefix) {
		return nil, nil, nil
	}
	hash := sha256.Sum256([]byte(secret))
	token, err := db.FindActiveAPITokenByHash(hash[:])
	if err != nil || token == nil {
		return nil, nil, err
	}

	user, err := db.GetUserByID(token.UserID)
	if err != nil || user == nil {
		return nil, nil, err
	}

	role := UserRoleEnum
	if user.IsAdmin {
		role = AdminRoleEnum
	}

	claims := &NextJudgeClaims{
		Id:   user.ID,
		Role: role,
	}
	_ = db.TouchAPITokenLastUsed(token.ID)
	return claims, token, nil
}

func extractAuthorizationValue(header string) string {
	value := strings.TrimSpace(header)
	if strings.HasPrefix(strings.ToLower(value), "bearer ") {
		return strings.TrimSpace(value[7:])
	}
	return value
}

func whoami(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	user, err := db.GetUserByID(claims.Id)
	if err != nil || user == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "USER_NOT_FOUND", "user not found", nil)
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"id":        user.ID,
		"name":      user.Name,
		"email":     user.Email,
		"is_admin":  user.IsAdmin,
		"role":      claims.Role,
	})
}

func listTokens(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	tokens, err := db.ListAPITokensForUser(claims.Id)
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to list tokens", nil)
		return
	}

	public := make([]APITokenPublic, 0, len(tokens))
	for _, token := range tokens {
		public = append(public, toAPITokenPublic(token))
	}
	WriteJSON(w, http.StatusOK, public)
}

func createAPITokenHandler(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	req := new(createTokenRequest)
	if err := json.NewDecoder(r.Body).Decode(req); err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_JSON", "invalid JSON", nil)
		return
	}

	name := strings.TrimSpace(req.Name)
	if name == "" {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INPUT_REQUIRED", "name is required", nil)
		return
	}

	secret, hash, prefix, err := generateAPITokenSecret()
	if err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to generate token", nil)
		return
	}

	scopes := req.Scopes
	if scopes == nil {
		scopes = []string{"cli"}
	}

	var expiresAt *time.Time
	if req.ExpiresInDays != nil && *req.ExpiresInDays > 0 {
		exp := time.Now().Add(time.Duration(*req.ExpiresInDays) * 24 * time.Hour)
		expiresAt = &exp
	}

	token := &APIToken{
		UserID:      claims.Id,
		Name:        name,
		TokenPrefix: prefix,
		TokenHash:   hash,
		Scopes:      scopes,
		ExpiresAt:   expiresAt,
	}
	if err := db.CreateAPIToken(token); err != nil {
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to create token", nil)
		return
	}

	recordAuditEvent(claims.Id, "token.create", "api_token", token.ID.String(), r)
	WriteJSON(w, http.StatusCreated, createTokenResponse{
		Token:  toAPITokenPublic(*token),
		Secret: secret,
	})
}

func revokeToken(w http.ResponseWriter, r *http.Request) {
	claims, ok := requireAuthenticatedClaims(w, r)
	if !ok {
		return
	}

	tokenID, err := uuid.Parse(pat.Param(r, "token_id"))
	if err != nil {
		api.WriteAPIError(w, r, http.StatusBadRequest, "BAD_REQUEST", "invalid token_id", nil)
		return
	}

	if err := db.RevokeAPIToken(tokenID, claims.Id); err != nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "NOT_FOUND", "token not found", nil)
		return
	}

	recordAuditEvent(claims.Id, "token.revoke", "api_token", tokenID.String(), r)
	w.WriteHeader(http.StatusNoContent)
}

func tryAuthenticateAPIToken(w http.ResponseWriter, r *http.Request, authValue string) (*NextJudgeClaims, bool) {
	if !strings.HasPrefix(authValue, apiTokenPrefix) {
		return nil, false
	}

	claims, _, err := authenticateAPIToken(authValue)
	if err != nil {
		logrus.WithError(err).Error("api token lookup failed")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
		return nil, true
	}
	if claims == nil {
		api.WriteAPIError(w, r, http.StatusUnauthorized, "INVALID_TOKEN", "Invalid API token", nil)
		return nil, true
	}
	return claims, true
}