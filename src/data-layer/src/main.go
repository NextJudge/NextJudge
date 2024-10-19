package main

import (
	"flag"
	"net/http"
	"os"

	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

var (
	db *Database
	es *ElasticSearch
)

func main() {
	var debug = flag.Bool("d", false, "enable debug logging")
	var port = flag.String("p", "5000", "port")
	var err error

	if *debug {
		logrus.SetLevel(logrus.DebugLevel)
		logrus.SetFormatter(&logrus.JSONFormatter{PrettyPrint: true})
	}

	SetupRabbitMQConnection()

	db, err = NewDatabase()
	if err != nil {
		logrus.WithError(err).Error("error creating database")
		os.Exit(1)
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
		AllowedOrigins: cfg.CORSOrigin,
		AllowedHeaders: []string{"Content-Type", "Authorization"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE"},
		MaxAge:         3600,
	})

	mux.Use(JSONMiddleware)
	mux.Use(c.Handler)

	addUserRoutes(mux)
	addProblemRoutes(mux)
	addSubmissionRoutes(mux)
	addInputSubmissionRoutes(mux)
	addLanguageRoutes(mux)
	addCompetitionsRoutes(mux)
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

func addHealthyRoute(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/healthy"), getHealthy)
}

func getHealthy(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func JSONMiddleware(h http.Handler) http.Handler {
	f := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		h.ServeHTTP(w, r)
	}
	return http.HandlerFunc(f)
}
