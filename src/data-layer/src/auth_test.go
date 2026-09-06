package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestBasicRegisterDisabledByDefault(t *testing.T) {
	previous := cfg.BasicRegistrationEnabled
	cfg.BasicRegistrationEnabled = false
	t.Cleanup(func() { cfg.BasicRegistrationEnabled = previous })

	request := httptest.NewRequest(http.MethodPost, "/v1/basic_register", strings.NewReader(`{"name":"New User","email":"new@example.com","password":"password"}`))
	response := httptest.NewRecorder()

	basicRegister(response, request)

	if response.Code != http.StatusForbidden {
		t.Fatalf("basicRegister() status = %d, want %d", response.Code, http.StatusForbidden)
	}
	if !strings.Contains(response.Body.String(), `"code":"BASIC_REGISTRATION_DISABLED"`) {
		t.Fatalf("basicRegister() body = %q, want disabled registration code", response.Body.String())
	}
}

func TestBasicRegisterCanBeExplicitlyEnabled(t *testing.T) {
	previous := cfg.BasicRegistrationEnabled
	cfg.BasicRegistrationEnabled = true
	t.Cleanup(func() { cfg.BasicRegistrationEnabled = previous })

	request := httptest.NewRequest(http.MethodPost, "/v1/basic_register", strings.NewReader("not-json"))
	response := httptest.NewRecorder()

	basicRegister(response, request)

	if response.Code != http.StatusBadRequest {
		t.Fatalf("basicRegister() status = %d, want %d", response.Code, http.StatusBadRequest)
	}
	if !strings.Contains(response.Body.String(), `"code":"INVALID_JSON"`) {
		t.Fatalf("basicRegister() body = %q, want request to reach registration handler", response.Body.String())
	}
}

func TestTrustedWebBridgeRequest(t *testing.T) {
	previous := cfg.WebBridgeSecret
	cfg.WebBridgeSecret = []byte("test-web-bridge-secret")
	t.Cleanup(func() { cfg.WebBridgeSecret = previous })

	tests := []struct {
		name       string
		authorizer []string
		want       bool
	}{
		{name: "matching secret", authorizer: []string{"test-web-bridge-secret"}, want: true},
		{name: "missing header", want: false},
		{name: "wrong secret", authorizer: []string{"wrong"}, want: false},
		{name: "multiple values", authorizer: []string{"test-web-bridge-secret", "second"}, want: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodPost, "/v1/basic_request_password_reset", nil)
			if test.authorizer != nil {
				request.Header["Authorization"] = test.authorizer
			}
			if got := isTrustedWebBridgeRequest(request); got != test.want {
				t.Fatalf("isTrustedWebBridgeRequest() = %v, want %v", got, test.want)
			}
		})
	}
}

func TestTrustedWebBridgeRequestRejectsEmptyConfiguredSecret(t *testing.T) {
	previous := cfg.WebBridgeSecret
	cfg.WebBridgeSecret = nil
	t.Cleanup(func() { cfg.WebBridgeSecret = previous })

	request := httptest.NewRequest(http.MethodPost, "/v1/basic_request_password_reset", nil)
	request.Header["Authorization"] = []string{""}

	if isTrustedWebBridgeRequest(request) {
		t.Fatal("isTrustedWebBridgeRequest() accepted an empty configured secret")
	}
}

func TestSkipUserExistenceCheck(t *testing.T) {
	t.Parallel()

	userID := uuid.New()

	tests := []struct {
		name   string
		claims *NextJudgeClaims
		want   bool
	}{
		{
			name:   "judge service token skips check",
			claims: &NextJudgeClaims{Id: uuid.Nil, Role: JudgeRoleEnum},
			want:   true,
		},
		{
			name:   "user token requires check",
			claims: &NextJudgeClaims{Id: userID, Role: UserRoleEnum},
			want:   false,
		},
		{
			name:   "admin token requires check",
			claims: &NextJudgeClaims{Id: userID, Role: AdminRoleEnum},
			want:   false,
		},
		{
			name:   "judge role with user id requires check",
			claims: &NextJudgeClaims{Id: userID, Role: JudgeRoleEnum},
			want:   false,
		},
		{
			name:   "nil user id with user role requires check",
			claims: &NextJudgeClaims{Id: uuid.Nil, Role: UserRoleEnum},
			want:   false,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := skipUserExistenceCheck(tt.claims)
			if got != tt.want {
				t.Fatalf("skipUserExistenceCheck() = %v, want %v", got, tt.want)
			}
		})
	}
}
