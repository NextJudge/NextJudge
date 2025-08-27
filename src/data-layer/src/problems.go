package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

// TODO: add PUT endpoints for problems and test cases

func addProblemRoutes(mux *goji.Mux) {
	// Upload a problem description
	mux.HandleFunc(pat.Post("/v1/problems"), AdminRequired(postProblem))
	// Get problems - public only for users, all for admins
	mux.HandleFunc(pat.Get("/v1/problems"), AuthRequired(getGeneralProblems))
	mux.HandleFunc(pat.Put("/v1/problems/:problem_id"), AdminRequired(putProblem))
	mux.HandleFunc(pat.Put("/v1/admin/problems/:problem_id/toggle-visibility"), AdminRequired(toggleProblemVisibility))

	// problem_id here is event problem id
	mux.HandleFunc(pat.Get("/v1/problems/:problem_id"), AuthRequired(getPublicProblemData))

	mux.HandleFunc(pat.Delete("/v1/problems/:problem_description_id"), AdminRequired(deleteProblem))
	mux.HandleFunc(pat.Get("/v1/problem_description/:problem_description_id/tests"), AtLeastJudgeRequired(getProblemTestData))

	mux.HandleFunc(pat.Get("/v1/categories"), AuthRequired(getCategories))
	mux.HandleFunc(pat.Get("/v1/categories/:problem_id"), AuthRequired(getProblemCategories))
}

type PostProblemRequestBody struct {
	Title            string      `json:"title"`
	Identifier       string      `json:"identifier"`
	Prompt           string      `json:"prompt"`
	Source           string      `json:"source"`
	Difficulty       Difficulty  `json:"difficulty"`
	Timeout          float64     `json:"timeout"` // default timeout, used if ones below not provided
	AcceptTimeout    *float64    `json:"accept_timeout"`
	ExecutionTimeout *float64    `json:"execution_timeout"`
	MemoryLimit      *int        `json:"memory_limit"`
	UserID           uuid.UUID   `json:"user_id"`
	TestCases        []TestCase  `json:"test_cases"`
	CategoryIds      []uuid.UUID `json:"category_ids"`
	// Do we create a global EventProblem for this upload?
	Public bool `json:"public"`
}

type PostProblemReturnBody struct {
	ID             int `json:"id"`
	EventProblemID int `json:"event_problem_id,omitempty"`
}

