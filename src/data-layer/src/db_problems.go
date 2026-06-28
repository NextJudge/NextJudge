package main

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func (d *Database) GetCategories() ([]Category, error) {
	categories := []Category{}
	err := d.NextJudgeDB.Find(&categories).Error
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (d *Database) GetProblemCategories(problemId int) ([]Category, error) {
	categories := []Category{}
	err := d.NextJudgeDB.Model(&ProblemDescriptionExt{ProblemDescription: ProblemDescription{ID: problemId}}).Association("Categories").Find(&categories)
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (d *Database) GetCategoryByID(categoryId uuid.UUID) (*Category, error) {
	category := &Category{}
	err := d.NextJudgeDB.Model(&Category{}).First(category, categoryId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return category, nil
}

func (d *Database) CreateProblemDescription(problem *ProblemDescriptionExt) (*ProblemDescriptionExt, error) {
	err := d.NextJudgeDB.Create(problem).Error
	if err != nil {
		return nil, err
	}
	return problem, nil
}

func (d *Database) UpdateProblemDescription(problem *ProblemDescriptionExt) error {
	err := d.NextJudgeDB.Save(problem).Error
	if err != nil {
		return err
	}
	return nil
}

// func (d *Database) GetProblemDescriptions() ([]ProblemDescription, error) {
// 	problems := []ProblemDescription{}
// 	err := d.NextJudgeDB.Preload("Categories").Find(&problems).Error
// 	if err != nil {
// 		return nil, err
// 	}
// 	return problems, nil
// }

func (d *Database) GetProblemDescriptionByID(problemId int) (*ProblemDescriptionExt, error) {
	problem := &ProblemDescriptionExt{}
	err := d.NextJudgeDB.Preload("Categories").Preload("TestCases").First(problem, problemId).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

// func (d *Database) GetPublicProblemDescriptionByID(problemId int) (*ProblemDescriptionExt, error) {
// 	problem := &ProblemDescriptionExt{}
// 	err := d.NextJudgeDB.Model(&ProblemDescriptionExt{}).Preload("Categories").Preload("TestCases", "hidden = ?", true).First(problem, problemId).Error
// 	if err != nil {
// 		if err == gorm.ErrRecordNotFound {
// 			return nil, nil
// 		}
// 		return nil, err
// 	}
// 	return problem, nil
// }

func (d *Database) GetProblemDescriptionByTitle(title string) (*ProblemDescription, error) {
	problem := &ProblemDescription{}
	err := d.NextJudgeDB.Model(&ProblemDescription{}).Where("title = ?", title).First(problem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

func (d *Database) GetProblemDescriptionByIdentifer(title string) (*ProblemDescription, error) {
	problem := &ProblemDescription{}
	err := d.NextJudgeDB.Model(&ProblemDescription{}).Where("identifier = ?", title).First(problem).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return problem, nil
}

func (d *Database) DeleteProblem(problem *ProblemDescriptionExt) error {
	err := d.NextJudgeDB.Delete(problem).Error
	if err != nil {
		return err
	}
	return nil
}
func (d *Database) GetPublicProblems() ([]GetEventProblemType, error) {
	problemDescriptions := []ProblemDescription{}
	err := d.NextJudgeDB.Where("public = ?", true).Find(&problemDescriptions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	problems := []GetEventProblemType{}

	for _, problemDescription := range problemDescriptions {
		problemData := GetEventProblemType{
			ID: problemDescription.ID,
			// not associated with any specific event
			Title:      problemDescription.Title,
			Prompt:     problemDescription.Prompt,
			Source:     problemDescription.Source,
			Difficulty: problemDescription.Difficulty,
			UserID:     problemDescription.UserID,
			UploadDate: problemDescription.UploadDate,
			UpdatedAt:  problemDescription.UpdatedAt,
			Public:     problemDescription.Public,

			AcceptTimeout:    problemDescription.DefaultAcceptTimeout,
			ExecutionTimeout: problemDescription.DefaultExecutionTimeout,
			MemoryLimit:      problemDescription.DefaultMemoryLimit,
		}
		problems = append(problems, problemData)
	}

	return problems, nil
}

func (d *Database) GetAllProblems() ([]GetEventProblemType, error) {
	problemDescriptions := []ProblemDescription{}
	err := d.NextJudgeDB.Find(&problemDescriptions).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}

	problems := []GetEventProblemType{}

	for _, problemDescription := range problemDescriptions {
		problemData := GetEventProblemType{
			ID: problemDescription.ID,
			// not associated with any specific event
			Title:      problemDescription.Title,
			Prompt:     problemDescription.Prompt,
			Source:     problemDescription.Source,
			Difficulty: problemDescription.Difficulty,
			UserID:     problemDescription.UserID,
			UploadDate: problemDescription.UploadDate,
			UpdatedAt:  problemDescription.UpdatedAt,
			Public:     problemDescription.Public,

			AcceptTimeout:    problemDescription.DefaultAcceptTimeout,
			ExecutionTimeout: problemDescription.DefaultExecutionTimeout,
			MemoryLimit:      problemDescription.DefaultMemoryLimit,
		}
		problems = append(problems, problemData)
	}

	return problems, nil
}
