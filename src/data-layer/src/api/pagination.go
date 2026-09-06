package api

import (
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// CursorPage is the standard cursor-paginated list response shape.
type CursorPage[T any] struct {
	Items      []T    `json:"items"`
	NextCursor string `json:"next_cursor,omitempty"`
}

// CursorPageParams are common query parameters for cursor pagination.
type CursorPageParams struct {
	Cursor string
	Limit  int
}

const DefaultCursorPageLimit = 50

const MaxCursorPageLimit = 100

// NormalizeCursorLimit clamps limit to a safe default and maximum.
func NormalizeCursorLimit(limit int) int {
	if limit <= 0 {
		return DefaultCursorPageLimit
	}
	if limit > MaxCursorPageLimit {
		return MaxCursorPageLimit
	}
	return limit
}

// NewCursorPage builds a cursor page from items and the next cursor token.
func NewCursorPage[T any](items []T, nextCursor string) CursorPage[T] {
	return CursorPage[T]{
		Items:      items,
		NextCursor: nextCursor,
	}
}

// EncodeTimeIDCursor encodes a stable pagination cursor from a timestamp and id.
func EncodeTimeIDCursor(t time.Time, id uuid.UUID) string {
	payload := fmt.Sprintf("%d|%s", t.UTC().UnixNano(), id.String())
	return base64.RawURLEncoding.EncodeToString([]byte(payload))
}

// DecodeTimeIDCursor decodes a cursor produced by EncodeTimeIDCursor.
func DecodeTimeIDCursor(cursor string) (time.Time, uuid.UUID, error) {
	decoded, err := base64.RawURLEncoding.DecodeString(cursor)
	if err != nil {
		return time.Time{}, uuid.Nil, fmt.Errorf("invalid cursor")
	}

	parts := strings.SplitN(string(decoded), "|", 2)
	if len(parts) != 2 {
		return time.Time{}, uuid.Nil, fmt.Errorf("invalid cursor")
	}

	nanos, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return time.Time{}, uuid.Nil, fmt.Errorf("invalid cursor")
	}

	id, err := uuid.Parse(parts[1])
	if err != nil {
		return time.Time{}, uuid.Nil, fmt.Errorf("invalid cursor")
	}

	return time.Unix(0, nanos), id, nil
}
