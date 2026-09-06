package main

import "testing"

func TestNormalizeSourceForFingerprint(t *testing.T) {
	got := normalizeSourceForFingerprint("  int   main()  {\nreturn 0;\n}  ")
	want := "int main() { return 0; }"
	if got != want {
		t.Fatalf("normalizeSourceForFingerprint() = %q, want %q", got, want)
	}
}

func TestComputeSubmissionFingerprint(t *testing.T) {
	first, err := computeSubmissionFingerprint("print('hi')")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	second, err := computeSubmissionFingerprint("  print('hi')  ")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if first != second {
		t.Fatalf("expected equivalent fingerprints, got %q and %q", first, second)
	}
}
