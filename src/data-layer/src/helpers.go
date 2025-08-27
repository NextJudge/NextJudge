package main

import (
	"fmt"
	"time"
)

func userCanSubmitToEventId(user *User, event *Event, timeNow time.Time) (bool, error) {
	if event.StartTime.After(timeNow) || event.EndTime.Before(timeNow) {
		return false, fmt.Errorf("event is not currently active")
	}

	eventUser, err := db.GetEventUser(user.ID, event.ID)
	if err != nil {
		return false, fmt.Errorf("error checking for existing event")
	}
	if eventUser == nil {
		return false, fmt.Errorf("user is not part of event")
	}

	// check if user has already completed all problems in the contest
	hasCompleted, err := db.HasUserCompletedAllEventProblems(user.ID, event.ID)
	if err != nil {
		return false, fmt.Errorf("error checking contest completion status")
	}
	if hasCompleted {
		return false, fmt.Errorf("user has already completed all problems in this contest")
	}

	return true, nil
}
