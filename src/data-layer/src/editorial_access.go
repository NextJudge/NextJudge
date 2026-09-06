package main

import (
	"github.com/google/uuid"
)

func canReadEditorial(
	claims *NextJudgeClaims,
	problem *ProblemDescriptionExt,
	editorial *EditorialWithRevision,
	hasAccepted bool,
	hasEventAccepted bool,
) bool {
	if claims == nil || problem == nil || editorial == nil {
		return false
	}

	if claims.Role == AdminRoleEnum {
		return true
	}

	if !canReadGlobalProblem(claims, problem) {
		return false
	}

	switch editorial.Visibility {
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

func canReadEditorialForUser(
	claims *NextJudgeClaims,
	problem *ProblemDescriptionExt,
	editorial *EditorialWithRevision,
	userHasAccepted func(uuid.UUID, int) (bool, error),
	userHasEventAccepted func(uuid.UUID, int) (bool, error),
) (bool, error) {
	if claims == nil || problem == nil || editorial == nil {
		return false, nil
	}

	if claims.Role == AdminRoleEnum {
		return true, nil
	}

	if !canReadGlobalProblem(claims, problem) {
		return false, nil
	}

	switch editorial.Visibility {
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
