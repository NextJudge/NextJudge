package main

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	Pending             Status = "PENDING"
	Accepted            Status = "ACCEPTED"
	WrongAnswer         Status = "WRONG_ANSWER"
	TimeLimitExceeded   Status = "TIME_LIMIT_EXCEEDED"
	MemoryLimitExceeded Status = "MEMORY_LIMIT_EXCEEDED"
	RuntimeError        Status = "RUNTIME_ERROR"
	CompileTimeError    Status = "COMPILE_TIME_ERROR"
)

type Difficulty string

const (
	VeryEasy Difficulty = "VERY EASY"
	Easy     Difficulty = "EASY"
	Medium   Difficulty = "MEDIUM"
	Hard     Difficulty = "HARD"
	VeryHard Difficulty = "VERY HARD"
)

type User struct {
	ID                uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	AccountIdentifier string    `json:"account_identifier"`
	Name              string    `json:"name"`
	Email             string    `json:"email"`
	EmailVerified     time.Time `json:"emailVerified"`
	Image             string    `json:"image"`
	JoinDate          time.Time `json:"join_date"`
	IsAdmin           bool      `json:"is_admin"`
}

type UserWithPassword struct {
	User
	PasswordHash []byte `gorm:"column:password_hash"`
	Salt         []byte
}

func (UserWithPassword) TableName() string {
	return "users"
}

type ProblemDescription struct {
	ID                      int        `json:"id"`
	Title                   string     `json:"title"`
	Identifier              string     `json:"identifier"`
	Prompt                  string     `json:"prompt"`
	Source                  string     `json:"source"`
	Difficulty              Difficulty `json:"difficulty"`
	UserID                  uuid.UUID  `json:"user_id"`
	UploadDate              time.Time  `json:"upload_date"`
	UpdatedAt               time.Time  `json:"updated_at"`
	DefaultAcceptTimeout    float64    `json:"default_accept_timeout"`
	DefaultExecutionTimeout float64    `json:"default_execution_timeout"`
	DefaultMemoryLimit      int        `json:"default_memory_timeout"`
	Public                  bool       `json:"public"`
}

func (ProblemDescription) TableName() string {
	return "problem_descriptions"
}

type ProblemDescriptionExt struct {
	ProblemDescription
	TestCases  []TestCase `json:"test_cases,omitempty" gorm:"foreignKey:ProblemID"`
	Categories []Category `json:"categories" gorm:"many2many:problem_categories;joinForeignKey:problem_id;joinReferences:category_id"`
}

func (ProblemDescriptionExt) TableName() string {
	return "problem_descriptions"
}

type Category struct {
	ID   uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name string    `json:"name"`
}

func (Category) TableName() string {
	return "categories"
}

type ProblemCategory struct {
	CategoryID uuid.UUID `json:"category_id"`
	ProblemID  int       `json:"problem_id"`
}

func (ProblemCategory) TableName() string {
	return "problem_categories"
}

type TestCase struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ProblemID      int       `json:"problem_id"`
	Input          string    `json:"input"`
	Hidden         bool      `json:"hidden"`
	ExpectedOutput string    `json:"expected_output"`
}

func (TestCase) TableName() string {
	return "test_cases"
}

type SubmissionTestCaseResult struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	SubmissionID uuid.UUID `json:"submission_id"`
	TestCaseID   uuid.UUID `json:"test_case_id"`
	Stdout       string    `json:"stdout"`
	Stderr       string    `json:"stderr"`
	Passed       bool      `json:"passed"`
}

func (SubmissionTestCaseResult) TableName() string {
	return "submission_test_case_results"
}

type Submission struct {
	ID     uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID uuid.UUID `json:"user_id"`
	// GORM magic - it will correlate ProblemID with Problem. Expicitly specifying the foreignKey here broke things.
	ProblemID int                    `json:"problem_id"`
	Problem   *ProblemDescriptionExt `json:"problem"`
	// Optional: reference to event if this submission is part of a contest
	EventID *int   `json:"event_id,omitempty"`
	Event   *Event `json:"event,omitempty"`
	// Optional: reference to event_problem for contest-specific settings
	EventProblemID *int             `json:"event_problem_id,omitempty"`
	EventProblem   *EventProblemExt `json:"event_problem,omitempty"`
	TimeElapsed    float32          `json:"time_elapsed"`
	LanguageID     uuid.UUID        `json:"language_id"`
	// gorm:"foreignKey:LanguageID;references:ID"
	Language *Language `json:"language"`
	Status   Status    `json:"status"`
	// gorm does not support optional relationships, so this must be managed manually
	FailedTestCaseID *uuid.UUID `json:"failed_test_case_id,omitempty"`
	SubmitTime       time.Time  `json:"submit_time"`
	SourceCode       string     `json:"source_code"`
	Stdout           string     `json:"stdout"`
	Stderr           string     `json:"stderr"`
	// per-test-case results stored in separate table
	TestCaseResults []SubmissionTestCaseResult `json:"test_case_results,omitempty" gorm:"foreignKey:SubmissionID"`
}

