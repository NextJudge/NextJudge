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

	return true, nil
}
