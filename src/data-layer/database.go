package main

import (
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
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
	GetUserByID(userId uuid.UUID) (*User, error)
	GetUserByUsername(username string) (*User, error)
	GetUserByEmail(email string) (*User, error)
	UpdateUser(user *User) error
	DeleteUser(user *User) error
	GetCategories() ([]Category, error)
	CreateProblem(problem *Problem) (*Problem, error)
	GetProblems() ([]Problem, error)
	GetProblemByID(problemId uuid.UUID) (*Problem, error)
	GetPublicProblemByID(problemId uuid.UUID) (*Problem, error)
	GetProblemByTitle(title string) (*Problem, error)
	DeleteProblem(problem *Problem) error
	CreateSubmission(submission *Submission) (*Submission, error)
	GetSubmission(submissionId uuid.UUID) (*Submission, error)
	UpdateSubmission(submission *Submission) error
	CreateLanguage(language *Language) (*Language, error)
	GetLanguages() ([]Language, error)
	GetLanguageByNameAndVersion(name string, version string) (*Language, error)
	GetLanguage(id string) (*Language, error)
	DeleteLanguage(language *Language) error
	GetTestCase(testcaseId uuid.UUID) (*TestCase, error)
	GetCompetitions() ([]Competition, error)
	GetCompetitionByID(competitionId uuid.UUID) (*Competition, error)
	GetCompetitionByTitle(title string) (*Competition, error)
	CreateCompetition(competition *Competition) (*Competition, error)
	UpdateCompetition(competition *Competition) error
	DeleteCompetition(competition *Competition) error
}

func NewDatabase() (*Database, error) {
	dataSource := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s", cfg.Host, strconv.FormatInt(cfg.Port, 10), cfg.Username, cfg.Password, cfg.DBName)
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

func (d *Database) GetUserByID(userId uuid.UUID) (*User, error) {
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

func (d *Database) GetUserByName(name string) (*User, error) {
	user := &User{}
	err := db.NextJudgeDB.Where("name = ?", name).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUserByEmail(email string) (*User, error) {
	user := &User{}
	err := db.NextJudgeDB.Where("email = ?", email).First(user).Error
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

func (d *Database) GetCategories() ([]Category, error) {
	categories := []Category{}
	err := d.NextJudgeDB.Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (d *Database) GetCategoryByID(categoryId uuid.UUID) (*Category, error) {
	category := &Category{}
	err := d.NextJudgeDB.Model(&Category{}).First(category, categoryId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return category, nil
}

func (d *Database) CreateProblem(problem *Problem) (*Problem, error) {
	err := d.NextJudgeDB.Create(problem).Error
	if err != nil {
		return nil, err
	}
	return problem, nil
}

func (d *Database) GetProblems() ([]Problem, error) {
	problems := []Problem{}
	err := d.NextJudgeDB.Preload("Categories").Find(&problems).Error
	if err != nil {
		return nil, err
	}
	return problems, nil
}

func (d *Database) GetProblemByID(problemId uuid.UUID) (*Problem, error) {
	problem := &Problem{}
	err := d.NextJudgeDB.Model(&Problem{}).Preload("Categories").Preload("TestCases").First(problem, problemId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

func (d *Database) GetPublicProblemByID(problemId uuid.UUID) (*Problem, error) {
	problem := &Problem{}
	err := d.NextJudgeDB.Model(&Problem{}).Preload("Categories").Preload("TestCases", "is_public = ?", true).First(problem, problemId).Error
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

func (d *Database) DeleteProblem(problem *Problem) error {
	err := db.NextJudgeDB.Delete(problem).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) CreateSubmission(submission *Submission) (*Submission, error) {
	submission.SubmitTime = time.Now()
	err := d.NextJudgeDB.Create(submission).Error
	if err != nil {
		return nil, err
	}
	return submission, nil
}

func (d *Database) GetSubmission(submissionId uuid.UUID) (*Submission, error) {
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

func (d *Database) GetLanguage(id uuid.UUID) (*Language, error) {
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

func (d *Database) DeleteLanguage(language *Language) error {
	err := db.NextJudgeDB.Delete(language).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) GetTestCase(testcaseId uuid.UUID) (*TestCase, error) {
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

func (d *Database) GetCompetitions() ([]Competition, error) {
	competitions := []Competition{}
	err := d.NextJudgeDB.Find(&competitions).Error
	if err != nil {
		return nil, err
	}
	return competitions, nil
}

func (d *Database) GetCompetitionByID(competitionId uuid.UUID) (*Competition, error) {
	competition := &Competition{}
	err := db.NextJudgeDB.Preload("Problems").Preload("Users").First(competition, competitionId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return competition, nil
}

func (d *Database) GetCompetitionByTitle(title string) (*Competition, error) {
	competition := &Competition{}
	err := db.NextJudgeDB.Preload("Problems").Preload("Users").Where("title = ?", title).First(competition).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return competition, nil
}

func (d *Database) CreateCompetition(competition *Competition) (*Competition, error) {
	err := d.NextJudgeDB.Create(competition).Error
	if err != nil {
		return nil, err
	}
	return competition, nil
}

func (d *Database) UpdateCompetition(competition *Competition) error {
	err := db.NextJudgeDB.Save(competition).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) DeleteCompetition(competition *Competition) error {
	err := db.NextJudgeDB.Delete(competition).Error
	if err != nil {
		return err
	}
	return nil
}
