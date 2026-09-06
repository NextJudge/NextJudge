package openapi

import _ "embed"

// SpecYAML is the embedded OpenAPI 3.1 document served at GET /v1/openapi.json.
//
//go:embed openapi.yaml
var SpecYAML []byte
