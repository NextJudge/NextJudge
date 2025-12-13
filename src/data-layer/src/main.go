package main

import (
	"database/sql"
	"flag"
	"net/http"
	"os"

	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

var db *Database
var es *ElasticSearch

func main() {
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		if err := runHealthcheck(); err != nil {
			logrus.WithError(err).Error("healthcheck failed")
			os.Exit(1)
		}
		os.Exit(0)
	}

	var debug = flag.Bool("d", false, "enable debug logging")
	var port = flag.String("p", "5000", "port")
	flag.Parse()

	if *debug {
		logrus.SetLevel(logrus.DebugLevel)
		logrus.SetFormatter(&logrus.JSONFormatter{PrettyPrint: true})
	}

	var err error

	err = SetupRabbitMQConnection()
	if err != nil {
		logrus.Fatal(err)
	}

	db, err = NewDatabase()
	if err != nil {
		logrus.WithError(err).Error("error creating database")
		os.Exit(1)
	}

	if err := RunMigrations(db); err != nil {
		logrus.WithError(err).Error("migration failed")
		os.Exit(1)
	}

	if cfg.SeedData {
		if err := SeedDevData(db); err != nil {
			logrus.WithError(err).Warn("seed failed, continuing...")
		}
	}

	if cfg.ElasticEnabled {
		es, err = NewElasticSearch()
		if err != nil {
			logrus.WithError(err).Error("error creating elastic search client")
			os.Exit(1)
		}
		if es == nil {
			logrus.WithError(err).Error("error creating elastic search client")
			os.Exit(1)
		}
	}

	mux := goji.NewMux()
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORSOrigin,
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowCredentials: true,
		MaxAge:           3600,
	})

	mux.Use(JSONMiddleware)
	mux.Use(c.Handler)

	addAuthRoutes(mux)
	addInputSubmissionRoutes(mux)
	addUserRoutes(mux)
	addProblemRoutes(mux)
	addSubmissionRoutes(mux)
	addLanguageRoutes(mux)
	addEventsRoutes(mux)
	addHealthyRoute(mux)

	logrus.Info("Starting data layer API")

	addr := ":" + *port
	err = http.ListenAndServe(addr, mux)
	if err != nil {
		logrus.WithError(err).Error("http listener error")
		CloseRabbitMQConnection()
		os.Exit(1)
	}
}

func runHealthcheck() error {
	testDB, err := NewDatabase()
	if err != nil {
		return err
	}
	defer func() {
		if testDB != nil && testDB.NextJudgeDB != nil {
			sqlDB, err := testDB.NextJudgeDB.DB()
			if err == nil && sqlDB != nil {
				sqlDB.Close()
			}
		}
	}()

	var sqlDB *sql.DB
	sqlDB, err = testDB.NextJudgeDB.DB()
	if err != nil {
		return err
	}

	if err := sqlDB.Ping(); err != nil {
		return err
	}

	rabbitConn, err := NewRabbitMQConnection()
	if err != nil {
		return err
	}
	defer rabbitConn.Close()

	return nil
}

func addHealthyRoute(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/healthy"), getHealthy)
}

func getHealthy(w http.ResponseWriter, r *http.Request) {
	if db == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	var sqlDB *sql.DB
	sqlDB, err := db.NextJudgeDB.DB()
	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	if err := sqlDB.Ping(); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	if rabbit_connection == nil || rabbit_connection.Channel == nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func JSONMiddleware(h http.Handler) http.Handler {
	f := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		h.ServeHTTP(w, r)
	}
	return http.HandlerFunc(f)
}
