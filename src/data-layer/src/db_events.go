package main

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// Only include data relevant to users
type GetEventProblemType struct {
	ID      int `json:"id"`
	EventID int `json:"event_id"`

	// Data inherited from ProblemDescription
	// ProblemID                      int        `json:"problem_id"`
	Title      string     `json:"title"`
	Prompt     string     `json:"prompt"`
	Source     string     `json:"source"`
	Difficulty Difficulty `json:"difficulty"`
	UserID     uuid.UUID  `json:"user_id"`
	UploadDate time.Time  `json:"upload_date"`
	UpdatedAt  time.Time  `json:"updated_at"`
	Public     bool       `json:"public"`
	// Problem    ProblemDescription `json:"problem"`

	AcceptTimeout    float64 `json:"accept_timeout"`
	ExecutionTimeout float64 `json:"execution_timeout"`
	MemoryLimit      int     `json:"memory_limit"`

	Identifier string     `json:"identifier,omitempty"`
	Categories []Category `json:"categories,omitempty"`

	// Tests []TestCase `json:"tests,omitempty"`
	Tests []TestCase `json:"test_cases"`
}

type EventProblemRef struct {
	ID int `json:"id"`
}

type EventDetail struct {
	Event
	Participants []User            `json:"participants,omitempty"`
	Problems     []EventProblemRef `json:"problems,omitempty"`
}
func (d *Database) GetEvents() ([]Event, error) {
	competitions := []Event{}
	err := d.NextJudgeDB.Find(&competitions).Error
	if err != nil {
		return nil, err
	}
	return competitions, nil
}

func (d *Database) GetEventByTitle(title string) (*EventWithProblemsExt, error) {
	competition := &EventWithProblemsExt{}
	err := d.NextJudgeDB.Preload("Problems").Preload("Problems.Problem").Where("title = ?", title).First(competition).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return competition, nil
}

func (d *Database) CreateEvent(event *EventWithProblems) (*EventWithProblems, error) {
	err := d.NextJudgeDB.Create(event).Error
	if err != nil {
		return nil, err
	}
	return event, nil
}

