package main

import (
	"fmt"
	"strconv"
	"time"

	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Database struct {
	NextJudgeDB *gorm.DB
}

type NextJudgeDB interface {
	GetUsers() ([]User, error)
	CreateUser(user *User) (*User, error)
	GetUserByID(userId int) (*User, error)
	GetUserByUsername(username string) (*User, error)
	UpdateUser(user *User) error
	DeleteUser(user *User) error
	CreateProblem(problem *Problem) (*Problem, error)
	GetProblems() ([]Problem, error)
	CreateTestcase(testcase *TestCase, problemId int) (*TestCase, error)
	GetProblemByID(problemId int) (*Problem, error)
	GetProblemByTitle(title string) (*Problem, error)
	CreateSubmission(submission *Submission) (*Submission, error)
	GetSubmission(submissionId int) (*Submission, error)
	UpdateSubmission(submission *Submission) error
	CreateLanguage(language *Language) (*Language, error)
	GetLanguages() ([]Language, error)
	GetLanguageByNameAndVersion(name string, version string) (*Language, error)
	GetLanguage(id int) (*Language, error)
	GetTestCase(testcaseId int) (*TestCase, error)
}

func NewDatabase() (*Database, error) {
	dataSource := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", cfg.Host, strconv.FormatInt(cfg.Port, 10), cfg.Username, cfg.Password, cfg.DBName)
	db, err := gorm.Open(postgres.Open(dataSource), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return &Database{NextJudgeDB: db}, nil
}

func (d *Database) CreateUser(user *User) (*User, error) {
	user.JoinDate = time.Now()
	err := d.NextJudgeDB.Create(user).Error
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUsers() ([]User, error) {
	users := []User{}
	err := d.NextJudgeDB.Find(&users).Error
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (d *Database) GetUserByID(userId int) (*User, error) {
	user := &User{}
	err := db.NextJudgeDB.First(user, userId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUserByUsername(username string) (*User, error) {
	user := &User{}
	err := db.NextJudgeDB.Where("username = ?", username).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) UpdateUser(user *User) error {
	err := db.NextJudgeDB.Save(user).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) DeleteUser(user *User) error {
	err := db.NextJudgeDB.Delete(user).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) CreateProblem(problem *Problem) (*Problem, error) {
	problem.UploadDate = time.Now()
	err := d.NextJudgeDB.Create(problem).Error
	if err != nil {
		return nil, err
	}
	return problem, nil
}

func (d *Database) GetProblems() ([]Problem, error) {
	problems := []Problem{}
	err := d.NextJudgeDB.Find(&problems).Error
	if err != nil {
		return nil, err
	}
	return problems, nil
}

func (d *Database) GetProblemByID(problemId int) (*Problem, error) {
	problem := &Problem{}
	err := d.NextJudgeDB.Model(&Problem{}).Preload("TestCases").First(problem, problemId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

func (d *Database) GetProblemByTitle(title string) (*Problem, error) {
	problem := &Problem{}
	err := d.NextJudgeDB.Model(&Problem{}).Preload("TestCases").Where("title = ?", title).First(problem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

func (d *Database) CreateSubmission(submission *Submission) (*Submission, error) {
	submission.SubmitTime = time.Now()
	err := d.NextJudgeDB.Create(submission).Error
	if err != nil {
		return nil, err
	}
	return submission, nil
}

func (d *Database) GetSubmission(submissionId int) (*Submission, error) {
	submission := &Submission{}
	err := db.NextJudgeDB.First(submission, submissionId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submission, nil
}

func (d *Database) UpdateSubmission(submission *Submission) error {
	err := db.NextJudgeDB.Save(submission).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) CreateLanguage(language *Language) (*Language, error) {
	err := d.NextJudgeDB.Create(language).Error
	if err != nil {
		return nil, err
	}
	return language, nil
}

func (d *Database) GetLanguages() ([]Language, error) {
	languages := []Language{}
	err := d.NextJudgeDB.Find(&languages).Error
	if err != nil {
		return nil, err
	}
	return languages, nil
}

func (d *Database) GetLanguageByNameAndVersion(name string, version string) (*Language, error) {
	language := &Language{}
	err := d.NextJudgeDB.Where("name = ? AND version = ?", name, version).First(language).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return language, nil
}

func (d *Database) GetLanguage(id int) (*Language, error) {
	language := &Language{}
	err := db.NextJudgeDB.First(language, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return language, nil
}

func (d *Database) GetTestCase(testcaseId int) (*TestCase, error) {
	testCase := &TestCase{}
	err := db.NextJudgeDB.First(testCase, testcaseId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return testCase, nil
}
