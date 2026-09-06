package main

import (
	"net/http"
	"strings"
)

func MaintenanceMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !cfg.MaintenanceMode {
			h.ServeHTTP(w, r)
			return
		}

		if isMaintenanceExemptPath(r.URL.Path) {
			h.ServeHTTP(w, r)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Retry-After", "300")
		w.WriteHeader(http.StatusServiceUnavailable)
		_, _ = w.Write([]byte(`{"error":{"code":"MAINTENANCE","message":"API is temporarily unavailable for maintenance"}}`))
	})
}

func isMaintenanceExemptPath(path string) bool {
	switch strings.TrimSuffix(path, "/") {
	case "", "/health", "/healthy", "/v1/openapi.json":
		return true
	default:
		return false
	}
}
