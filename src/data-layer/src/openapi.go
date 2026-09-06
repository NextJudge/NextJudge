package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
	"gopkg.in/yaml.v3"

	openapispec "main/openapi"

	"main/src/api"
)

var (
	openapiJSONOnce sync.Once
	openapiJSON     []byte
	openapiJSONErr  error
)

func addOpenAPIRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/openapi.json"), getOpenAPISpec)
}

func getOpenAPIJSON() ([]byte, error) {
	openapiJSONOnce.Do(func() {
		var parsed any
		if err := yaml.Unmarshal(openapispec.SpecYAML, &parsed); err != nil {
			openapiJSONErr = err
			return
		}

		openapiJSON, openapiJSONErr = json.Marshal(parsed)
	})

	return openapiJSON, openapiJSONErr
}

func getOpenAPISpec(w http.ResponseWriter, r *http.Request) {
	payload, err := getOpenAPIJSON()
	if err != nil {
		logrus.WithError(err).Error("failed to convert embedded OpenAPI spec to JSON")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "failed to load OpenAPI spec", nil)
		return
	}

	w.WriteHeader(http.StatusOK)
	if _, err := fmt.Fprint(w, string(payload)); err != nil {
		logrus.WithError(err).Error("failed to write OpenAPI spec response")
	}
}
