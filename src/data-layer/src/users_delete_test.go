package main

import (
	"testing"

	"github.com/google/uuid"
)

func TestIsSelfOrAdmin(t *testing.T) {
	t.Parallel()

	selfID := uuid.New()
	otherID := uuid.New()

	tests := []struct {
		name       string
		token      *NextJudgeClaims
		targetID   uuid.UUID
		wantAllowed bool
	}{
		{
			name:       "user can delete own account",
			token:      &NextJudgeClaims{Id: selfID, Role: UserRoleEnum},
			targetID:   selfID,
			wantAllowed: true,
		},
		{
			name:       "user cannot delete another account",
			token:      &NextJudgeClaims{Id: selfID, Role: UserRoleEnum},
			targetID:   otherID,
			wantAllowed: false,
		},
		{
			name:       "admin can delete another account",
			token:      &NextJudgeClaims{Id: selfID, Role: AdminRoleEnum},
			targetID:   otherID,
			wantAllowed: true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := isSelfOrAdmin(tt.token, tt.targetID)
			if got != tt.wantAllowed {
				t.Fatalf("isSelfOrAdmin() = %v, want %v", got, tt.wantAllowed)
			}
		})
	}
}

func TestWouldBlockLastAdminDeletion(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name       string
		isAdmin    bool
		adminCount int64
		wantBlock  bool
	}{
		{
			name:       "non-admin is never blocked",
			isAdmin:    false,
			adminCount: 1,
			wantBlock:  false,
		},
		{
			name:       "admin with other admins is allowed",
			isAdmin:    true,
			adminCount: 2,
			wantBlock:  false,
		},
		{
			name:       "last admin is blocked",
			isAdmin:    true,
			adminCount: 1,
			wantBlock:  true,
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := wouldBlockLastAdminDeletion(tt.isAdmin, tt.adminCount)
			if got != tt.wantBlock {
				t.Fatalf("wouldBlockLastAdminDeletion() = %v, want %v", got, tt.wantBlock)
			}
		})
	}
}

func TestDeletedUserIdentifiers(t *testing.T) {
	t.Parallel()

	userID := uuid.MustParse("72ca26bb-15e9-4acd-a56c-f1b44fb9519d")

	if got := deletedUserAccountIdentifier(userID); got != "deleted-72ca26bb-15e9-4acd-a56c-f1b44fb9519d" {
		t.Fatalf("deletedUserAccountIdentifier() = %q", got)
	}

	if got := deletedUserEmail(userID); got != "deleted-72ca26bb-15e9-4acd-a56c-f1b44fb9519d@deleted.local" {
		t.Fatalf("deletedUserEmail() = %q", got)
	}
}
