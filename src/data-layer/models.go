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
	RuntimError         Status = "RUNTIME_ERROR"
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
	ID            uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name          string    `json:"name"`
	PasswordHash  string    `json:"password_hash"`
	Email         string    `json:"email"`
	EmailVerified time.Time `json:"emailVerified" gorm:"column:emailVerified"`
	Image         string    `json:"image"`
	IsAdmin       bool      `json:"is_admin"`
	JoinDate      time.Time `json:"join_date"`
}

type Category struct {
	ID   uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Name string    `json:"name"`
}

type Problem struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	Prompt     string     `json:"prompt"`
	Title      string     `json:"title"`
	Timeout    int        `json:"timeout"`
	Difficulty Difficulty `json:"difficulty"`
	UserID     uuid.UUID  `json:"user_id"`
	UploadDate time.Time  `json:"upload_date"`
	TestCases  []TestCase `json:"test_cases,omitempty"`
	Categories []Category `json:"categories" gorm:"many2many:problem_categories"`
}

type TestCase struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	ProblemID      uuid.UUID `json:"problem_id"`
	Input          string    `json:"input"`
	IsPublic       bool      `json:"is_public"`
	ExpectedOutput string    `json:"expected_output"`
}

type Submission struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	UserID      uuid.UUID `json:"user_id"`
	ProblemID   uuid.UUID `json:"problem_id"`
	TimeElapsed int       `json:"time_elapsed"`
	LanguageID  uuid.UUID `json:"language_id"`
	Status      Status    `json:"status"`
	// gorm does not support optional relationships, so this must be managed manually
	FailedTestCaseID *uuid.UUID `json:"failed_test_case_id,omitempty"`
	SubmitTime       time.Time  `json:"submit_time"`
	SourceCode       string     `json:"source_code"`
}

// Competition model
type Competition struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4()"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
	Description string    `json:"description"`
	Title       string    `json:"title"`
	UserID      uuid.UUID `json:"user_id"`
	Users       []User    `json:"participants,omitempty" gorm:"many2many:competition_users"`
	Problems    []Problem `json:"problems,omitempty" gorm:"many2many:competition_problems"`
}

type Language struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Extension string    `json:"extension"`
	Version   string    `json:"version"`
}
