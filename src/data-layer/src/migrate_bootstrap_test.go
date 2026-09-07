package main

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDetectLegacyGooseVersionUsesHighestMatchingMarker(t *testing.T) {
	t.Parallel()

	markers := legacyMigrationMarkers
	require.Equal(t, int64(9), markers[0].version)
	require.Equal(t, "api_tokens", markers[0].table)
	require.Equal(t, int64(2), markers[len(markers)-2].version)
	require.Equal(t, "password_reset_tokens", markers[len(markers)-2].table)
}
