package main

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	NextJudgeDB *gorm.DB
}

type NextJudgeDB interface {
	// GetUsers() ([]User, error)
	// CreateUser(user *User) (*User, error)
	// GetUserByID(userId uuid.UUID) (*User, error)
	// GetUserByUsername(username string) (*User, error)
	// GetUserByEmail(email string) (*User, error)
	// UpdateUser(user *User) error
	// DeleteUser(user *User) error
	// GetCategories() ([]Category, error)
	// CreateProblem(problem *ProblemDescription) (*ProblemDescription, error)
	// GetProblems() ([]ProblemDescription, error)
	// GetProblemDescriptionByID(problemId int) (*ProblemDescription, error)
	// GetPublicProblemByID(problemId int) (*ProblemDescription, error)
	// GetProblemByTitle(title string) (*ProblemDescription, error)
	// DeleteProblem(problem *ProblemDescription) error
	// CreateSubmission(submission *Submission) (*Submission, error)
	// GetSubmission(submissionId uuid.UUID) (*Submission, error)
	// GetSubmissionsByUserID(userID uuid.UUID) ([]Submission, error)
	// GetProblemSubmissionsByUserID(userId uuid.UUID, problemId int) ([]Submission, error)
	// UpdateSubmission(submission *Submission) error
	// CreateLanguage(language *Language) (*Language, error)
	// GetLanguages() ([]Language, error)
	// GetLanguageByNameAndVersion(name string, version string) (*Language, error)
	// GetLanguage(id string) (*Language, error)
	// DeleteLanguage(language *Language) error
	// GetTestCase(testcaseId uuid.UUID) (*TestCase, error)
	// GetCompetitions() ([]Event, error)
	// GetCompetitionByID(competitionId uuid.UUID) (*Event, error)
	// GetCompetitionByTitle(title string) (*Event, error)
	// CreateCompetition(competition *Event) (*Event, error)
	// UpdateCompetition(competition *Event) error
	// DeleteCompetition(competition *Event) error
}

func NewDatabase() (*Database, error) {
	dataSource := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s", cfg.Host, strconv.FormatInt(cfg.Port, 10), cfg.Username, cfg.Password, cfg.DBName)
	db, err := gorm.Open(
		postgres.Open(dataSource),
		&gorm.Config{
			Logger: logger.Default.LogMode(logger.Error),
		},
	)
	if err != nil {
		return nil, err
	}

	nextjudgeDB := &Database{NextJudgeDB: db}

	return nextjudgeDB, nil
}

func (d *Database) GetUserByAccountIdentifier(accountIdentifier string) (*User, error) {
	user := &User{}
	err := db.NextJudgeDB.Where("account_identifier = ?", accountIdentifier).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) GetUserByAccountIdentifierWithPasswordHash(accountIdentifier string) (*UserWithPassword, error) {
	user := &UserWithPassword{}
	err := db.NextJudgeDB.Where("account_identifier = ?", accountIdentifier).First(user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return user, nil
}

func (d *Database) updateUserFromOAuthData(user *User, newUserData *User) error {
	updated := false
	if newUserData.Image != "" && user.Image != newUserData.Image {
		user.Image = newUserData.Image
		updated = true
	}
	if newUserData.Name != "" && user.Name != newUserData.Name {
		user.Name = newUserData.Name
		updated = true
	}
	if newUserData.Email != "" && user.Email != newUserData.Email {
		user.Email = newUserData.Email
		updated = true
	}
	if updated {
		return d.NextJudgeDB.Save(user).Error
	}
	return nil
}

func (d *Database) GetOrCreateUserByAccountIdentifier(newUserData *User) (*User, error) {
	user, err := d.GetUserByAccountIdentifier(newUserData.AccountIdentifier)
	if err != nil {
		return nil, err
	}

	if user != nil {
		err = d.updateUserFromOAuthData(user, newUserData)
		if err != nil {
			return nil, err
		}
		return user, nil
	}

	newUserData.JoinDate = time.Now()
	err = d.NextJudgeDB.Create(newUserData).Error
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "23505") {
			user, fetchErr := d.GetUserByAccountIdentifier(newUserData.AccountIdentifier)
			if fetchErr != nil {
				return nil, fetchErr
			}
			if user != nil {
				err = d.updateUserFromOAuthData(user, newUserData)
				if err != nil {
					return nil, err
				}
				return user, nil
			}
		}
		return nil, err
	}

	return newUserData, nil
}

