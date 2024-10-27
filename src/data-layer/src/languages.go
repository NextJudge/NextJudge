package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

func addLanguageRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/languages"), AdminRequired(postLanguage))
	mux.HandleFunc(pat.Get("/v1/languages"), getLanguages)
	mux.HandleFunc(pat.Delete("/v1/languages/:language_id"), AdminRequired(deleteLanguage))
}

func postLanguage(w http.ResponseWriter, r *http.Request) {
	reqData := new(Language)
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

	existingLanguage, err := db.GetLanguageByNameAndVersion(reqData.Name, reqData.Version)
	if err != nil {
		logrus.WithError(err).Error("error checking for existing language")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error checking for existing language"}`)
		return
	}
	if existingLanguage != nil {
		logrus.Warn("language already exists")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"language already exists"}`)
		return
	}

	newLang, err := db.CreateLanguage(reqData)
	if err != nil {
		logrus.WithError(err).Error("error creating language")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error creating language"}`)
		return
	}

	respJSON, err := json.Marshal(newLang)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, string(respJSON))
}

func getLanguages(w http.ResponseWriter, r *http.Request) {
	languages, err := db.GetLanguages()
	if err != nil {
		logrus.WithError(err).Error("error getting languages from the db")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error getting languages from the db"}`)
		return
	}
	respJSON, err := json.Marshal(languages)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}
	fmt.Fprint(w, string(respJSON))
}

func deleteLanguage(w http.ResponseWriter, r *http.Request) {
	languageIdParam := pat.Param(r, "language_id")
	languageId, err := uuid.Parse(languageIdParam)
	if err != nil {
		logrus.Warn("bad uuid")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"bad uuid"}`)
		return
	}

	language, err := db.GetLanguage(languageId)
	if err != nil {
		logrus.WithError(err).Error("error retrieving language")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error retrieving language"}`)
		return
	}
	if language == nil {
		logrus.WithError(err).Warn("language not found")
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprint(w, `{"code":"404", "message":"language not found"}`)
		return
	}

	err = db.DeleteLanguage(language)
	if err != nil {
		logrus.WithError(err).Error("error deleting language")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"error deleting language"}`)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
