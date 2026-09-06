package api

import "testing"

func TestNormalizeCursorLimit(t *testing.T) {
	if got := NormalizeCursorLimit(0); got != DefaultCursorPageLimit {
		t.Fatalf("NormalizeCursorLimit(0) = %d, want %d", got, DefaultCursorPageLimit)
	}
	if got := NormalizeCursorLimit(200); got != MaxCursorPageLimit {
		t.Fatalf("NormalizeCursorLimit(200) = %d, want %d", got, MaxCursorPageLimit)
	}
	if got := NormalizeCursorLimit(25); got != 25 {
		t.Fatalf("NormalizeCursorLimit(25) = %d, want 25", got)
	}
}

func TestNewCursorPage(t *testing.T) {
	page := NewCursorPage([]string{"a", "b"}, "next")
	if len(page.Items) != 2 || page.NextCursor != "next" {
		t.Fatalf("NewCursorPage() = %+v", page)
	}
}
