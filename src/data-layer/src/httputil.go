package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/sirupsen/logrus"
	"goji.io/pat"

	"main/src/api"
)

const maxRequestBodyBytes = 1 << 20 // 1 MiB

func readLimitedBody(r *http.Request) ([]byte, error) {
	return io.ReadAll(r.Body)
}

func LimitRequestBodyMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil && r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions {
			r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodyBytes)
		}
		h.ServeHTTP(w, r)
	})
}

func WriteError(w http.ResponseWriter, status int, message, code string) {
	api.WriteAPIError(w, nil, status, code, message, nil)
}

func WriteJSON(w http.ResponseWriter, status int, payload interface{}) {
	respJSON, err := json.Marshal(payload)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		WriteError(w, http.StatusInternalServerError, "JSON parse error", "500")
		return
	}
	w.WriteHeader(status)
	fmt.Fprint(w, string(respJSON))
}

func ParseIntParam(r *http.Request, name string) (int, error) {
	return strconv.Atoi(pat.Param(r, name))
}

func ParseEventID(r *http.Request) (int, error) {
	return ParseIntParam(r, "event_id")
}
