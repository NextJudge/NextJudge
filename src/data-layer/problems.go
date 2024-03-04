package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

// TODO: add PUT endpoints for problems and test cases

func addProblemRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/problems"), postProblem)
	mux.HandleFunc(pat.Get("/v1/problems"), getProblems)
	mux.HandleFunc(pat.Get("/v1/problems/:problem_id"), getProblem)
}

// TODO: get user id from jwt, check for existing user
// TODO: make a transaction so the problem cant be inserted if the test cases fail to inser
func postProblem(w http.ResponseWriter, r *http.Request) {
	reqData := new(Problem)
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
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"user does not exist"}`)
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

	newProblem, err := db.CreateProblem(reqData)
	if err != nil {
		logrus.WithError(err).Error("error inserting problem into db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error inserting problem into db"}`)
		return
	}

	for i, testCase := range reqData.TestCases {
		res, err := db.CreateTestcase(&testCase, reqData.ID)
		if err != nil {
			logrus.WithError(err).Error("error inserting testcase into db")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error inserting testcase into db"}`)
			return
		}
		newProblem.TestCases[i].ID = res.ID
	}

	respJSON, err := json.Marshal(newProblem)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
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

	testCases, err := db.GetTestCases(problemId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving test cases")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving test cases"}`)
		return
	}

	problem.TestCases = append(problem.TestCases, testCases...)

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
	problems, err := db.GetProblems()
	if err != nil {
		logrus.WithError(err).Error("error retrieving problems")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving problems"}`)
		return
	}
	for i, problem := range problems {
		testCases, err := db.GetTestCases(problem.ID)
		if err != nil {
			logrus.WithError(err).Error("error retrieving test cases")
			w.WriteHeader(http.StatusInternalServerError)
			fmt.Fprint(w, `{"code":"500", "message":"error retrieving test cases"}`)
			return
		}

		problems[i].TestCases = append(problems[i].TestCases, testCases...)
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
