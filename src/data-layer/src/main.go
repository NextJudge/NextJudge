package main

import (
	"flag"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"time"

	"github.com/rs/cors"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

var db *Database
var es *ElasticSearch

var previewOriginPattern = regexp.MustCompile(`^[0-9]+-(web|docs)\.preview\.nextjudge\.net$`)

func main() {
	initAuthRateLimiter()

	var debug = flag.Bool("d", false, "enable debug logging")
	var port = flag.String("p", "5000", "port")
	var healthcheck = flag.Bool("healthcheck", false, "check HTTP health endpoint and exit")
	flag.Parse()

	if *healthcheck {
		runHealthcheck(*port)
	}

	var err error

	if *debug {
		logrus.SetLevel(logrus.DebugLevel)
		logrus.SetFormatter(&logrus.JSONFormatter{PrettyPrint: true})
	}

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

	StartEnqueueReaper()

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
		AllowOriginFunc:  originAllowed,
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowCredentials: true,
		MaxAge:           3600,
	})

	mux.Use(JSONMiddleware)
	mux.Use(LimitRequestBodyMiddleware)
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

func originAllowed(origin string) bool {
	for _, allowed := range cfg.CORSOrigin {
		if allowed == "*" || allowed == origin {
			return true
		}
	}

	if !cfg.CORSAllowPreview {
		return false
	}

	u, err := url.Parse(origin)
	if err != nil || u.Scheme != "https" {
		return false
	}

	return previewOriginPattern.MatchString(u.Hostname())
}

func runHealthcheck(port string) {
	client := http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/health")
	if err != nil {
		os.Exit(1)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		os.Exit(1)
	}
	os.Exit(0)
}

func addHealthyRoute(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/"), getRoot)
	mux.HandleFunc(pat.Get("/health"), getHealthy)
	mux.HandleFunc(pat.Get("/healthy"), getHealthy)
}

func getRoot(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"status":"ok","service":"nextjudge-data-layer","health":"/health","api":"/v1"}`)
}

func getHealthy(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"status":"ok"}`)
}

func JSONMiddleware(h http.Handler) http.Handler {
	f := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		h.ServeHTTP(w, r)
	}
	return http.HandlerFunc(f)
}
