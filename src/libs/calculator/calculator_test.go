package calculator

import (
	"testing"
)

func TestAdd(t *testing.T) {
	result := Add(2, 3)
	expected := 5

	if result != expected {
		t.Errorf("Add(2, 3) returned %d, expected %d", result, expected)
	}
}

func TestSubtract(t *testing.T) {
	result := Sub(3, 2)
	expected := 1

	if result != expected {
		t.Errorf("Subtract(3, 2) returned %d, expected %d", result, expected)
	}
}

func TestMultiply(t *testing.T) {
	result := Mul(2, 3)
	expected := 6

	if result != expected {
		t.Errorf("Multiply(2, 3) returned %d, expected %d", result, expected)
	}
}

func TestDivide(t *testing.T) {
	result := Div(6, 3)
	expected := 2

	if result != expected {
		t.Errorf("Divide(6, 3) returned %d, expected %d", result, expected)
	}
}

func TestDivideByZero(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("Divide(6, 0) did not panic")
		}
	}()

	_ = Div(6, 0)
}
