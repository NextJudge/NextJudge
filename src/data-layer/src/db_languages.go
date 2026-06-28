package main

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Database) CreateLanguage(language *Language) (*Language, error) {
	err := d.NextJudgeDB.Create(language).Error
	if err != nil {
		return nil, err
	}
	return language, nil
}

func (d *Database) GetLanguages() ([]Language, error) {
	languages := []Language{}
	err := d.NextJudgeDB.Find(&languages).Error
	if err != nil {
		return nil, err
	}
	return languages, nil
}

func (d *Database) GetLanguageByNameAndVersion(name string, version string) (*Language, error) {
	language := &Language{}
	err := d.NextJudgeDB.Where("name = ? AND version = ?", name, version).First(language).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return language, nil
}

func (d *Database) GetLanguage(id uuid.UUID) (*Language, error) {
	language := &Language{}
	err := d.NextJudgeDB.First(language, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return language, nil
}

func (d *Database) DeleteLanguage(language *Language) error {
	err := d.NextJudgeDB.Delete(language).Error
	if err != nil {
		return err
	}
	return nil
}

func (d *Database) GetTestCase(testcaseId uuid.UUID) (*TestCase, error) {
	testCase := &TestCase{}
	err := d.NextJudgeDB.First(testCase, testcaseId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return testCase, nil
}
