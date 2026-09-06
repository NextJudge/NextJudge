package main

import (
	_ "embed"
	"strings"

	"github.com/pressly/goose/v3"
	"github.com/sirupsen/logrus"
	"main/migrations"
)

//go:embed init_prod_data.sql
var seedSQLBytes []byte

// RunMigrations applies embedded goose migrations and seeds essential data if needed.
func RunMigrations(database *Database) error {
	sqlDB, err := database.NextJudgeDB.DB()
	if err != nil {
		logrus.WithError(err).Error("failed to get sql.DB from gorm")
		return err
	}

	goose.SetBaseFS(migrations.FS)
	if err := goose.SetDialect("postgres"); err != nil {
		logrus.WithError(err).Error("failed to set goose dialect")
		return err
	}

	logrus.Info("Running goose migrations...")
	if err := goose.Up(sqlDB, "."); err != nil {
		logrus.WithError(err).Error("failed to run goose migrations")
		return err
	}
	logrus.Info("Goose migrations completed successfully")

	var langCount int64
	err = database.NextJudgeDB.Raw("SELECT COUNT(*) FROM languages").Scan(&langCount).Error
	if err != nil {
		logrus.WithError(err).Warn("failed to check languages count, attempting to seed anyway")
		langCount = 0
	}

	if langCount == 0 {
		logrus.Info("No languages found, seeding essential data...")

		if err := database.NextJudgeDB.Exec(string(seedSQLBytes)).Error; err != nil {
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
