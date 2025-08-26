package main

import (
	"crypto/rand"
	"log"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

type config struct {
	CORSOrigin           []string
	Host                 string
	Port                 int64
	Username             string
	Password             string
	AuthProviderPassword []byte
	JudgePassword        []byte
	JwtSigningSecret     []byte
	DBName               string
	DBDriver             string
	RabbitMQHost         string
	RabbitUser           string
	RabbitPassword       string
	ElasticEndpoint      string
	ProblemsIndex        string
	CompetitionsIndex    string
	ElasticEnabled       bool
	AuthDisabled         bool
	AdminEmails          []string
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
		logrus.Fatal("Must specify a DB_PASSWORD")
	} else {
		cfg.Password = password
	}

	database := os.Getenv("DB_NAME")
	if database == "" {
		cfg.DBName = "nextjudge"
	} else {
		cfg.DBName = database
	}

	auth_provider_password := os.Getenv("AUTH_PROVIDER_PASSWORD")
	if password == "" {
		logrus.Warn("Generating random string for AUTH PROVIDER PASSWORD")
		random := make([]byte, 64)
		_, err := rand.Read(random)
		if err != nil {
			logrus.Fatal("Failed to create random password")
		}
		cfg.AuthProviderPassword = random
	} else {
		cfg.AuthProviderPassword = []byte(auth_provider_password)
	}

	judge_password := os.Getenv("JUDGE_PASSWORD")
	if password == "" {
		logrus.Warn("Generating random string for JUDGE PASSWORD")
		random := make([]byte, 64)
		_, err := rand.Read(random)
		if err != nil {
			logrus.Fatal("Failed to create random password")
		}
		cfg.JudgePassword = random
	} else {
		cfg.JudgePassword = []byte(judge_password)
	}

	jwt_signing_secret := os.Getenv("JWT_SIGNING_SECRET")
	if password == "" {
		logrus.Warn("Generating random string for JWT SIGNING SECRET")
		random := make([]byte, 64)
		_, err := rand.Read(random)
		if err != nil {
			logrus.Fatal("Failed to create random password")
		}
		cfg.JwtSigningSecret = random
	} else {
		cfg.JwtSigningSecret = []byte(jwt_signing_secret)
	}

	rabbitMQHost := os.Getenv("RABBITMQ_HOST")
	if rabbitMQHost == "" {
		cfg.RabbitMQHost = "localhost"
	} else {
		cfg.RabbitMQHost = rabbitMQHost
	}

	cfg.RabbitUser = os.Getenv("RABBITMQ_USER")
	if cfg.RabbitUser == "" {
		logrus.Fatal("Must specify a RABBITMQ_USER")
	}

	cfg.RabbitPassword = os.Getenv("RABBITMQ_PASSWORD")
	if cfg.RabbitUser == "" {
		logrus.Fatal("Must specify a RABBITMQ_PASSWORD")
	}

	elasticEndpoint := os.Getenv("ELASTIC_ENDPOINT")
	if elasticEndpoint == "" {
		cfg.ElasticEndpoint = "http://localhost:9200"
	} else {
		cfg.ElasticEndpoint = elasticEndpoint
	}

	problemsIndex := os.Getenv("PROBLEMS_INDEX")
	if problemsIndex == "" {
		cfg.ProblemsIndex = "nextjudge-problems"
	} else {
		cfg.ProblemsIndex = problemsIndex
	}

	competitionsIndex := os.Getenv("COMPETITIONS_INDEX")
	if competitionsIndex == "" {
		cfg.CompetitionsIndex = "nextjudge-competitions"
	} else {
		cfg.CompetitionsIndex = competitionsIndex
	}

	elasticEnabled := os.Getenv("ELASTIC_ENABLED")
	if elasticEnabled == "true" {
		cfg.ElasticEnabled = true
	} else {
		cfg.ElasticEnabled = false
	}

	authDisabled := os.Getenv("AUTH_DISABLED")
	if authDisabled == "true" {
		logrus.Warn(strings.Repeat("AUTHENTICATION DISABLED\n", 10))
		cfg.AuthDisabled = true
	} else {
		cfg.AuthDisabled = false
	}

	adminEmails := os.Getenv("ADMIN_EMAILS")
	logrus.Info("Loading admin emails from environment: '", adminEmails, "'")
	if adminEmails == "" {
		cfg.AdminEmails = []string{}
		logrus.Info("No admin emails configured")
	} else {
		cfg.AdminEmails = strings.Split(adminEmails, ",")
		for i, email := range cfg.AdminEmails {
			cfg.AdminEmails[i] = strings.TrimSpace(email)
		}
		logrus.Info("Configured admin emails: ", cfg.AdminEmails)
	}
}