func postProblem(w http.ResponseWriter, r *http.Request) {
	reqData := new(PostProblemRequestBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	user, err := db.GetUserByID(reqData.UserID)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user == nil {
		logrus.Warn("user does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user does not exist"}`)
		return
	}

	// problem, err := db.GetProblemDescriptionByTitle(reqData.Title)
	// if err != nil {
	// 	logrus.WithError(err).Error("error checking for existing problem")
	// 	w.WriteHeader(http.StatusInternalServerError)
	// 	fmt.Fprint(w, `{"code":"500", "message":"error checking for existing problem"}`)
	// 	return
	// }
	// if problem != nil {
	// 	logrus.Warn("problem already exists")
	// 	w.WriteHeader(http.StatusConflict)
	// 	fmt.Fprintf(w, `{"code":"409", "message":"problem already exists", "id":%d}`, problem.ID)
	// 	return
	// }

	if reqData.Identifier == "" {
		logrus.Warn("identifier is empty")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"identifier is empty"}`)
		return
	}

	problem, err := db.GetProblemDescriptionByIdentifer(reqData.Identifier)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing problem with identifier")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing problem"}`)
		return
	}
	if problem != nil {
		logrus.Warn("problem already exists")
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintf(w, `{"code":"409", "message":"problem already exists", "id":%d}`, problem.ID)
		return
	}

	// set default values and use provided values if available
	acceptTimeout := reqData.Timeout
	if reqData.AcceptTimeout != nil {
		acceptTimeout = *reqData.AcceptTimeout
	}

	executionTimeout := reqData.Timeout
	if reqData.ExecutionTimeout != nil {
		executionTimeout = *reqData.ExecutionTimeout
	}

	memoryLimit := 256 // Default 256MB
	if reqData.MemoryLimit != nil {
		memoryLimit = *reqData.MemoryLimit
	}

	now := time.Now()
	newProblem := &ProblemDescriptionExt{
		ProblemDescription: ProblemDescription{
			Title:                   reqData.Title,
			Identifier:              reqData.Identifier,
			Prompt:                  reqData.Prompt,
			Source:                  reqData.Source,
			Difficulty:              reqData.Difficulty,
			UserID:                  reqData.UserID,
			UploadDate:              now,
			UpdatedAt:               now,
			DefaultAcceptTimeout:    acceptTimeout,
			DefaultExecutionTimeout: executionTimeout,
			DefaultMemoryLimit:      memoryLimit,
			Public:                  reqData.Public,
		},
		TestCases:  reqData.TestCases,
		Categories: []Category{},
	}

	for _, categoryId := range reqData.CategoryIds {
		category, err := db.GetCategoryByID(categoryId)
		if err != nil {
			logrus.WithError(err).Error("error checking for category")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for category"}`)
			return
		}

		if category == nil {
			logrus.Warn("category not found")
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, `{"code":"404", "message":"category not found"}`)
			return
		}

		newProblem.Categories = append(newProblem.Categories, *category)
	}

	dbProblem, err := db.CreateProblemDescription(newProblem)
	if err != nil {
		logrus.WithError(err).Error("error inserting problem into db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting problem into db"}`)
		return
	}

	// id 0 means not tied to an event
	eventProblemID := 0

	returnJSONStruct := PostProblemReturnBody{
		ID:             dbProblem.ID,
		EventProblemID: eventProblemID,
	}

	respJSON, err := json.Marshal(returnJSONStruct)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func putProblem(w http.ResponseWriter, r *http.Request) {
	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad id"}`)
		return
	}

	reqData := new(PostProblemRequestBody)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error reading request body"}`)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	// verify the problem exists
	existingProblem, err := db.GetProblemDescriptionByID(problemId)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing problem"}`)
		return
	}
	if existingProblem == nil {
		logrus.Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	// verify user exists
	user, err := db.GetUserByID(reqData.UserID)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing user")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing user"}`)
		return
	}
	if user == nil {
		logrus.Warn("user does not exist")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"user does not exist"}`)
		return
	}

	if reqData.Identifier == "" {
		logrus.Warn("identifier is empty")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"identifier is empty"}`)
		return
	}

	// check if identifier conflicts with another problem (excluding current one)
	conflictProblem, err := db.GetProblemDescriptionByIdentifer(reqData.Identifier)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing problem with identifier")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing problem"}`)
		return
	}
	if conflictProblem != nil && conflictProblem.ID != problemId {
		logrus.Warn("problem identifier already exists")
		w.WriteHeader(http.StatusConflict)
		fmt.Fprintf(w, `{"code":"409", "message":"problem identifier already exists", "id":%d}`, conflictProblem.ID)
		return
	}

	// set default values and use provided values if available
	acceptTimeout := reqData.Timeout
	if reqData.AcceptTimeout != nil {
		acceptTimeout = *reqData.AcceptTimeout
	}

	executionTimeout := reqData.Timeout
	if reqData.ExecutionTimeout != nil {
		executionTimeout = *reqData.ExecutionTimeout
	}

	memoryLimit := 256 // Default 256MB
	if reqData.MemoryLimit != nil {
		memoryLimit = *reqData.MemoryLimit
	}

	// update the problem fields
	existingProblem.Title = reqData.Title
	existingProblem.Identifier = reqData.Identifier
	existingProblem.Prompt = reqData.Prompt
	existingProblem.Source = reqData.Source
	existingProblem.Difficulty = reqData.Difficulty
	existingProblem.UserID = reqData.UserID
	existingProblem.DefaultAcceptTimeout = acceptTimeout
	existingProblem.DefaultExecutionTimeout = executionTimeout
	existingProblem.DefaultMemoryLimit = memoryLimit
	existingProblem.Public = reqData.Public
	existingProblem.UpdatedAt = time.Now()

	// clear existing test cases and categories to replace with new ones
	err = db.NextJudgeDB.Where("problem_id = ?", problemId).Delete(&TestCase{}).Error
	if err != nil {
		logrus.WithError(err).Error("error clearing existing test cases")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error clearing existing test cases"}`)
		return
	}

	err = db.NextJudgeDB.Model(existingProblem).Association("Categories").Clear()
	if err != nil {
		logrus.WithError(err).Error("error clearing existing categories")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error clearing existing categories"}`)
		return
	}

	// set new test cases
	existingProblem.TestCases = reqData.TestCases
	for i := range existingProblem.TestCases {
		existingProblem.TestCases[i].ProblemID = problemId
	}

	// set new categories
	existingProblem.Categories = []Category{}
	for _, categoryId := range reqData.CategoryIds {
		category, err := db.GetCategoryByID(categoryId)
		if err != nil {
			logrus.WithError(err).Error("error checking for category")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error checking for category"}`)
			return
		}

		if category == nil {
			logrus.Warn("category not found")
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprint(w, `{"code":"404", "message":"category not found"}`)
			return
		}

		existingProblem.Categories = append(existingProblem.Categories, *category)
	}

	// save the updated problem
	err = db.UpdateProblemDescription(existingProblem)
	if err != nil {
		logrus.WithError(err).Error("error updating problem in db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating problem in db"}`)
		return
	}

	returnJSONStruct := PostProblemReturnBody{
		ID:             existingProblem.ID,
		EventProblemID: 0, // not tied to events
	}

	respJSON, err := json.Marshal(returnJSONStruct)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, string(respJSON))
}

// Users call this to get more fine-grained info on a problem, including public tests
func getPublicProblemData(w http.ResponseWriter, r *http.Request) {
	// TODO FIX
	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad id"}`)
		return
	}

	problemExt, err := db.GetProblemDescriptionByID(problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
		return
	}
	if problemExt == nil {
		logrus.Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	// Filter test cases to only include public ones
	var publicTests []TestCase
	for _, testCase := range problemExt.TestCases {
		if !testCase.Hidden {
			publicTests = append(publicTests, testCase)
		}
	}

	// Convert ProblemDescriptionExt to the format expected by frontend
	problem := GetEventProblemType{
		ID:               problemExt.ID,
		EventID:          0, // Not tied to a specific event
		Title:            problemExt.Title,
		Prompt:           problemExt.Prompt,
		Source:           problemExt.Source,
		Difficulty:       problemExt.Difficulty,
		UserID:           problemExt.UserID,
		UploadDate:       problemExt.UploadDate,
		UpdatedAt:        problemExt.UpdatedAt,
		Public:           problemExt.Public,
		AcceptTimeout:    problemExt.DefaultAcceptTimeout,
		ExecutionTimeout: problemExt.DefaultExecutionTimeout,
		MemoryLimit:      problemExt.DefaultMemoryLimit,
		Tests:            publicTests,
	}

	respJSON, err := json.Marshal(problem)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

// Judge calls this to get test data
// TODO: REVISIT THIS: should it return ProblemDescription or EventProblem?
func getProblemTestData(w http.ResponseWriter, r *http.Request) {
	problemIdParam := pat.Param(r, "problem_description_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad id"}`)
		return
	}

	problem, err := db.GetProblemDescriptionByID(problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
		return
	}
	if problem == nil {
		logrus.Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	respJSON, err := json.Marshal(problem)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func getGeneralProblems(w http.ResponseWriter, r *http.Request) {
	// Get user role from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok {
		logrus.Error("Error in token")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}
	if token == nil {
		logrus.Error("Token is nil")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"message":"Error in token"}`)
		return
	}

	var problems []GetEventProblemType
	var err error

	// Admins get all problems, regular users get only public problems
	if token.Role == AdminRoleEnum {
		problems, err = db.GetAllProblems()
		if err != nil {
			logrus.WithError(err).Error("error retrieving admin problems")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving admin problems"}`)
			return
		}
	} else {
		problems, err = db.GetPublicProblems()
		if err != nil {
			logrus.WithError(err).Error("error retrieving problems")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problems"}`)
			return
		}
	}

	respJSON, err := json.Marshal(problems)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func toggleProblemVisibility(w http.ResponseWriter, r *http.Request) {
	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad id")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad id"}`)
		return
	}

	problem, err := db.GetProblemDescriptionByID(problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
		return
	}
	if problem == nil {
		logrus.Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	// Toggle the public status
	problem.Public = !problem.Public

	err = db.UpdateProblemDescription(problem)
	if err != nil {
		logrus.WithError(err).Error("error updating problem visibility")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error updating problem visibility"}`)
		return
	}

	// Return the updated problem data
	problemData := GetEventProblemType{
		ID:            problem.ID,
		EventID:       0, // Not tied to a specific event
		Title:         problem.Title,
		Prompt:        problem.Prompt,
		Source:        problem.Source,
		Difficulty:    problem.Difficulty,
		UserID:        problem.UserID,
		UploadDate:    problem.UploadDate,
		UpdatedAt:     problem.UpdatedAt,
		Public:        problem.Public,
		AcceptTimeout: problem.DefaultAcceptTimeout,
		MemoryLimit:   problem.DefaultMemoryLimit,
	}

	respJSON, err := json.Marshal(problemData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func deleteProblem(w http.ResponseWriter, r *http.Request) {
	problemIdParam := pat.Param(r, "problem_description_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	problem, err := db.GetProblemDescriptionByID(problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
		return
	}
	if problem == nil {
		logrus.WithError(err).Warn("problem not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"problem not found"}`)
		return
	}

	err = db.DeleteProblem(problem)
	if err != nil {
		logrus.WithError(err).Error("error deleting problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error deleting problem"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func getCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := db.GetCategories()
	if err != nil {
		logrus.WithError(err).Error("error retrieving categories")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving categories"}`)
		return
	}

	respJSON, err := json.Marshal(categories)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func getProblemCategories(w http.ResponseWriter, r *http.Request) {
	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	categories, err := db.GetProblemCategories(problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving categories")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving categories"}`)
		return
	}

	respJSON, err := json.Marshal(categories)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}
