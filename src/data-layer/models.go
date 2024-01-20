package main

import "time"

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"password_hash"`
	JoinDate     time.Time `json:"join_date"`
}

type Problem struct {
	ID         int       `json:"id"`
	Prompt     string    `json:"prompt"`
	Timeout    int       `json:"timeout"`
	UserID     int       `json:"user_id"`
	UploadDate time.Time `json:"upload_date"`
}

type Submission struct {
	ID               int       `json:"id"`
	UserID           int       `json:"user_id"`
	ProblemID        string    `json:"problem_id"`
	TimeElapsed      int       `json:"time_elapsed"`
	Language         string    `json:"language"`
	Status           string    `json:"status"`
	FailedTestCaseID int       `json:"failed_test_case_id"`
	SubmitTime       time.Time `json:"submit_time"`
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
