package main

import (
	"fmt"
	"strconv"

	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	NextJudgeDB *gorm.DB
}

func NewDatabase() (*Database, error) {
	dataSource := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s", cfg.Host, strconv.FormatInt(cfg.Port, 10), cfg.Username, cfg.Password, cfg.DBName)
	db, err := gorm.Open(
		postgres.Open(dataSource),
		&gorm.Config{
			Logger: logger.Default.LogMode(logger.Error),
		},
	)
	if err != nil {
		return nil, err
	}

	nextjudgeDB := &Database{NextJudgeDB: db}

	return nextjudgeDB, nil
}
