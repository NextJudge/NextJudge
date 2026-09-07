package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGetScalarDocs(t *testing.T) {
	recorder := httptest.NewRecorder()
	getScalarDocs(recorder, httptest.NewRequest(http.MethodGet, "/docs", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", recorder.Code)
	}
	if contentType := recorder.Header().Get("Content-Type"); contentType != "text/html; charset=utf-8" {
		t.Fatalf("expected HTML content type, got %q", contentType)
	}
	for _, expected := range []string{"@scalar/api-reference", "'/v1/openapi.json'", "NextJudge API Reference"} {
		if !strings.Contains(recorder.Body.String(), expected) {
			t.Fatalf("expected docs response to contain %q", expected)
		}
	}
}

func TestGetOpenAPISpec(t *testing.T) {
	request := httptest.NewRequest(http.MethodGet, "/v1/openapi.json", nil)
	recorder := httptest.NewRecorder()

	getOpenAPISpec(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", recorder.Code, recorder.Body.String())
	}

	var payload map[string]any
	if err := json.Unmarshal(recorder.Body.Bytes(), &payload); err != nil {
		t.Fatalf("response is not valid JSON: %v", err)
	}

	openapiVersion, ok := payload["openapi"].(string)
	if !ok || openapiVersion == "" {
		t.Fatalf("expected openapi version in payload, got %#v", payload["openapi"])
	}

	info, ok := payload["info"].(map[string]any)
	if !ok || info["title"] == "" {
		t.Fatalf("expected info.title in payload, got %#v", payload["info"])
	}
}

func TestGetOpenAPIJSONCached(t *testing.T) {
	first, err := getOpenAPIJSON()
	if err != nil {
		t.Fatalf("getOpenAPIJSON returned error: %v", err)
	}

	second, err := getOpenAPIJSON()
	if err != nil {
		t.Fatalf("getOpenAPIJSON returned error on second call: %v", err)
	}

	if string(first) != string(second) {
		t.Fatal("expected cached OpenAPI JSON payload")
	}
}
