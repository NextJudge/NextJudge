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
	DefaultAcceptTimeout    float64    `json:"default_accept_timeout"`
	DefaultExecutionTimeout float64    `json:"default_execution_timeout"`
	DefaultMemoryLimit      int        `json:"default_memory_timeout"`
}

func (ProblemDescription) TableName() string {
	return "problem_descriptions"
}

type ProblemDescriptionExt struct {
	ProblemDescription
	TestCases  []TestCase `json:"test_cases,omitempty" gorm:"foreignKey:ProblemID"`
	Categories []Category `json:"categories" gorm:"many2many:problem_categories;joinForeignKey:problem_id"`
}

func (ProblemDescriptionExt) TableName() string {
	return "problem_descriptions"
}

type Category struct {
	ID   uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name string    `json:"name"`
}

type ProblemCategory struct {
	CategoryID uuid.UUID `json:"category_id"`
	ProblemID  int       `json:"problem_id"`
}

type TestCase struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ProblemID      int       `json:"problem_id"`
	Input          string    `json:"input"`
	Hidden         bool      `json:"hidden"`
	ExpectedOutput string    `json:"expected_output"`
}

type Submission struct {
	ID     uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID uuid.UUID `json:"user_id"`
	// GORM magic - it will correlate ProblemID with Problem. Expicitly specifying the foreignKey here broke things.
	ProblemID   int              `json:"problem_id"`
	Problem     *EventProblemExt `json:"problem"`
	TimeElapsed float32          `json:"time_elapsed"`
	LanguageID  uuid.UUID        `json:"language_id"`
	// gorm:"foreignKey:LanguageID;references:ID"
	Language *Language `json:"language"`
	Status   Status    `json:"status"`
	// gorm does not support optional relationships, so this must be managed manually
	FailedTestCaseID *uuid.UUID `json:"failed_test_case_id,omitempty"`
	SubmitTime       time.Time  `json:"submit_time"`
	SourceCode       string     `json:"source_code"`
	Stdout           string     `json:"stdout"`
	Stderr           string     `json:"stderr"`
}

type Language struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name      string    `json:"name"`
	Extension string    `json:"extension"`
	Version   string    `json:"version"`
}

type Event struct {
	ID          int       `json:"id"`
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

func (EventWithProblems) TableName() string {
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
	ID               int      `json:"id"`
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
