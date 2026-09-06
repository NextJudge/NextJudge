package api

import (
	"context"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

const RequestIDHeader = "X-Request-ID"

type requestIDContextKey struct{}

// RequestIDMiddleware propagates X-Request-ID from the client or generates one.
func RequestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := strings.TrimSpace(r.Header.Get(RequestIDHeader))
		if requestID == "" {
			requestID = uuid.New().String()
		}

		w.Header().Set(RequestIDHeader, requestID)
		ctx := context.WithValue(r.Context(), requestIDContextKey{}, requestID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequestIDFromContext returns the request ID attached by RequestIDMiddleware.
func RequestIDFromContext(r *http.Request) string {
	if r == nil {
		return ""
	}

	requestID, ok := r.Context().Value(requestIDContextKey{}).(string)
	if !ok {
		return ""
	}

	return requestID
}
