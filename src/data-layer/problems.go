package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

// TODO: add PUT endpoints for problems and test cases

func addProblemRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/categories"), getCategories)
	mux.HandleFunc(pat.Post("/v1/problems"), postProblem)
	mux.HandleFunc(pat.Get("/v1/problems"), getProblems)
	mux.HandleFunc(pat.Get("/v1/problems/:problem_id"), getProblem)
	mux.HandleFunc(pat.Delete("/v1/problems/:problem_id"), deleteProblem)
}

type PostProblemRequestBody struct {
	Prompt      string     `json:"prompt"`
	Title       string     `json:"title"`
	Timeout     int        `json:"timeout"`
	Difficulty  Difficulty `json:"difficulty"`
	UserID      int        `json:"user_id"`
	TestCases   []TestCase `json:"test_cases"`
	CategoryIds []int      `json:"category_ids"`
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
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"problem already exists"}`)
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

	esDocument := map[string]string{
		"Title":  dbProblem.Title,
		"Prompt": dbProblem.Prompt,
	}
	doc, err := json.Marshal(esDocument)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	res, err := es.Index(cfg.ElasticIndex, strings.NewReader(string(doc)), es.Index.WithDocumentID(strconv.Itoa(dbProblem.ID)))
	if err != nil {
		logrus.WithError(err).Error("error adding problem")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error adding problem"}`)
		return
	}
	defer res.Body.Close()
	if res.IsError() {
		logrus.WithError(err).Error("error adding problem to elastic index")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error adding problem to elastic index"}`)
		return
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
		logrus.WithError(err).Error("problem id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"problem id must be int"}`)
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

	if query == "" {
		problems, err = db.GetProblems()
		if err != nil {
			logrus.WithError(err).Error("error retrieving problems")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving problems"}`)
			return
		}
	} else {
		esQuery := `
    	{
    	    "query": {
    	        "multi_match": {
    	            "query": "%s",
    	            "fields": ["Title", "Prompt"]
    	        }
    	    }
    	}`
		res, err := es.Search(
			es.Search.WithContext(r.Context()),
			es.Search.WithIndex(cfg.ElasticIndex),
			es.Search.WithBody(strings.NewReader(fmt.Sprintf(esQuery, query))),
		)
		if err != nil {
			logrus.WithError(err).Error("error getting info from elastic search")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error getting info from elastic search"}`)
			return
		}
		defer res.Body.Close()
		if res.IsError() {
			logrus.WithError(err).Error("error getting problems from elastic index")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error adding problems from elastic index"}`)
			return
		}
		var result map[string]interface{}
		err = json.NewDecoder(res.Body).Decode(&result)
		if err != nil {
			logrus.WithError(err).Error("error getting problems from elastic index")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error adding problems from elastic index"}`)
			return
		}
		hits := result["hits"].(map[string]interface{})["hits"].([]interface{})
		for _, hit := range hits {
			doc := hit.(map[string]interface{})
			id, err := strconv.Atoi(doc["_id"].(string))
			if err != nil {
				logrus.WithError(err).Error("error parsing id from elastic index")
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprint(w, `{"code":"500", "message":"error parsing id from elastic index"}`)
				return
			}
			problem, err := db.GetProblemByID(id)
			if err != nil {
				logrus.WithError(err).WithField("problem_id", id).Error("error getting problem")
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprint(w, `{"code":"500", "message":"error getting problem"}`)
				return
			}
			if problem != nil {
				problems = append(problems, *problem)
			}
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
		logrus.WithError(err).Error("problem id must be int")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"500", "message":"problem id must be int"}`)
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

	res, err := es.Delete(cfg.ElasticIndex, strconv.Itoa(problemId))
	defer res.Body.Close()
	if res.IsError() {
		logrus.WithError(err).Error("error deleting problem from elastic search")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"partial success, problem was deleted, error deleting from elastic search"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
