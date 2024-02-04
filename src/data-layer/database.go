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

func (d Database) CreateUser(user User) error {
	sqlStatement := `
	INSERT INTO "user" (username, password_hash, is_admin, join_date)
	VALUES ($1, $2, $3, $4)`
	_, err := d.NextJudgeDB.Exec(sqlStatement, user.Username, user.PasswordHash, user.IsAdmin, time.Now())
	if err != nil {
		return err
	}

	return nil
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

	res := User{}
	err := row.Scan(&res.ID, &res.Username, &res.PasswordHash, &res.JoinDate, &res.IsAdmin)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &res, nil
}

func (d Database) GetUserByUsername(username string) (*User, error) {
	sqlStatement := `SELECT * FROM "user" WHERE username = $1`
	row := db.NextJudgeDB.QueryRow(sqlStatement, username)

	res := User{}
	err := row.Scan(&res.ID, &res.Username, &res.PasswordHash, &res.JoinDate, &res.IsAdmin)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &res, nil
}

func (d Database) DeleteUser(userId int) error {
	sqlStatement := `DELETE FROM "user" WHERE id = $1`
	_, err := db.NextJudgeDB.Exec(sqlStatement, userId)
	if err != nil {
		return err
	}

	return nil
}
