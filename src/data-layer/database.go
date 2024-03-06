package main

import (
	"database/sql"
	"fmt"
	"strconv"
	"time"

	_ "github.com/lib/pq"
)

const (
	DefaultUsersTable               = "user"
	DefaultProblemsTable            = "problem"
	DefaultSubmissionsTable         = "submission"
	DefaultTestCasesTable           = "test_case"
	DefaultCompetitionsTable        = "competition"
	DefaultCompetitionProblemsTable = "competition_problem"
	DefaultCompetitionUsersTable    = "competition_user"
)

type Tables struct {
	Users               string
	Problems            string
	Submissions         string
	TestCases           string
	Competitions        string
	CompetitionProblems string
	CompetitionUsers    string
}

type Database struct {
	NextJudgeDB *sql.DB
	TableNames  Tables
}

type NextJudgeDB interface {
	GetUsers() ([]User, error)
	CreateUser(user *User) (*User, error)
	GetUserByID(userId int) (*User, error)
	GetUserByUsername(username string) (*User, error)
	UpdateUser(user *User)
	DeleteUser(userId int)
	CreateProblem(problem *Problem) (*Problem, error)
	GetProblems() ([]Problem, error)
	CreateTestcase(testcase *TestCase, problemId int) (*TestCase, error)
	GetProblemByID(problemId int) (*Problem, error)
	GetProblemByTitle(title string) (*Problem, error)
	GetTestCases(problemId int) ([]TestCase, error)
	CreateSubmission(submission *Submission) (*Submission, error)
	GetSubmission(submissionId int) (*Submission, error)
	UpdateSubmission(submissionId int, status Status, failedTestCaseId int) error
	CreateLanguage(language *Language) (*Language, error)
	GetLanguages() ([]Language, error)
	GetLanguageByNameAndVersion(name string, version string) (*Language, error)
	GetLanguage(id int) (*Language, error)
}

func NewDatabase() (*Database, error) {
	var err error
	db := &Database{
		TableNames: Tables{
			Users:               cfg.UsersTable,
			Problems:            cfg.ProblemsTable,
			Submissions:         cfg.SubmissionsTable,
			TestCases:           cfg.TestCasesTable,
			Competitions:        cfg.CompetitionsTable,
			CompetitionProblems: cfg.CompetitionProblemsTable,
			CompetitionUsers:    cfg.CompetitionUsersTable,
		},
	}
	dataSource := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", cfg.Host, strconv.FormatInt(cfg.Port, 10), cfg.Username, cfg.Password, cfg.DBName)
	db.NextJudgeDB, err = sql.Open(cfg.DBDriver, dataSource)
	if err != nil {
		return nil, err
	}

	err = db.NextJudgeDB.Ping()
	if err != nil {
		return nil, err
	}

	return db, nil
}