func (d *Database) GetEventByID(id int) (*Event, error) {
	event := &Event{}
	err := d.NextJudgeDB.First(event, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return event, nil
}

func (d *Database) GetEventDetailByID(id int) (*EventDetail, error) {
	event, err := d.GetEventByID(id)
	if err != nil {
		return nil, err
	}
	if event == nil {
		return nil, nil
	}

	participants, err := d.GetEventParticipants(id)
	if err != nil {
		return nil, err
	}

	eventProblems, err := d.GetEventProblems(id)
	if err != nil {
		return nil, err
	}

	problemRefs := make([]EventProblemRef, 0, len(eventProblems))
	for _, ep := range eventProblems {
		problemRefs = append(problemRefs, EventProblemRef{ID: ep.ProblemID})
	}

	return &EventDetail{
		Event:        *event,
		Participants: participants,
		Problems:     problemRefs,
	}, nil
}

func (d *Database) UpdateEvent(event *Event) error {
	err := d.NextJudgeDB.Save(event).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) DeleteEvent(competition *Event) error {
	err := d.NextJudgeDB.Delete(competition).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) CreateEventProblem(problem *EventProblem) (*EventProblem, error) {
	err := d.NextJudgeDB.Create(problem).Error
	if err != nil {
		return nil, err
	}
	return problem, nil
}

func (d *Database) GetPublicEventProblems(eventID int) ([]GetEventProblemType, error) {
	eventProblems := []EventProblemExt{}
	err := d.NextJudgeDB.Preload("Problem").Where("event_id = ?", eventID).Find(&eventProblems).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	problems := []GetEventProblemType{}

	for _, eventProblem := range eventProblems {

		if eventProblem.Problem == nil {
			return nil, fmt.Errorf("problem is nil")
		}
		problemDescription := *eventProblem.Problem
		acceptTimeout := problemDescription.DefaultAcceptTimeout
		executionTimeout := problemDescription.DefaultExecutionTimeout
		memoryLimit := problemDescription.DefaultMemoryLimit

		if eventProblem.AcceptTimeout != nil {
			acceptTimeout = *eventProblem.AcceptTimeout
		}

		if eventProblem.ExecutionTimeout != nil {
			executionTimeout = *eventProblem.ExecutionTimeout
		}

		if eventProblem.MemoryLimit != nil {
			memoryLimit = *eventProblem.MemoryLimit
		}

		problemData := GetEventProblemType{
			ID:      problemDescription.ID,
			EventID: eventProblem.EventID,

			Title:      problemDescription.Title,
			Prompt:     problemDescription.Prompt,
			Source:     problemDescription.Source,
			Difficulty: problemDescription.Difficulty,
			UserID:     problemDescription.UserID,
			UploadDate: problemDescription.UploadDate,
			UpdatedAt:  problemDescription.UpdatedAt,
			Public:     problemDescription.Public,

			AcceptTimeout:    acceptTimeout,
			ExecutionTimeout: executionTimeout,
			MemoryLimit:      memoryLimit,
		}
		problems = append(problems, problemData)
	}

	return problems, nil
}

func ConvertEventProblemExtWithTestsToPublicData(eventProblem *EventProblemExtWithTests) (*GetEventProblemType, error) {
	if eventProblem.Problem == nil {
		return nil, fmt.Errorf("problem is nil")
	}
	problemDescription := *eventProblem.Problem
	acceptTimeout := problemDescription.DefaultAcceptTimeout
	executionTimeout := problemDescription.DefaultExecutionTimeout
	memoryLimit := problemDescription.DefaultMemoryLimit

	if eventProblem.AcceptTimeout != nil {
		acceptTimeout = *eventProblem.AcceptTimeout
	}

	if eventProblem.ExecutionTimeout != nil {
		executionTimeout = *eventProblem.ExecutionTimeout
	}

	if eventProblem.MemoryLimit != nil {
		memoryLimit = *eventProblem.MemoryLimit
	}

	problemData := GetEventProblemType{
		ID:      eventProblem.ID,
		EventID: eventProblem.EventID,

		Title:      problemDescription.Title,
		Prompt:     problemDescription.Prompt,
		Source:     problemDescription.Source,
		Difficulty: problemDescription.Difficulty,
		UserID:     problemDescription.UserID,
		UploadDate: problemDescription.UploadDate,
		UpdatedAt:  problemDescription.UpdatedAt,
		Public:     problemDescription.Public,

		AcceptTimeout:    acceptTimeout,
		ExecutionTimeout: executionTimeout,
		MemoryLimit:      memoryLimit,

		Tests: problemDescription.TestCases,
	}

	return &problemData, nil
}

// Include public test data
func (d *Database) GetPublicEventProblemWithTestsByID(eventID int, eventProblemID int) (*GetEventProblemType, error) {
	eventProblem := &EventProblemExtWithTests{}
	err := d.NextJudgeDB.Preload("Problem").Preload("Problem.TestCases", "hidden = ?", false).Preload("Problem.Categories").
		Where("event_id = ? AND event_problem_id = ?", eventID, eventProblemID).
		First(eventProblem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return ConvertEventProblemExtWithTestsToPublicData(eventProblem)
}

func (d *Database) GetEventProblemWithTestsByID(eventID int, eventProblemID int) (*GetEventProblemType, error) {
	eventProblem := &EventProblemExtWithTests{}
	err := d.NextJudgeDB.Preload("Problem").Preload("Problem.TestCases").Preload("Problem.Categories").
		Where("event_id = ? AND event_problem_id = ?", eventID, eventProblemID).
		First(eventProblem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return ConvertEventProblemExtWithTestsToPublicData(eventProblem)
}

func (d *Database) GetEventProblemExtByID(eventID int, eventProblemID int) (*EventProblemExt, error) {
	eventProblem := &EventProblemExt{}
	err := d.NextJudgeDB.Preload("Problem").Where("event_id = ? AND event_problem_id = ?", eventID, eventProblemID).First(eventProblem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return eventProblem, nil
}

func (d *Database) GetEventTeams(eventID int) ([]EventTeam, error) {
	eventTeams := []EventTeam{}
	err := d.NextJudgeDB.Where("event_id = ?", eventID).Find(&eventTeams).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return eventTeams, nil
}

func (d *Database) CreateTeam(eventID int, name string) (*EventTeam, error) {
	team := EventTeam{
		EventID: eventID,
		Name:    name,
	}

	err := d.NextJudgeDB.Create(&team).Error
	if err != nil {
		return nil, err
	}

	return &team, nil
}

var (
	ErrDuplicateTeamName   = errors.New("duplicate team name")
	ErrUserAlreadyOnTeam   = errors.New("user already on a team for this event")
)

func (d *Database) CreateTeamWithCreator(eventID int, name string, userID uuid.UUID) (*EventTeam, error) {
	var createdTeam *EventTeam
	err := d.NextJudgeDB.Transaction(func(tx *gorm.DB) error {
		var existingTeam EventTeam
		lookupErr := tx.Where("event_id = ? AND name = ?", eventID, name).First(&existingTeam).Error
		if lookupErr == nil {
			return ErrDuplicateTeamName
		}
		if lookupErr != gorm.ErrRecordNotFound {
			return lookupErr
		}

		var eventUser EventUser
		userLookupErr := tx.Where("user_id = ? AND event_id = ?", userID, eventID).First(&eventUser).Error
		if userLookupErr == nil && eventUser.TeamID != uuid.Nil {
			return ErrUserAlreadyOnTeam
		}
		if userLookupErr != nil && userLookupErr != gorm.ErrRecordNotFound {
			return userLookupErr
		}

		newTeam := EventTeam{
			EventID: eventID,
			Name:    name,
		}
		if err := tx.Create(&newTeam).Error; err != nil {
			return err
		}

		if userLookupErr == gorm.ErrRecordNotFound {
			if err := tx.Create(&EventUser{
				UserID:  userID,
				EventID: eventID,
				TeamID:  newTeam.ID,
			}).Error; err != nil {
				return err
			}
		} else {
			if err := tx.Model(&eventUser).Update("team_id", newTeam.ID).Error; err != nil {
				return err
			}
		}

		createdTeam = &newTeam
		return nil
	})
	if err != nil {
		return nil, err
	}
	return createdTeam, nil
}

func (d *Database) GetTeamByID(team_id uuid.UUID) (*EventTeam, error) {
	team := &EventTeam{}
	err := d.NextJudgeDB.Where("id = ?", team_id).First(team).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return team, nil
}

func (d *Database) GetTeamByName(name string) (*EventTeam, error) {
	team := &EventTeam{}
	err := d.NextJudgeDB.Where("name = ?", name).First(team).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return team, nil
}

func (d *Database) GetTeamByNameForEvent(eventID int, name string) (*EventTeam, error) {
	team := &EventTeam{}
	err := d.NextJudgeDB.Where("event_id = ? AND name = ?", eventID, name).First(team).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return team, nil
}

func (d *Database) UpdateEventUserTeam(userID uuid.UUID, eventID int, teamID uuid.UUID) error {
	return d.NextJudgeDB.Model(&EventUser{}).
		Where("user_id = ? AND event_id = ?", userID, eventID).
		Update("team_id", teamID).Error
}

func (d *Database) GetTeamMembers(teamID uuid.UUID) ([]User, error) {
	var users []User
	err := d.NextJudgeDB.
		Table("users").
		Joins("JOIN event_users ON event_users.user_id = users.id").
		Where("event_users.team_id = ?", teamID).
		Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (d *Database) GetUserTeamForEvent(userID uuid.UUID, eventID int) (*EventTeam, error) {
	eventUser, err := d.GetEventUser(userID, eventID)
	if err != nil {
		return nil, err
	}
	if eventUser == nil || eventUser.TeamID == uuid.Nil {
		return nil, nil
	}
	return d.GetTeamByID(eventUser.TeamID)
}

func (d *Database) CreateEventUser(eventUser *EventUser) (*EventUser, error) {
	err := d.NextJudgeDB.Create(eventUser).Error
	if err != nil {
		return nil, err
	}
	return eventUser, nil
}

// TODO: if it's a team event add checks for that
func (d *Database) GetEventUser(userID uuid.UUID, eventID int) (*EventUser, error) {
	eventUser := &EventUser{}
	err := d.NextJudgeDB.Where("user_id = ? AND event_id = ?", userID, eventID).First(eventUser).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return eventUser, nil
}

func (d *Database) GetEventParticipants(eventID int) ([]User, error) {
	var users []User
	err := d.NextJudgeDB.Model(&User{}).Unscoped().
		Joins("JOIN event_users ON users.id = event_users.user_id").
		Where("event_users.event_id = ?", eventID).
		Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (d *Database) GetEventsWithParticipants() ([]EventWithParticipants, error) {
	var events []Event
	err := d.NextJudgeDB.Find(&events).Error
	if err != nil {
		return nil, err
	}

	var eventsWithParticipants []EventWithParticipants
	for _, event := range events {
		// get participants for this event
		participants, err := d.GetEventParticipants(event.ID)
		if err != nil {
			// log the error but continue with empty participants
			logrus.WithError(err).Warnf("Failed to get participants for event %d", event.ID)
			participants = []User{}
		}

		// get problem count for this event
		var problemCount int64
		err = d.NextJudgeDB.Model(&EventProblem{}).Where("event_id = ?", event.ID).Count(&problemCount).Error
		if err != nil {
			logrus.WithError(err).Warnf("Failed to get problem count for event %d", event.ID)
			problemCount = 0
		}

		eventWithParticipants := EventWithParticipants{
			Event:        event,
			Participants: participants,
			ProblemCount: int(problemCount),
		}
		eventsWithParticipants = append(eventsWithParticipants, eventWithParticipants)
	}

	return eventsWithParticipants, nil
}

func (d *Database) GetAllEventSubmissions(eventID int) ([]Submission, error) {
	submissions := []Submission{}
	err := d.NextJudgeDB.Where("event_id = ?", eventID).Find(&submissions).Error
	if err != nil {
		return nil, err
	}
	return submissions, nil
}

func (d *Database) GetAllEventSubmissionsByTeam(eventID int, teamID uuid.UUID) ([]Submission, error) {
	submissions := []Submission{}
	// Inner join with all user_id's that are on teamId
	err := d.NextJudgeDB.Joins("JOIN event_users eu ON eu.user_id = submissions.user_id AND eu.team_id = ? AND submissions.event_id = ?", teamID, eventID).
		Find(&submissions).Error
	if err != nil {
		return nil, err
	}
	return submissions, nil
}

func (d *Database) GetEventSubmissionsByUserID(eventID int, userID uuid.UUID) ([]Submission, error) {
	submissions := []Submission{}
	err := d.NextJudgeDB.Where("event_id = ? AND user_id = ?", eventID, userID).Find(&submissions).Error
	if err != nil {
		return nil, err
	}
	return submissions, nil
}

// Aggregated attempts per (user, problem) with first accepted time
type EventProblemAttempt struct {
	UserID            uuid.UUID  `json:"user_id"`
	ProblemID         int        `json:"problem_id"`
	Attempts          int        `json:"attempts"`
	TotalAttempts     int        `json:"total_attempts"`
	FirstAcceptedTime *time.Time `json:"first_accepted_time"`
}

func (d *Database) GetEventProblemAttempts(eventID int) ([]EventProblemAttempt, error) {
	var results []EventProblemAttempt

	err := d.NextJudgeDB.Raw(`
        WITH fa AS (
            SELECT user_id, problem_id, MIN(submit_time) AS first_accepted_time
            FROM submissions
            WHERE event_id = ? AND status = 'ACCEPTED'
            GROUP BY user_id, problem_id
        ),
        contest_completion AS (
            SELECT
                s.user_id,
                MAX(s.submit_time) AS completion_time
            FROM submissions s
            INNER JOIN event_problems ep ON ep.problem_id = s.problem_id AND ep.event_id = s.event_id
            WHERE s.event_id = ? AND s.status = 'ACCEPTED'
            GROUP BY s.user_id
            HAVING COUNT(DISTINCT s.problem_id) = (
                SELECT COUNT(*) FROM event_problems WHERE event_id = ?
            )
        )
        SELECT
            s.user_id,
            s.problem_id,
            SUM(
                CASE
                    WHEN fa.first_accepted_time IS NULL AND s.status <> 'ACCEPTED' AND
                         (cc.completion_time IS NULL OR s.submit_time <= cc.completion_time) THEN 1
                    WHEN fa.first_accepted_time IS NOT NULL AND s.submit_time <= fa.first_accepted_time THEN 1
                    ELSE 0
                END
            ) AS attempts,
            COUNT(
                CASE
                    WHEN cc.completion_time IS NULL OR s.submit_time <= cc.completion_time THEN 1
                    ELSE NULL
                END
            ) AS total_attempts,
            fa.first_accepted_time
        FROM submissions s
        LEFT JOIN fa ON fa.user_id = s.user_id AND fa.problem_id = s.problem_id
        LEFT JOIN contest_completion cc ON cc.user_id = s.user_id
        WHERE s.event_id = ?
        GROUP BY s.user_id, s.problem_id, fa.first_accepted_time, cc.completion_time
    `, eventID, eventID, eventID, eventID).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	return results, nil
}

// Get contest problem completion status for a specific user
func (d *Database) GetUserEventProblemStatus(userID uuid.UUID, eventID int, problemID int) (*Submission, error) {
	var submission Submission
	// Get the best (accepted) submission for this user/event/problem combination
	err := d.NextJudgeDB.Where("user_id = ? AND event_id = ? AND problem_id = ? AND status = ?",
		userID, eventID, problemID, "ACCEPTED").
		Order("submit_time ASC").
		First(&submission).Error
	if err != nil {
		if err.Error() == "record not found" {
			return nil, nil // no accepted submission found
		}
		return nil, err
	}
	return &submission, nil
}

// Get submission statistics for a problem in a contest (how many users solved it)
func (d *Database) GetEventProblemStats(eventID int, problemID int) (int, error) {
	var count int64
	// Count unique users who have accepted submissions for this problem in this contest
	err := d.NextJudgeDB.Model(&Submission{}).
		Where("event_id = ? AND problem_id = ? AND status = ?", eventID, problemID, "ACCEPTED").
		Distinct("user_id").
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

// Get all user problem statuses for a contest
// Get all event problems for a contest
func (d *Database) GetEventProblems(eventID int) ([]EventProblem, error) {
	var eventProblems []EventProblem
	err := d.NextJudgeDB.Where("event_id = ?", eventID).Find(&eventProblems).Error
	if err != nil {
		return nil, err
	}
	return eventProblems, nil
}

func (d *Database) GetUserEventProblemsStatus(userID uuid.UUID, eventID int) ([]Submission, error) {
	var submissions []Submission
	// Get the best status for each problem for this user in this contest
	// Priority: ACCEPTED > latest non-accepted submission
	err := d.NextJudgeDB.Raw(`
		WITH accepted_submissions AS (
			SELECT DISTINCT ON (problem_id) id, user_id, problem_id, event_id, event_problem_id, status, submit_time, language_id, time_elapsed, source_code, stdout, stderr, failed_test_case_id
			FROM submissions
			WHERE user_id = ? AND event_id = ? AND status = 'ACCEPTED'
			ORDER BY problem_id, submit_time ASC
		),
		latest_submissions AS (
			SELECT DISTINCT ON (problem_id) id, user_id, problem_id, event_id, event_problem_id, status, submit_time, language_id, time_elapsed, source_code, stdout, stderr, failed_test_case_id
			FROM submissions
			WHERE user_id = ? AND event_id = ?
			ORDER BY problem_id, submit_time DESC
		)
		SELECT * FROM accepted_submissions
		UNION ALL
		SELECT * FROM latest_submissions
		WHERE problem_id NOT IN (SELECT problem_id FROM accepted_submissions)
		ORDER BY problem_id
	`, userID, eventID, userID, eventID).
		Preload("Problem").
		Find(&submissions).Error
	if err != nil {
		return nil, err
	}
	return submissions, nil
}

// check if user has completed all problems in a contest
func (d *Database) HasUserCompletedAllEventProblems(userID uuid.UUID, eventID int) (bool, error) {
	// get total number of problems in the contest
	var totalProblems int64
	err := d.NextJudgeDB.Model(&EventProblem{}).
		Where("event_id = ?", eventID).
		Count(&totalProblems).Error
	if err != nil {
		return false, err
	}

	// get number of problems user has accepted submissions for
	var acceptedProblems int64
	err = d.NextJudgeDB.Model(&Submission{}).
		Joins("INNER JOIN event_problems ON submissions.problem_id = event_problems.problem_id").
		Where("submissions.user_id = ? AND submissions.event_id = ? AND submissions.status = ? AND event_problems.event_id = ?",
			userID, eventID, "ACCEPTED", eventID).
		Distinct("submissions.problem_id").
		Count(&acceptedProblems).Error
	if err != nil {
		return false, err
	}

	return acceptedProblems >= totalProblems, nil
}
