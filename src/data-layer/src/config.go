package main

import (
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
	CORSAllowPreview     bool
	Host                 string
	Port                 int64
	Username             string
	Password             string
	WebBridgeSecret      []byte
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
	AdminEmails                []string
	SeedData                   bool
	AllowInsecurePasswordReset bool
	PasswordResetDebug         bool
	TrustedProxy               bool
}

var cfg config

func init() {
	_ = godotenv.Load()
	var err error

	// Parse and validate a comma-separated list of allowed origins.
	rawOrigins := strings.Split(os.Getenv("CORS_ORIGIN"), ",")
	cfg.CORSOrigin = make([]string, 0, len(rawOrigins))
	for _, domain := range rawOrigins {
		domain = strings.TrimSpace(domain)
		if domain == "" {
			continue
		}
		if domain == "*" {
			log.Fatalln("CORS_ORIGIN must not be wildcard when AllowCredentials is enabled")
		}
		u, err := url.Parse(domain)
		if err != nil {
			log.Fatalln("CORS_ORIGIN contains an invalid URL")
		}
		if !u.IsAbs() {
			log.Fatalln("CORS_ORIGIN contains a non-absolute URL")
		}
		cfg.CORSOrigin = append(cfg.CORSOrigin, domain)
	}
	if len(cfg.CORSOrigin) == 0 {
		cfg.CORSOrigin = []string{"http://localhost:8080"}
		logrus.Warn("CORS_ORIGIN unset; defaulting to http://localhost:8080")
	}

	cfg.CORSAllowPreview = envBool("CORS_ALLOW_PREVIEW")

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

	webBridgeSecret := os.Getenv("WEB_BRIDGE_SECRET")
	if webBridgeSecret == "" {
		webBridgeSecret = os.Getenv("AUTH_PROVIDER_PASSWORD")
		if webBridgeSecret != "" {
			logrus.Warn("AUTH_PROVIDER_PASSWORD is deprecated; use WEB_BRIDGE_SECRET")
		}
	}
	if webBridgeSecret == "" {
		logrus.Fatal("Must specify WEB_BRIDGE_SECRET")
	}
	cfg.WebBridgeSecret = []byte(webBridgeSecret)

	judge_password := os.Getenv("JUDGE_PASSWORD")
	if judge_password == "" {
		logrus.Fatal("Must specify JUDGE_PASSWORD")
	}
	cfg.JudgePassword = []byte(judge_password)

	jwt_signing_secret := os.Getenv("JWT_SIGNING_SECRET")
	if jwt_signing_secret == "" {
		logrus.Fatal("Must specify JWT_SIGNING_SECRET")
	}
	cfg.JwtSigningSecret = []byte(jwt_signing_secret)

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
	if cfg.RabbitPassword == "" {
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

	cfg.SeedData = envBool("SEED_DATA")
	cfg.AllowInsecurePasswordReset = envBool("ALLOW_INSECURE_PASSWORD_RESET")
	cfg.PasswordResetDebug = envBool("PASSWORD_RESET_DEBUG")
	cfg.TrustedProxy = envBool("TRUSTED_PROXY")
}

func envBool(key string) bool {
	value := strings.Trim(strings.TrimSpace(os.Getenv(key)), "'\"")
	return value == "true" || value == "1"
}
