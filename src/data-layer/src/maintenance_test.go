package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestMaintenanceMiddlewareExemptsHealth(t *testing.T) {
	cfg.MaintenanceMode = true
	mux := http.NewServeMux()
	mux.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := MaintenanceMiddleware(mux)
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestMaintenanceMiddlewareBlocksAPI(t *testing.T) {
	cfg.MaintenanceMode = true
	mux := http.NewServeMux()
	mux.HandleFunc("/v1/problems", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := MaintenanceMiddleware(mux)
	req := httptest.NewRequest(http.MethodGet, "/v1/problems", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") != "300" {
		t.Fatalf("expected Retry-After header")
	}
}