func (d *Database) CreateUser(user *User) (*User, error) {
	user.JoinDate = time.Now()
	err := d.NextJudgeDB.Create(user).Error
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (d *Database) CreateUserWithPasswordHash(user *UserWithPassword) (*User, error) {
	user.JoinDate = time.Now()

	err := d.NextJudgeDB.Create(user).Error
	if err != nil {
		return nil, err
	}

	response := &User{
		ID:                user.ID,
		AccountIdentifier: user.AccountIdentifier,
		Email:             user.Email,
		Name:              user.Name,
		Image:             user.Image,
		EmailVerified:     user.EmailVerified,
		JoinDate:          user.JoinDate,
		IsAdmin:           user.IsAdmin,
	}

	return response, nil
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

// update the user's password_hash and salt by email.
func (d *Database) UpdateUserPasswordByEmail(email string, salt []byte, passwordHash []byte) (*User, error) {
    // Ensure user exists first
    user := &User{}
    err := d.NextJudgeDB.Where("email = ?", email).First(user).Error
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, nil
        }
        return nil, err
    }

    // Perform partial update on sensitive fields
    err = d.NextJudgeDB.Model(&UserWithPassword{}).
        Where("email = ?", email).
        Updates(map[string]interface{}{
            "salt":          salt,
            "password_hash": passwordHash,
        }).Error
    if err != nil {
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

func (d *Database) GetProblemCategories(problemId int) ([]Category, error) {
	categories := []Category{}
	err := d.NextJudgeDB.Model(&ProblemDescriptionExt{ProblemDescription: ProblemDescription{ID: problemId}}).Association("Categories").Find(&categories)
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

func (d *Database) CreateProblemDescription(problem *ProblemDescriptionExt) (*ProblemDescriptionExt, error) {
	err := d.NextJudgeDB.Create(problem).Error
	if err != nil {
		return nil, err
	}
	return problem, nil
}

func (d *Database) UpdateProblemDescription(problem *ProblemDescriptionExt) error {
	err := d.NextJudgeDB.Save(problem).Error
	if err != nil {
		return err
	}
	return nil
}

// func (d *Database) GetProblemDescriptions() ([]ProblemDescription, error) {
// 	problems := []ProblemDescription{}
// 	err := d.NextJudgeDB.Preload("Categories").Find(&problems).Error
// 	if err != nil {
// 		return nil, err
// 	}
// 	return problems, nil
// }

func (d *Database) GetProblemDescriptionByID(problemId int) (*ProblemDescriptionExt, error) {
	problem := &ProblemDescriptionExt{}
	err := d.NextJudgeDB.Preload("Categories").Preload("TestCases").First(problem, problemId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

// func (d *Database) GetPublicProblemDescriptionByID(problemId int) (*ProblemDescriptionExt, error) {
// 	problem := &ProblemDescriptionExt{}
// 	err := d.NextJudgeDB.Model(&ProblemDescriptionExt{}).Preload("Categories").Preload("TestCases", "hidden = ?", true).First(problem, problemId).Error
// 	if err != nil {
// 		if err == gorm.ErrRecordNotFound {
// 			return nil, nil
// 		}
// 		return nil, err
// 	}
// 	return problem, nil
// }

func (d *Database) GetProblemDescriptionByTitle(title string) (*ProblemDescription, error) {
	problem := &ProblemDescription{}
	err := d.NextJudgeDB.Model(&ProblemDescription{}).Where("title = ?", title).First(problem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

func (d *Database) GetProblemDescriptionByIdentifer(title string) (*ProblemDescription, error) {
	problem := &ProblemDescription{}
	err := d.NextJudgeDB.Model(&ProblemDescription{}).Where("identifier = ?", title).First(problem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

func (d *Database) DeleteProblem(problem *ProblemDescriptionExt) error {
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
	err := d.NextJudgeDB.Preload("Language").Preload("Problem").Preload("TestCaseResults").First(submission, submissionId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submission, nil
}

func (d *Database) GetSubmissionsByUserID(userId uuid.UUID) ([]Submission, error) {
	submissions := []Submission{}
	err := db.NextJudgeDB.Order("submit_time desc").Limit(25).Preload("Language").Preload("Problem", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "title", "difficulty", "identifier")
	}).Where("user_id = ?", userId).Find(&submissions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submissions, nil
}

func (d *Database) GetProblemSubmissionsByUserID(userId uuid.UUID, problemId int) ([]Submission, error) {
	submissions := []Submission{}
	err := db.NextJudgeDB.Order("submit_time desc").Limit(25).Preload("Language").Preload("Problem", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "title", "difficulty", "identifier")
	}).Where("user_id = ?", userId).Where("problem_id = ?", problemId).Find(&submissions).Error
	// err := db.NextJudgeDB.Preload("Language").Preload("Problem").Where("user_id = ?", userId).Where("problem_id = ?", problemId).Find(&submissions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return submissions, nil
}

func (d *Database) UpdateSubmission(submission *Submission) error {
	// update submission fields
	err := d.NextJudgeDB.Model(submission).Select(
		"status",
		"failed_test_case_id",
		"stdout",
		"stderr",
		"time_elapsed",
	).Updates(submission).Error
	if err != nil {
		return err
	}

	// handle test case results if present
	if len(submission.TestCaseResults) > 0 {
		// delete existing results for this submission
		err = d.NextJudgeDB.Where("submission_id = ?", submission.ID).Delete(&SubmissionTestCaseResult{}).Error
		if err != nil {
			return err
		}

		// set submission_id on all results and insert
		for i := range submission.TestCaseResults {
			submission.TestCaseResults[i].SubmissionID = submission.ID
		}
		err = d.NextJudgeDB.Create(&submission.TestCaseResults).Error
		if err != nil {
			return err
		}
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
	err := db.NextJudgeDB.Preload("Problems").Preload("Problems.Problem").Where("title = ?", title).First(competition).Error
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

func (d *Database) UpdateEvent(event *Event) error {
	err := db.NextJudgeDB.Save(event).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) DeleteEvent(competition *Event) error {
	err := db.NextJudgeDB.Delete(competition).Error
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

	// Tests []TestCase `json:"tests,omitempty"`
	Tests []TestCase `json:"test_cases"`
}

func (d *Database) GetPublicProblems() ([]GetEventProblemType, error) {
	problemDescriptions := []ProblemDescription{}
	err := d.NextJudgeDB.Where("public = ?", true).Find(&problemDescriptions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	problems := []GetEventProblemType{}

	for _, problemDescription := range problemDescriptions {
		problemData := GetEventProblemType{
			ID: problemDescription.ID,
			// not associated with any specific event
			Title:      problemDescription.Title,
			Prompt:     problemDescription.Prompt,
			Source:     problemDescription.Source,
			Difficulty: problemDescription.Difficulty,
			UserID:     problemDescription.UserID,
			UploadDate: problemDescription.UploadDate,
			UpdatedAt:  problemDescription.UpdatedAt,
			Public:     problemDescription.Public,

			AcceptTimeout:    problemDescription.DefaultAcceptTimeout,
			ExecutionTimeout: problemDescription.DefaultExecutionTimeout,
			MemoryLimit:      problemDescription.DefaultMemoryLimit,
		}
		problems = append(problems, problemData)
	}

	return problems, nil
}

func (d *Database) GetAllProblems() ([]GetEventProblemType, error) {
	problemDescriptions := []ProblemDescription{}
	err := d.NextJudgeDB.Find(&problemDescriptions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	problems := []GetEventProblemType{}

	for _, problemDescription := range problemDescriptions {
		problemData := GetEventProblemType{
			ID: problemDescription.ID,
			// not associated with any specific event
			Title:      problemDescription.Title,
			Prompt:     problemDescription.Prompt,
			Source:     problemDescription.Source,
			Difficulty: problemDescription.Difficulty,
			UserID:     problemDescription.UserID,
			UploadDate: problemDescription.UploadDate,
			UpdatedAt:  problemDescription.UpdatedAt,
			Public:     problemDescription.Public,

			AcceptTimeout:    problemDescription.DefaultAcceptTimeout,
			ExecutionTimeout: problemDescription.DefaultExecutionTimeout,
			MemoryLimit:      problemDescription.DefaultMemoryLimit,
		}
		problems = append(problems, problemData)
	}

	return problems, nil
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
	err := db.NextJudgeDB.Preload("Problem").Preload("Problem.TestCases", "hidden = ?", false).Preload("Problem.Categories").
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
	err := db.NextJudgeDB.Preload("Problem").Preload("Problem.TestCases").Preload("Problem.Categories").
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
	err := db.NextJudgeDB.Preload("Problem").Where("event_id = ? AND event_problem_id = ?", eventID, eventProblemID).First(eventProblem).Error
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

func (d *Database) GetTeamByID(team_id uuid.UUID) (*EventTeam, error) {
	team := &EventTeam{}
	err := db.NextJudgeDB.Where("id = ?", team_id).First(team).Error
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
	err := db.NextJudgeDB.Where("name = ?", name).First(team).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return team, nil
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
	err := d.NextJudgeDB.Table("users").
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

// func (d *Database) GetEventSubmissionsForUser(eventID int, query string) ([]Submission, error) {
// 	submissions := []Submission{}
// 	err := d.NextJudgeDB.Where("event_id = ?", eventID).Where(query).Find(&submissions).Error
// 	if err != nil {
// 		return nil, err
// 	}
// 	return submissions, nil
// }

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

func (d *Database) CreateEventQuestion(question *EventQuestion) (*EventQuestion, error) {
	question.CreatedAt = time.Now()
	question.UpdatedAt = time.Now()
	err := d.NextJudgeDB.Create(question).Error
	if err != nil {
		return nil, err
	}
	return question, nil
}

func (d *Database) GetEventQuestions(eventID int) ([]EventQuestionExt, error) {
	var questions []EventQuestionExt
	err := d.NextJudgeDB.Preload("User").Preload("Problem").Preload("Answerer").
		Where("event_id = ?", eventID).
		Order("created_at DESC").
		Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}

func (d *Database) GetEventQuestionByID(questionID uuid.UUID) (*EventQuestionExt, error) {
	var question EventQuestionExt
	err := d.NextJudgeDB.Preload("User").Preload("Problem").Preload("Answerer").
		Where("id = ?", questionID).
		First(&question).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &question, nil
}

func (d *Database) UpdateEventQuestion(question *EventQuestion) error {
	question.UpdatedAt = time.Now()
	err := d.NextJudgeDB.Save(question).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) AnswerEventQuestion(questionID uuid.UUID, answer string, answeredBy uuid.UUID) error {
	now := time.Now()
	err := d.NextJudgeDB.Model(&EventQuestion{}).
		Where("id = ?", questionID).
		Updates(map[string]interface{}{
			"answer":      answer,
			"is_answered": true,
			"answered_at": &now,
			"answered_by": answeredBy,
			"updated_at":  now,
		}).Error
	return err
}

// Legacy functions - commented out but kept for reference
// func (d *Database) GetUnansweredQuestionsCount(userID uuid.UUID) (int64, error) {
// 	var count int64
// 	err := d.NextJudgeDB.Model(&EventQuestion{}).
// 		Where("user_id = ? AND is_answered = ?", userID, false).
// 		Count(&count).Error
// 	return count, err
// }

// func (d *Database) GetUserQuestionNotifications(userID uuid.UUID) ([]EventQuestionExt, error) {
// 	var questions []EventQuestionExt
// 	err := d.NextJudgeDB.Preload("User").Preload("Problem").Preload("Answerer").
// 		Where("user_id = ? AND is_answered = ?", userID, true).
// 		Where("answered_at > ?", time.Now().Add(-24*time.Hour)).
// 		Order("answered_at DESC").
// 		Limit(10).
// 		Find(&questions).Error
// 	if err != nil {
// 		return nil, err
// 	}
// 	return questions, nil
// }

// notification functions
func (d *Database) CreateQuestionNotifications(eventID int, questionID uuid.UUID, questionAuthorID uuid.UUID) error {
	// get all users in the event except the question author
	var users []EventUser
	err := d.NextJudgeDB.Where("event_id = ? AND user_id != ?", eventID, questionAuthorID).Find(&users).Error
	if err != nil {
		return err
	}

	// create notifications for all other users
	for _, user := range users {
		notification := &Notification{
			UserID:           user.UserID,
			EventID:          eventID,
			QuestionID:       questionID,
			NotificationType: "question",
			IsRead:           false,
			CreatedAt:        time.Now(),
			UpdatedAt:        time.Now(),
		}
		err = d.NextJudgeDB.Create(notification).Error
		if err != nil {
			// ignore unique constraint violations
			continue
		}
	}
	return nil
}

func (d *Database) CreateAnswerNotification(eventID int, questionID uuid.UUID, questionAuthorID uuid.UUID) error {
	// create notification for the question author
	notification := &Notification{
		UserID:           questionAuthorID,
		EventID:          eventID,
		QuestionID:       questionID,
		NotificationType: "answer",
		IsRead:           false,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	return d.NextJudgeDB.Create(notification).Error
}

func (d *Database) GetUnreadNotificationsCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := d.NextJudgeDB.Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

func (d *Database) GetUserNotifications(userID uuid.UUID) ([]NotificationExt, error) {
	var notifications []NotificationExt
	err := d.NextJudgeDB.Table("notifications").
		Preload("Question").Preload("Question.User").Preload("Question.Problem").Preload("Question.Answerer").
		Where("user_id = ?", userID).
		Where("is_read = ? OR (is_read = ? AND created_at > ?)", false, true, time.Now().Add(-24*time.Hour)).
		Order("created_at DESC").
		Limit(20).
		Find(&notifications).Error
	if err != nil {
		return nil, err
	}
	return notifications, nil
}

func (d *Database) MarkNotificationAsRead(notificationID uuid.UUID) error {
	return d.NextJudgeDB.Model(&Notification{}).
		Where("id = ?", notificationID).
		Update("is_read", true).Error
}

func (d *Database) MarkAllNotificationsAsRead(userID uuid.UUID) error {
	return d.NextJudgeDB.Model(&Notification{}).
		Where("user_id = ?", userID).
		Update("is_read", true).Error
}
