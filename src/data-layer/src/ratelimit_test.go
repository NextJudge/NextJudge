package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"golang.org/x/time/rate"
)

func TestRateLimitMiddlewareBlocksBurst(t *testing.T) {
	t.Parallel()

	limiter := newIPRateLimiter(rate.Limit(1), 1)
	handler := RateLimitMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}, limiter)

	req := httptest.NewRequest(http.MethodPost, "/v1/public/input_submissions", nil)
	req.RemoteAddr = "203.0.113.10:1234"

	rec := httptest.NewRecorder()
	handler(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("first request status = %d, want 200", rec.Code)
	}

	rec = httptest.NewRecorder()
	handler(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("second request status = %d, want 429", rec.Code)
	}

	if got := rec.Header().Get("Retry-After"); got != "60" {
		t.Fatalf("Retry-After = %q, want 60", got)
	}
}

func TestAuthenticatedRateLimitMiddlewareUsesUserKey(t *testing.T) {
	t.Parallel()

	limiter := newKeyedRateLimiter(rate.Limit(1), 1)
	handler := AuthenticatedRateLimitMiddleware(limiter, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	makeRequest := func(userID uuid.UUID) *httptest.ResponseRecorder {
		req := httptest.NewRequest(http.MethodPost, "/v1/submissions", nil)
		req.RemoteAddr = "203.0.113.20:1234"
		if userID != uuid.Nil {
			ctx := context.WithValue(req.Context(), ContextTokenKey, &NextJudgeClaims{Id: userID})
			req = req.WithContext(ctx)
		}

		rec := httptest.NewRecorder()
		handler(rec, req)
		return rec
	}

	firstUser := uuid.MustParse("11111111-1111-1111-1111-111111111111")
	secondUser := uuid.MustParse("22222222-2222-2222-2222-222222222222")

	if rec := makeRequest(firstUser); rec.Code != http.StatusOK {
		t.Fatalf("first user first request = %d, want 200", rec.Code)
	}
	if rec := makeRequest(firstUser); rec.Code != http.StatusTooManyRequests {
		t.Fatalf("first user second request = %d, want 429", rec.Code)
	}
	if rec := makeRequest(secondUser); rec.Code != http.StatusOK {
		t.Fatalf("second user request = %d, want 200", rec.Code)
	}
}
