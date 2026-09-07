package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/pressly/goose/v3"
	"github.com/sirupsen/logrus"
)

type legacyMigrationMarker struct {
	version       int64
	table         string
	columnTable   string
	columnName    string
}

var legacyMigrationMarkers = []legacyMigrationMarker{
	{version: 9, table: "api_tokens"},
	{version: 8, table: "organizations"},
	{version: 7, table: "community_solutions"},
	{version: 6, columnTable: "users", columnName: "handle"},
	{version: 5, table: "event_roles"},
	{version: 4, table: "problem_revisions"},
	{version: 3, table: "submission_runs"},
	{version: 2, table: "password_reset_tokens"},
	{version: 1, table: "users"},
}

func bootstrapLegacyGooseVersion(database *Database, sqlDB *sql.DB) error {
	currentVersion, err := goose.EnsureDBVersion(sqlDB)
	if err != nil && !errors.Is(err, goose.ErrNoNextVersion) {
		return err
	}
	if currentVersion > 0 {
		return nil
	}

	hasUsers, err := tableExists(database, "users")
	if err != nil {
		return err
	}
	if !hasUsers {
		return nil
	}

	legacyVersion, err := detectLegacyGooseVersion(database)
	if err != nil {
		return err
	}

	logrus.WithField("legacy_version", legacyVersion).Info("bootstrapping goose version for legacy database")
	return stampGooseVersion(sqlDB, legacyVersion)
}

func detectLegacyGooseVersion(database *Database) (int64, error) {
	for _, marker := range legacyMigrationMarkers {
		switch {
		case marker.table != "":
			exists, err := tableExists(database, marker.table)
			if err != nil {
				return 0, err
			}
			if exists {
				return marker.version, nil
			}
		case marker.columnTable != "" && marker.columnName != "":
			exists, err := columnExists(database, marker.columnTable, marker.columnName)
			if err != nil {
				return 0, err
			}
			if exists {
				return marker.version, nil
			}
		}
	}

	return 0, fmt.Errorf("legacy database detected but no goose migration markers matched")
}

func stampGooseVersion(sqlDB *sql.DB, version int64) error {
	if version <= 0 {
		return fmt.Errorf("invalid goose version %d", version)
	}

	ctx := context.Background()
	tx, err := sqlDB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	query := fmt.Sprintf(
		"INSERT INTO %s (version_id, is_applied) VALUES ($1, true)",
		goose.TableName(),
	)
	for v := int64(1); v <= version; v++ {
		if _, err := tx.ExecContext(ctx, query, v); err != nil {
			_ = tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func tableExists(database *Database, tableName string) (bool, error) {
	var count int64
	err := database.NextJudgeDB.
		Raw(
			"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ?",
			tableName,
		).
		Scan(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func columnExists(database *Database, tableName string, columnName string) (bool, error) {
	var count int64
	err := database.NextJudgeDB.
		Raw(
			"SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ? AND column_name = ?",
			tableName,
			columnName,
		).
		Scan(&count).Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
