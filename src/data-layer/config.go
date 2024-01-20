package main

import (
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type config struct {
	CORSOrigin               []string
	Host                     string
	Port                     int64
	Username                 string
	Password                 string
	DBName                   string
	DBDriver                 string
	UsersTable               string
	ProblemsTable            string
	SubmissionsTable         string
	TestCasesTable           string
	CompetitionsTable        string
	CompetitionProblemsTable string
	CompetitionUsersTable    string
}

var cfg config

func init() {
	_ = godotenv.Load()
	var err error

	// Parse and validate a comma-seperated list of URLs of allowed origins.
	cfg.CORSOrigin = strings.Split(os.Getenv("CORS_ORIGIN"), ",")
	for _, domain := range cfg.CORSOrigin {
		// Defaults to "*" if no env set.
		if domain == "" || domain == "*" {
			// Any use of the wildcard means we don't care about other domains that
			// were set.
			cfg.CORSOrigin = []string{"*"}
			break
		}
		u, err := url.Parse(domain)
		if err != nil {
			log.Fatalln("CORS_ORIGIN contains an invalid URL")
		}
		if !u.IsAbs() {
			log.Fatalln("CORS_ORIGIN contains a non-absolute URL")
		}
	}

	host := os.Getenv("DB_HOST")
	if host == "" {
		cfg.Host = "localhost"
	} else {
		cfg.Host = host
	}

	port := os.Getenv("DB_PORT")
	if port == "" {
		cfg.Port = 5432
	} else {
		cfg.Port, err = strconv.ParseInt(port, 10, 64)
		if err != nil {
			log.Fatalln("Error parsing DB_PORT")
		}
	}

	username := os.Getenv("DB_USERNAME")
	if username == "" {
		cfg.Username = "postgres"
	} else {
		cfg.Username = username
	}

	driver := os.Getenv("DB_DRIVER_NAME")
	if driver == "" {
		cfg.DBDriver = "postgres"
	} else {
		cfg.DBDriver = username
	}

	password := os.Getenv("DB_PASSWORD")
	if password == "" {
		cfg.Password = "example"
	} else {
		cfg.Password = password
	}

	database := os.Getenv("DB_NAME")
	if database == "" {
		cfg.DBName = "nextjudge"
	} else {
		cfg.DBName = database
	}

	usersTable := os.Getenv("DB_USER_TABLE_NAME")
	if usersTable == "" {
		cfg.UsersTable = DefaultUsersTable
	} else {
		cfg.UsersTable = usersTable
	}

	problemsTable := os.Getenv("DB_PROBLEM_TABLE_NAME")
	if problemsTable == "" {
		cfg.ProblemsTable = DefaultProblemsTable
	} else {
		cfg.ProblemsTable = usersTable
	}

	submissionsTable := os.Getenv("DB_SUBMISSION_TABLE_NAME")
	if submissionsTable == "" {
		cfg.SubmissionsTable = DefaultSubmissionsTable
	} else {
		cfg.SubmissionsTable = submissionsTable
	}

	testCasesTable := os.Getenv("DB_TEST_CASE_TABLE_NAME")
	if testCasesTable == "" {
		cfg.TestCasesTable = DefaultTestCasesTable
	} else {
		cfg.TestCasesTable = testCasesTable
	}

	competitionsTable := os.Getenv("DB_COMPETITION_TABLE_NAME")
	if competitionsTable == "" {
		cfg.CompetitionsTable = DefaultCompetitionsTable
	} else {
		cfg.CompetitionsTable = competitionsTable
	}

	competitionProblemsTable := os.Getenv("DB_COMPETITION_PROBLEM_TABLE_NAME")
	if competitionProblemsTable == "" {
		cfg.CompetitionProblemsTable = DefaultCompetitionProblemsTable
	} else {
		cfg.CompetitionProblemsTable = competitionProblemsTable
	}

	competitionUsersTable := os.Getenv("DB_COMPETITION_USER_TABLE_NAME")
	if competitionUsersTable == "" {
		cfg.CompetitionUsersTable = DefaultCompetitionUsersTable
	} else {
		cfg.CompetitionUsersTable = competitionUsersTable
	}
}
