package main

import (
	"fmt"
	"strconv"
	"time"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
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

	err = SetupDatabase(nextjudgeDB)
	if err != nil {
		return nil, err
	}

	return nextjudgeDB, nil
}

// Initial setup of database
// Adds the "General Event"
func SetupDatabase(db *Database) error {
	event, err := db.GetEventByID(getGeneralEventID())
	if err != nil {
		return err
	}
	// Create Event ID 1 on the initial setup
	if event == nil {
		db.CreateEvent(&EventWithProblems{
			Event: Event{
				Title:       "Problem List",
				Description: "Public Problems",
			},
		})
	}

	return nil
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

func (d *Database) GetOrCreateUserByAccountIdentifier(newUserData *User) (*User, error) {
	var user User
	err := d.NextJudgeDB.Where(User{AccountIdentifier: newUserData.AccountIdentifier}).FirstOrCreate(&user, newUserData).Error
	return &user, err
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
	err := db.NextJudgeDB.Model(&ProblemDescription{ID: problemId}).Association("Categories").Find(&categories)
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
	err := d.NextJudgeDB.Model(&ProblemDescriptionExt{}).Preload("Categories").Preload("TestCases").First(problem, problemId).Error
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
	// Preload("Language").Preload("Problem", func(db *gorm.DB) *gorm.DB {
	// 	return db.Select("id, problem_id")
	// })
	err := db.NextJudgeDB.Preload("Language").Preload("Problem").First(submission, submissionId).Error

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
		return db.Select("ID, Title")
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
		return db.Select("ID, Title")
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
	err := db.NextJudgeDB.Omit("Language", "Problem").Save(submission).Error
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

func (d *Database) CreateEvent(competition *EventWithProblems) (*EventWithProblems, error) {
	err := d.NextJudgeDB.Create(competition).Error
	if err != nil {
		return nil, err
	}
	return competition, nil
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

func (d *Database) UpdateEvent(competition *Event) error {
	err := db.NextJudgeDB.Save(competition).Error
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
	// Problem    ProblemDescription `json:"problem"`

	AcceptTimeout float64 `json:"accept_timeout"`
	MemoryLimit   int     `json:"memory_limit"`

	// Tests []TestCase `json:"tests,omitempty"`
	Tests []TestCase `json:"test_cases"`
}

// Return list of problems in a given event
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
		memoryLimit := problemDescription.DefaultMemoryLimit

		if eventProblem.AcceptTimeout != nil {
			acceptTimeout = *eventProblem.AcceptTimeout
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

			AcceptTimeout: acceptTimeout,
			MemoryLimit:   memoryLimit,
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
	memoryLimit := problemDescription.DefaultMemoryLimit

	if eventProblem.AcceptTimeout != nil {
		acceptTimeout = *eventProblem.AcceptTimeout
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

		AcceptTimeout: acceptTimeout,
		MemoryLimit:   memoryLimit,

		Tests: problemDescription.TestCases,
	}

	return &problemData, nil
}

// Include public test data
func (d *Database) GetPublicEventProblemWithTestsByID(eventProblemID int) (*GetEventProblemType, error) {
	eventProblem := &EventProblemExtWithTests{}
	err := db.NextJudgeDB.Preload("Problem").Preload("Problem.TestCases", "hidden = ?", false).Preload("Problem.Categories").First(eventProblem, eventProblemID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return ConvertEventProblemExtWithTestsToPublicData(eventProblem)
}

func (d *Database) GetEventProblemWithTestsByID(eventProblemID int) (*GetEventProblemType, error) {
	eventProblem := &EventProblemExtWithTests{}
	err := db.NextJudgeDB.Preload("Problem").Preload("Problem.TestCases").Preload("Problem.Categories").First(eventProblem, eventProblemID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	return ConvertEventProblemExtWithTestsToPublicData(eventProblem)
}

func (d *Database) GetEventProblemExtByID(eventProblemID int) (*EventProblemExt, error) {
	eventProblem := &EventProblemExt{}
	err := db.NextJudgeDB.Preload("Problem").First(eventProblem, eventProblemID).Error
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