type Language struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name      string    `json:"name"`
	Extension string    `json:"extension"`
	Version   string    `json:"version"`
}

type Event struct {
	ID          int       `json:"id" gorm:"primaryKey"`
	UserID      uuid.UUID `json:"user_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Teams       bool      `json:"teams"`
}

type EventWithProblems struct {
	Event
	// Teams    []EventTeam
	// Users    []User         `json:"participants,omitempty" gorm:"many2many:event_users"`
	Problems []EventProblem `json:"problems,omitempty" gorm:"foreignKey:EventID"`
}

type EventWithParticipants struct {
	Event
	Participants []User `json:"participants,omitempty"`
	ProblemCount int    `json:"problem_count,omitempty"`
}

func (EventWithProblems) TableName() string {
	return "events"
}

func (EventWithParticipants) TableName() string {
	return "events"
}

type EventWithProblemsExt struct {
	Event
	// Teams    []EventTeam
	// Users    []User         `json:"participants,omitempty" gorm:"many2many:event_users"`
	Problems []EventProblemExt `json:"problems,omitempty" gorm:"foreignKey:EventID"`
}

func (EventWithProblemsExt) TableName() string {
	return "events"
}

type EventProblem struct {
	ID               int      `json:"id" gorm:"primaryKey"`
	EventID          int      `json:"event_id"`
	ProblemID        int      `json:"problem_id"`
	Hidden           bool     `json:"hidden"`
	AcceptTimeout    *float64 `json:"accept_timeout"`
	ExecutionTimeout *float64 `json:"execution_timeout"`
	MemoryLimit      *int     `json:"memory_limit"`
}

type EventProblemExt struct {
	EventProblem
	Problem          *ProblemDescription `json:"problem" gorm:"foreignKey:ProblemID;references:ID"`
	AllowedLanguages []Language          `json:"languages,omitempty" gorm:"many2many:event_problem_languages"`
}

func (EventProblemExt) TableName() string {
	return "event_problems"
}

type EventProblemExtWithTests struct {
	EventProblem
	Problem          *ProblemDescriptionExt `json:"problem" gorm:"foreignKey:ProblemID;references:ID"`
	AllowedLanguages []Language             `json:"languages,omitempty" gorm:"many2many:event_problem_languages"`
}

func (EventProblemExtWithTests) TableName() string {
	return "event_problems"
}

type EventTeam struct {
	ID      uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	EventID int       `json:"event_id"`
	Name    string    `json:"name"`
}

type EventUser struct {
	UserID  uuid.UUID
	EventID int
	TeamID  uuid.UUID
}

type EventQuestion struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	EventID    int        `json:"event_id"`
	UserID     uuid.UUID  `json:"user_id"`
	ProblemID  *int       `json:"problem_id,omitempty"`
	Question   string     `json:"question"`
	IsAnswered bool       `json:"is_answered"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	Answer     *string    `json:"answer,omitempty"`
	AnsweredAt *time.Time `json:"answered_at,omitempty"`
	AnsweredBy *uuid.UUID `json:"answered_by,omitempty"`
}

type EventQuestionExt struct {
	EventQuestion
	User     *User               `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Problem  *ProblemDescription `json:"problem,omitempty" gorm:"foreignKey:ProblemID;references:ID"`
	Answerer *User               `json:"answerer,omitempty" gorm:"foreignKey:AnsweredBy;references:ID"`
}

func (EventQuestionExt) TableName() string {
	return "event_questions"
}

type Notification struct {
	ID               uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID           uuid.UUID `json:"user_id"`
	EventID          int       `json:"event_id"`
	QuestionID       uuid.UUID `json:"question_id"`
	NotificationType string    `json:"notification_type"`
	IsRead           bool      `json:"is_read"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type NotificationExt struct {
	Notification
	Question *EventQuestionExt `json:"question" gorm:"foreignKey:QuestionID;references:ID"`
}

func (NotificationExt) TableName() string {
	return "notifications"
}
