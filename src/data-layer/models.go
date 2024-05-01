package main

import "time"

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

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"password_hash"`
	IsAdmin      bool      `json:"is_admin"`
	JoinDate     time.Time `json:"join_date"`
}

type Problem struct {
	ID         int        `json:"id"`
	Prompt     string     `json:"prompt"`
	Title      string     `json:"title"`
	Timeout    int        `json:"timeout"`
	UserID     int        `json:"user_id"`
	UploadDate time.Time  `json:"upload_date"`
	TestCases  []TestCase `json:"test_cases,omitempty"`
}

type TestCase struct {
	ID             int    `json:"id"`
	ProblemID      int    `json:"problem_id"`
	Input          string `json:"input"`
	ExpectedOutput string `json:"expected_output"`
}

type Submission struct {
	ID          int    `json:"id"`
	UserID      int    `json:"user_id"`
	ProblemID   int    `json:"problem_id"`
	TimeElapsed int    `json:"time_elapsed"`
	LanguageID  int    `json:"language_id"`
	Status      Status `json:"status"`
	// gorm does not support optional relationships, so this must be managed manually
	FailedTestCaseID *int      `json:"failed_test_case_id,omitempty"`
	SubmitTime       time.Time `json:"submit_time"`
	SourceCode       string    `json:"source_code"`
}

type Competition struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	Description  string    `json:"description"`
	Title        string    `json:"title"`
	Problems     []Problem `json:"problems"`
	Participants []User    `json:"participants"`
}

type Language struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Extension string `json:"extension"`
	Version   string `json:"version"`
}

type PutUserRequestBody struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"password_hash"`
	IsAdmin      bool   `json:"is_admin"`
	JoinDate     string `json:"join_date"`
}

type UpdateSubmissionStatusPatchBody struct {
	Status           Status `json:"status"`
	FailedTestCaseID *int   `json:"failed_test_case_id,omitempty"`
}