func (d Database) CreateUser(user *User) (*User, error) {
	sqlStatement := `
	INSERT INTO "user" (username, password_hash, is_admin, join_date)
	VALUES ($1, $2, $3, $4)
	RETURNING id`

	joinDate := time.Now()

	res := &User{
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		IsAdmin:      user.IsAdmin,
		JoinDate:     joinDate,
	}

	err := d.NextJudgeDB.QueryRow(sqlStatement, user.Username, user.PasswordHash, user.IsAdmin, joinDate).Scan(&res.ID)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) GetUsers() ([]User, error) {
	sqlStatement := `SELECT * FROM "user"`
	rows, err := db.NextJudgeDB.Query(sqlStatement)
	if err != nil {
		return nil, err
	}

	res := []User{}

	defer rows.Close()
	for rows.Next() {
		var u User
		err := rows.Scan(&u.ID, &u.Username, &u.PasswordHash, &u.JoinDate, &u.IsAdmin)
		if err != nil {
			return nil, err
		}
		res = append(res, u)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) GetUserByID(userId int) (*User, error) {
	sqlStatement := `SELECT * FROM "user" WHERE id = $1`
	row := db.NextJudgeDB.QueryRow(sqlStatement, userId)

	res := &User{}
	err := row.Scan(&res.ID, &res.Username, &res.PasswordHash, &res.JoinDate, &res.IsAdmin)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res, nil
}

func (d Database) GetUserByUsername(username string) (*User, error) {
	sqlStatement := `SELECT * FROM "user" WHERE username = $1`
	row := db.NextJudgeDB.QueryRow(sqlStatement, username)

	res := &User{}
	err := row.Scan(&res.ID, &res.Username, &res.PasswordHash, &res.JoinDate, &res.IsAdmin)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res, nil
}

func (d Database) UpdateUser(user *User) error {
	sqlStatement := `UPDATE "user" 
	SET username = $2, password_hash = $3, is_admin = $4
	WHERE id = $1`
	_, err := db.NextJudgeDB.Exec(sqlStatement, user.ID, user.Username, user.PasswordHash, user.IsAdmin)

	if err != nil {
		return err
	}

	return nil
}

func (d Database) DeleteUser(userId int) error {
	sqlStatement := `DELETE FROM "user" WHERE id = $1`
	_, err := db.NextJudgeDB.Exec(sqlStatement, userId)
	if err != nil {
		return err
	}

	return nil
}

func (d Database) CreateProblem(problem *Problem) (*Problem, error) {
	sqlStatement := `
	INSERT INTO "problem" (title, prompt, timeout, user_id, upload_date) 
	VALUES ($1, $2, $3, $4, $5)
	RETURNING id`

	uploadDate := time.Now()

	res := &Problem{
		Prompt:     problem.Prompt,
		Title:      problem.Title,
		Timeout:    problem.Timeout,
		UserID:     problem.UserID,
		UploadDate: uploadDate,
	}

	err := d.NextJudgeDB.QueryRow(sqlStatement, problem.Title, problem.Prompt, problem.Timeout, problem.UserID, uploadDate).Scan(&res.ID)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) CreateTestcase(testcase *TestCase, problemId int) (*TestCase, error) {
	sqlStatement := `
	INSERT INTO "test_case" (problem_id, input, expected_output) 
	VALUES ($1, $2, $3)
	RETURNING id`

	res := &TestCase{
		Input:          testcase.Input,
		ExpectedOutput: testcase.ExpectedOutput,
	}

	err := d.NextJudgeDB.QueryRow(sqlStatement, problemId, testcase.Input, testcase.ExpectedOutput).Scan(&res.ID)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) GetProblems() ([]Problem, error) {
	sqlStatement := `SELECT * FROM "problem"`
	rows, err := db.NextJudgeDB.Query(sqlStatement)
	if err != nil {
		return nil, err
	}

	res := []Problem{}

	defer rows.Close()
	for rows.Next() {
		var u Problem
		err := rows.Scan(&u.ID, &u.Title, &u.Prompt, &u.Timeout, &u.UserID, &u.UploadDate)
		if err != nil {
			return nil, err
		}
		res = append(res, u)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return res, nil
}

// TODO: Use joins to get problems and test cases
func (d Database) GetProblemByID(problemId int) (*Problem, error) {
	sqlStatement := `SELECT * FROM "problem" WHERE id = $1`
	row := db.NextJudgeDB.QueryRow(sqlStatement, problemId)

	res := &Problem{}
	err := row.Scan(&res.ID, &res.Title, &res.Prompt, &res.Timeout, &res.UserID, &res.UploadDate)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res, nil
}

func (d Database) GetProblemByTitle(title string) (*Problem, error) {
	sqlStatement := `SELECT * FROM "problem" WHERE title = $1`
	row := db.NextJudgeDB.QueryRow(sqlStatement, title)

	res := &Problem{}
	err := row.Scan(&res.ID, &res.Title, &res.Prompt, &res.Timeout, &res.UserID, &res.UploadDate)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res, nil
}

func (d Database) GetTestCases(problemId int) ([]TestCase, error) {
	sqlStatement := `SELECT id, input, expected_output FROM "test_case" WHERE problem_id = $1`
	rows, err := db.NextJudgeDB.Query(sqlStatement, problemId)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	defer rows.Close()

	res := []TestCase{}

	for rows.Next() {
		row := TestCase{}
		err = rows.Scan(&row.ID, &row.Input, &row.ExpectedOutput)
		if err != nil {
			return nil, err
		}
		res = append(res, row)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) CreateSubmission(submission *Submission) (*Submission, error) {
	sqlStatement := `
	INSERT INTO "submission" (user_id, problem_id, language_id, submit_time, source_code, status, time_elapsed)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	RETURNING id`

	submitTime := time.Now()

	res := &Submission{
		UserID:      submission.UserID,
		ProblemID:   submission.ProblemID,
		LanguageID:  submission.LanguageID,
		SubmitTime:  submitTime,
		SourceCode:  submission.SourceCode,
		Status:      Pending,
		TimeElapsed: 0,
	}

	err := d.NextJudgeDB.QueryRow(sqlStatement, submission.UserID, submission.ProblemID,
		submission.LanguageID, submitTime, submission.SourceCode, res.Status, res.TimeElapsed).Scan(&res.ID)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) GetSubmission(submissionId int) (*Submission, error) {
	sqlStatement := `SELECT * FROM "submission" WHERE id = $1`
	row := db.NextJudgeDB.QueryRow(sqlStatement, submissionId)

	res := &Submission{}
	var failedTestCaseId *int
	err := row.Scan(&res.ID, &res.UserID, &res.ProblemID, &res.TimeElapsed, &res.LanguageID, &res.Status, &failedTestCaseId, &res.SubmitTime, &res.SourceCode)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	res.FailedTestCaseID = failedTestCaseId

	return res, nil
}

func (d Database) UpdateSubmission(submissionId int, status Status, failedTestCaseId *int) error {
	sqlStatement := `UPDATE "submission" 
	SET status = $2, failed_test_case_id = $3
	WHERE id = $1`

	nullableFailedTestCaseID := sql.NullInt64{}
	if failedTestCaseId != nil && *failedTestCaseId != 0 {
		nullableFailedTestCaseID.Valid = true
		nullableFailedTestCaseID.Int64 = int64(*failedTestCaseId)
	} else {
		nullableFailedTestCaseID.Valid = false
	}

	_, err := db.NextJudgeDB.Exec(sqlStatement, submissionId, status, nullableFailedTestCaseID)

	if err != nil {
		return err
	}

	return nil
}

func (d Database) CreateLanguage(language *Language) (*Language, error) {
	sqlStatement := `
	INSERT INTO "language" (name, version, extension)
	VALUES ($1, $2, $3)
	RETURNING id`

	res := &Language{
		Name:      language.Name,
		Extension: language.Extension,
		Version:   language.Version,
	}

	err := d.NextJudgeDB.QueryRow(sqlStatement, language.Name, language.Version, language.Extension).Scan(&res.ID)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) GetLanguages() ([]Language, error) {
	sqlStatement := `SELECT * FROM "language"`
	rows, err := db.NextJudgeDB.Query(sqlStatement)
	if err != nil {
		return nil, err
	}

	res := []Language{}

	defer rows.Close()
	for rows.Next() {
		var u Language
		err := rows.Scan(&u.ID, &u.Name, &u.Extension, &u.Version)
		if err != nil {
			return nil, err
		}
		res = append(res, u)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (d Database) GetLanguageByNameAndVersion(name string, version string) (*Language, error) {
	sqlStatement := `SELECT * FROM "language" WHERE (name = $1 AND version = $2)`
	row := db.NextJudgeDB.QueryRow(sqlStatement, name, version)

	res := &Language{}
	err := row.Scan(&res.ID, &res.Name, &res.Extension, &res.Version)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res, nil
}

func (d Database) GetLanguage(id int) (*Language, error) {
	sqlStatement := `SELECT * FROM "language" WHERE id = $1`
	row := db.NextJudgeDB.QueryRow(sqlStatement, id)

	res := &Language{}
	err := row.Scan(&res.ID, &res.Name, &res.Extension, &res.Version)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return res, nil
}
