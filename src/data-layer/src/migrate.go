package main

import (
	_ "embed"
	"strings"

	"github.com/sirupsen/logrus"
)

//go:embed nextjudge.sql
var schemaSQL string

//go:embed init_prod_data.sql
var seedSQL string

// RunMigrations checks if the database schema exists and creates it if not.
// It also seeds essential data (languages, categories) if they don't exist.
func RunMigrations(database *Database) error {
	// check if tables exist by trying to query the languages table
	var count int64
	err := database.NextJudgeDB.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'languages'").Scan(&count).Error
	if err != nil {
		return err
	}

	if count == 0 {
		logrus.Info("Database tables not found, running schema migration...")

		// run schema SQL
		if err := database.NextJudgeDB.Exec(schemaSQL).Error; err != nil {
			// handle "already exists" errors gracefully
			if !strings.Contains(err.Error(), "already exists") {
				logrus.WithError(err).Error("failed to run schema migration")
				return err
			}
			logrus.Warn("some schema objects already exist, continuing...")
		}

		logrus.Info("Schema migration completed successfully")
	} else {
		logrus.Info("Database tables already exist, skipping schema migration")
	}

	// check if languages are seeded
	var langCount int64
	err = database.NextJudgeDB.Raw("SELECT COUNT(*) FROM languages").Scan(&langCount).Error
	if err != nil {
		logrus.WithError(err).Warn("failed to check languages count, attempting to seed anyway")
		langCount = 0
	}

	if langCount == 0 {
		logrus.Info("No languages found, seeding essential data...")

		if err := database.NextJudgeDB.Exec(seedSQL).Error; err != nil {
			// handle "already exists" / duplicate key errors gracefully
			if !strings.Contains(err.Error(), "duplicate key") && !strings.Contains(err.Error(), "already exists") {
				logrus.WithError(err).Error("failed to seed essential data")
				return err
			}
			logrus.Warn("some seed data already exists, continuing...")
		}

		logrus.Info("Essential data seeded successfully")
	} else {
		logrus.Infof("Found %d languages, skipping essential data seeding", langCount)
	}

	return nil
}

