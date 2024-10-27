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
	mux.HandleFunc(pat.Get("/v1/categories"), AuthRequired(getCategories))
	mux.HandleFunc(pat.Get("/v1/categories/:problem_id"), AuthRequired(getProblemCategories))
	mux.HandleFunc(pat.Post("/v1/problems"), AdminRequired(postProblem))
	mux.HandleFunc(pat.Get("/v1/problems"), AuthRequired(getProblems))
	mux.HandleFunc(pat.Get("/v1/problems/:problem_id"), AuthRequired(getProblem))
	mux.HandleFunc(pat.Delete("/v1/problems/:problem_id"), AdminRequired(deleteProblem))
}

type PostProblemRequestBody struct {
	Prompt      string      `json:"prompt"`
	Title       string      `json:"title"`
	Timeout     int         `json:"timeout"`
	Difficulty  Difficulty  `json:"difficulty"`
	UserID      uuid.UUID   `json:"user_id"`
	TestCases   []TestCase  `json:"test_cases"`
	CategoryIds []uuid.UUID `json:"category_ids"`
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

	problem, err := db.GetProblemByTitle(reqData.Title)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing problem")
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

	newProblem := &Problem{
		Prompt:     reqData.Prompt,
		Title:      reqData.Title,
		Timeout:    reqData.Timeout,
		Difficulty: reqData.Difficulty,
		UserID:     reqData.UserID,
		TestCases:  reqData.TestCases,
		UploadDate: time.Now(),
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

	dbProblem, err := db.CreateProblem(newProblem)
	if err != nil {
		logrus.WithError(err).Error("error inserting problem into db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting problem into db"}`)
		return
	}

	if cfg.ElasticEnabled {
		err = es.IndexProblem(dbProblem)
		if err != nil {
			logrus.WithError(err).Error("error adding problem to elastic search")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"partial creation, problem not added to elastic search"}`)
			return
		}
	}

	respJSON, err := json.Marshal(dbProblem)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func getProblem(w http.ResponseWriter, r *http.Request) {
	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}
	problem := &Problem{}
	query := r.URL.Query().Get("type")
	if query == "private" {
		problem, err = db.GetProblemByID(problemId)
		if err != nil {
			logrus.WithError(err).Error("error retrieving problem")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
			return
		}
	} else {
		problem, err = db.GetPublicProblemByID(problemId)
		if err != nil {
			logrus.WithError(err).Error("error retrieving problem")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problem"}`)
			return
		}
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

func getProblems(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	problems := []Problem{}
	var err error

	if query == "" || !cfg.ElasticEnabled {
		problems, err = db.GetProblems()
		if err != nil {
			logrus.WithError(err).Error("error retrieving problems")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problems"}`)
			return
		}
	} else {
		problems, err = es.SearchProblems(r.Context(), query)
		if err != nil {
			logrus.WithError(err).Error("error retrieving problems from es")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problems from es"}`)
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

func deleteProblem(w http.ResponseWriter, r *http.Request) {
	problemIdParam := pat.Param(r, "problem_id")
	problemId, err := strconv.Atoi(problemIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	problem, err := db.GetProblemByID(problemId)
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
