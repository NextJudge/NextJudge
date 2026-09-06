package main

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
)

func canAccessCommunityContent(
	claims *NextJudgeClaims,
	problem *ProblemDescriptionExt,
	editorial *EditorialWithRevision,
	hasAccepted bool,
	hasEventAccepted bool,
) bool {
	if claims == nil || problem == nil {
		return false
	}

	if claims.Role == AdminRoleEnum {
		return true
	}

	if !canReadGlobalProblem(claims, problem) {
		return false
	}

	visibility := EditorialAfterSolve
	if editorial != nil {
		visibility = editorial.Visibility
	}

	switch visibility {
	case EditorialPublic:
		return true
	case EditorialAfterSolve:
		return hasAccepted
	case EditorialAfterEvent:
		return hasEventAccepted
	default:
		return false
	}
}

func canAccessCommunityForUser(
	claims *NextJudgeClaims,
	problem *ProblemDescriptionExt,
	editorial *EditorialWithRevision,
	userHasAccepted func(uuid.UUID, int) (bool, error),
	userHasEventAccepted func(uuid.UUID, int) (bool, error),
) (bool, error) {
	if claims == nil || problem == nil {
		return false, nil
	}

	if claims.Role == AdminRoleEnum {
		return true, nil
	}

	if !canReadGlobalProblem(claims, problem) {
		return false, nil
	}

	visibility := EditorialAfterSolve
	if editorial != nil {
		visibility = editorial.Visibility
	}

	switch visibility {
	case EditorialPublic:
		return true, nil
	case EditorialAfterSolve:
		return userHasAccepted(claims.Id, problem.ID)
	case EditorialAfterEvent:
		return userHasEventAccepted(claims.Id, problem.ID)
	default:
		return false, nil
	}
}

func nextCommentDepth(parent *Comment) (int, error) {
	if parent == nil {
		return 0, nil
	}
	if parent.DeletedAt != nil {
		return 0, errors.New("cannot reply to deleted comment")
	}
	nextDepth := parent.Depth + 1
	if nextDepth >= MaxCommentDepth {
		return 0, fmt.Errorf("comment depth cannot exceed %d", MaxCommentDepth)
	}
	return nextDepth, nil
}
