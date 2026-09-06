package main

import (
	"errors"
	"regexp"
	"strings"
	"time"
)

const handleCooldown = 30 * 24 * time.Hour

var (
	handlePattern     = regexp.MustCompile(`^[a-zA-Z0-9_]{3,32}$`)
	reservedHandles   = map[string]struct{}{
		"admin":     {},
		"api":       {},
		"auth":      {},
		"contests":  {},
		"health":    {},
		"me":        {},
		"platform":  {},
		"problems":  {},
		"profiles":  {},
		"settings":  {},
		"users":     {},
		"v1":        {},
	}
	errInvalidHandle  = errors.New("handle must be 3-32 characters and contain only letters, numbers, or underscores")
	errReservedHandle = errors.New("handle is reserved")
)

func normalizeHandle(handle string) string {
	return strings.ToLower(strings.TrimSpace(handle))
}

func validateHandle(handle string) error {
	if !handlePattern.MatchString(handle) {
		return errInvalidHandle
	}
	if _, reserved := reservedHandles[normalizeHandle(handle)]; reserved {
		return errReservedHandle
	}
	return nil
}

func sanitizeHandleBase(name string) string {
	var builder strings.Builder
	for _, r := range strings.ToLower(name) {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '_' {
			builder.WriteRune(r)
		}
	}

	handle := builder.String()
	if len(handle) < 3 {
		return ""
	}
	if len(handle) > 32 {
		handle = handle[:32]
	}
	return handle
}

func handleCooldownRemaining(changedAt *time.Time, now time.Time) time.Duration {
	if changedAt == nil {
		return 0
	}
	elapsed := now.Sub(*changedAt)
	if elapsed >= handleCooldown {
		return 0
	}
	return handleCooldown - elapsed
}
