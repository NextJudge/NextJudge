package api

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestWriteAPIErrorShape(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/v1/problems", nil)
	request = request.WithContext(
		request.Context(),
	)
	request = attachRequestID(request, "req-123")

	response := httptest.NewRecorder()
	WriteAPIError(response, request, http.StatusBadRequest, "INVALID_JSON", "Invalid JSON", map[string]string{"field": "body"})

	if response.Code != http.StatusBadRequest {
		t.Fatalf("WriteAPIError() status = %d, want %d", response.Code, http.StatusBadRequest)
	}

	var payload errorEnvelope
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("WriteAPIError() body is not valid JSON: %v", err)
	}

	if payload.Error.Code != "INVALID_JSON" {
		t.Fatalf("WriteAPIError() code = %q, want %q", payload.Error.Code, "INVALID_JSON")
	}
	if payload.Error.Message != "Invalid JSON" {
		t.Fatalf("WriteAPIError() message = %q, want %q", payload.Error.Message, "Invalid JSON")
	}
	if payload.Error.RequestID != "req-123" {
		t.Fatalf("WriteAPIError() request_id = %q, want %q", payload.Error.RequestID, "req-123")
	}
}

func TestRequestIDMiddlewarePropagatesHeader(t *testing.T) {
	handler := RequestIDMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if RequestIDFromContext(r) != "client-request-id" {
			t.Fatalf("RequestIDFromContext() = %q, want %q", RequestIDFromContext(r), "client-request-id")
		}
		w.WriteHeader(http.StatusOK)
	}))

	request := httptest.NewRequest(http.MethodGet, "/", nil)
	request.Header.Set(RequestIDHeader, "client-request-id")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Header().Get(RequestIDHeader) != "client-request-id" {
		t.Fatalf("response header %q = %q, want %q", RequestIDHeader, response.Header().Get(RequestIDHeader), "client-request-id")
	}
}

func TestRequestIDMiddlewareGeneratesHeader(t *testing.T) {
	handler := RequestIDMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := RequestIDFromContext(r)
		if requestID == "" {
			t.Fatal("RequestIDFromContext() returned empty request id")
		}
		if !strings.Contains(requestID, "-") {
			t.Fatalf("generated request id %q does not look like a UUID", requestID)
		}
		w.WriteHeader(http.StatusOK)
	}))

	request := httptest.NewRequest(http.MethodGet, "/", nil)
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if response.Header().Get(RequestIDHeader) == "" {
		t.Fatalf("response header %q was not set", RequestIDHeader)
	}
}

func attachRequestID(request *http.Request, requestID string) *http.Request {
	ctx := request.Context()
	ctx = contextWithRequestID(ctx, requestID)
	return request.WithContext(ctx)
}

func contextWithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDContextKey{}, requestID)
}
