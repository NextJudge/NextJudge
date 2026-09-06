package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/sirupsen/logrus"
)

type errorEnvelope struct {
	Error errorBody `json:"error"`
}

type errorBody struct {
	Code      string      `json:"code"`
	Message   string      `json:"message"`
	Details   interface{} `json:"details"`
	RequestID string      `json:"request_id"`
}

// WriteAPIError writes a standardized JSON error response:
// {"error":{"code","message","details","request_id"}}
func WriteAPIError(w http.ResponseWriter, r *http.Request, status int, code, message string, details interface{}) {
	requestID := RequestIDFromContext(r)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	payload := errorEnvelope{
		Error: errorBody{
			Code:      code,
			Message:   message,
			Details:   details,
			RequestID: requestID,
		},
	}

	respJSON, err := json.Marshal(payload)
	if err != nil {
		logrus.WithError(err).Error("JSON marshal error in WriteAPIError")
		fmt.Fprint(w, `{"error":{"code":"INTERNAL_ERROR","message":"internal error","details":null,"request_id":""}}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}
