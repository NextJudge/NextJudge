package main

import (
	"flag"
	"net/http"
	"os"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"goji.io"
)

var (
	db *Database
	es *elasticsearch.Client
)

func main() {
	var debug = flag.Bool("d", false, "enable debug logging")
	var port = flag.String("p", "5000", "port")
	var err error

	if *debug {
		logrus.SetLevel(logrus.DebugLevel)
		logrus.SetFormatter(&logrus.JSONFormatter{PrettyPrint: true})
	}

	db, err = NewDatabase()
	if err != nil {
		logrus.WithError(err).Error("error creating database")
		os.Exit(1)
	}

	if cfg.ElasticEnabled {
		es, err = elasticsearch.NewClient(elasticsearch.Config{
			Addresses: []string{
				cfg.ElasticEndpoint,
			},
		})
		if err != nil {
			logrus.WithError(err).Error("error creating elastic search client")
			os.Exit(1)
		}
		res, err := es.Ping()
		if err != nil {
			logrus.WithError(err).Error("error pinging elastic search client")
			os.Exit(1)
		}
		defer res.Body.Close()
		if res.IsError() {
			logrus.WithError(err).Error("error pinging elastic search client")
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

	// TODO: Add automated API tests
	addUserRoutes(mux)
	addProblemRoutes(mux)
	addSubmissionRoutes(mux)
	addLanguageRoutes(mux)
	addCompetitionsRoutes(mux)

	logrus.Info("Starting data layer API")

	addr := ":" + *port
	err = http.ListenAndServe(addr, mux)
	if err != nil {
		logrus.WithError(err).Error("http listener error")
		os.Exit(1)
	}
}

func JSONMiddleware(h http.Handler) http.Handler {
	f := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		h.ServeHTTP(w, r)
	}
	return http.HandlerFunc(f)
}
