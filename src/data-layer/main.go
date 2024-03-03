package main

import (
	"flag"
	"net/http"
	"os"

	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"goji.io"
)

var (
	db *Database
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

	mux := goji.NewMux()
	c := cors.New(cors.Options{
		AllowedOrigins: cfg.CORSOrigin,
		AllowedHeaders: []string{"Content-Type", "Authorization"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		MaxAge:         3600,
	})
	mux.Use(c.Handler)

	// TODO: Add automated API tests
	addUserRoutes(mux)
	addProblemRoutes(mux)
	addSubmissionRoutes(mux)
	addLanguageRoutes(mux)

	addr := ":" + *port
	err = http.ListenAndServe(addr, mux)
	if err != nil {
		logrus.WithError(err).Error("http listener error")
		os.Exit(1)
	}
}
