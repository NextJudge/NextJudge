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
// NOTE: When adding a new table to nextjudge.sql, you MUST add it to the expectedTables list below.
func RunMigrations(database *Database) error {
	// List of all expected tables in the schema
	// IMPORTANT: Keep this list in sync with tables defined in nextjudge.sql
	expectedTables := []string{
		"users",
		"problem_descriptions",
		"submissions",
		"submission_test_case_results",
		"test_cases",
		"languages",
		"categories",
		"problem_categories",
		"events",
		"event_problems",
		"event_problem_languages",
		"event_users",
		"event_teams",
		"event_questions",
		"notifications",
		"group",
		"event_group",
		"event_problem_id_max_problem_ids",
	}

	// Check which tables are missing
	var missingTables []string
	for _, tableName := range expectedTables {
		var count int64
		// Table names are from a controlled list, so safe to use in query
		query := "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '" + tableName + "'"
		err := database.NextJudgeDB.Raw(query).Scan(&count).Error
		if err != nil {
			logrus.WithError(err).WithField("table", tableName).Warn("error checking table existence")
			continue
		}
		if count == 0 {
			missingTables = append(missingTables, tableName)
		}
	}

	if len(missingTables) > 0 {
		logrus.WithField("missing_tables", missingTables).Info("Missing tables detected, running schema migration...")

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
		logrus.Info("All expected tables exist, skipping schema migration")
	}

	// check if languages are seeded
	var langCount int64
	err := database.NextJudgeDB.Raw("SELECT COUNT(*) FROM languages").Scan(&langCount).Error
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
