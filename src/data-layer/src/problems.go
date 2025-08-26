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
	// Get event problems related to the default event
	mux.HandleFunc(pat.Get("/v1/problems"), AuthRequired(getGeneralProblems))

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
	Timeout          float64     `json:"timeout"` // default timeout, used if specific ones not provided
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

	newProblem := &ProblemDescriptionExt{
		ProblemDescription: ProblemDescription{
			Title:                   reqData.Title,
			Identifier:              reqData.Identifier,
			Prompt:                  reqData.Prompt,
			Source:                  reqData.Source,
			Difficulty:              reqData.Difficulty,
			UserID:                  reqData.UserID,
			UploadDate:              time.Now(),
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

	// Remove automatic event creation - problems are now independent entities
	eventProblemID := 0

	// if cfg.ElasticEnabled {
	// 	err = es.IndexProblem(dbProblem)
	// 	if err != nil {
	// 		logrus.WithError(err).Error("error adding problem to elastic search")
	// 		w.WriteHeader(http.StatusInternalServerError)
	// 		fmt.Fprint(w, `{"code":"500", "message":"partial creation, problem not added to elastic search"}`)
	// 		return
	// 	}
	// }

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
		ID:            problemExt.ID,
		EventID:       0, // Not tied to a specific event
		Title:         problemExt.Title,
		Prompt:        problemExt.Prompt,
		Source:        problemExt.Source,
		Difficulty:    problemExt.Difficulty,
		UserID:        problemExt.UserID,
		UploadDate:    problemExt.UploadDate,
		AcceptTimeout: problemExt.DefaultAcceptTimeout,
		MemoryLimit:   problemExt.DefaultMemoryLimit,
		Tests:         publicTests,
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
	query := r.URL.Query().Get("query")
	problems := []GetEventProblemType{}
	var err error

	if query == "" || !cfg.ElasticEnabled {
		problems, err = db.GetPublicProblems()
		if err != nil {
			logrus.WithError(err).Error("error retrieving problems")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problems"}`)
			return
		}
	} else {
		// problems, err = es.SearchProblems(r.Context(), query)
		// if err != nil {
		// 	logrus.WithError(err).Error("error retrieving problems from es")
		// 	w.WriteHeader(http.StatusInternalServerError)
		// 	fmt.Fprint(w, `{"code":"500", "message":"error retrieving problems from es"}`)
		// 	return
		// }
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

	if cfg.ElasticEnabled {
		err = es.DeleteProblem(problemIdParam)
		if err != nil {
			logrus.WithError(err).Error("error deleting problem from elastic search")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"partial deletion, error deleting problem from elastic search"}`)
			return
		}
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
