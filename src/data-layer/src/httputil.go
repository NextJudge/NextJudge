package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/sirupsen/logrus"
	"goji.io/pat"
)

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func WriteError(w http.ResponseWriter, status int, message, code string) {
	w.WriteHeader(status)
	respJSON, err := json.Marshal(ErrorResponse{Code: code, Message: message})
	if err != nil {
		logrus.WithError(err).Error("JSON marshal error in WriteError")
		fmt.Fprint(w, `{"code":"500", "message":"internal error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
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
