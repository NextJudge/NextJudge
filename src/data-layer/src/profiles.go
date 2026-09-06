package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"

	"main/src/api"
)

func addProfileRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Get("/v1/profiles/:handle"), getPublicProfile)
}

func getPublicProfile(w http.ResponseWriter, r *http.Request) {
	handle := pat.Param(r, "handle")
	if handle == "" {
		api.WriteAPIError(w, r, http.StatusBadRequest, "INVALID_HANDLE", "handle is required", nil)
		return
	}

	profile, err := db.GetPublicProfileByHandle(handle)
	if err != nil {
		logrus.WithError(err).Error("error retrieving public profile")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "error retrieving profile", nil)
		return
	}
	if profile == nil {
		api.WriteAPIError(w, r, http.StatusNotFound, "PROFILE_NOT_FOUND", "profile not found", nil)
		return
	}

	respJSON, err := json.Marshal(profile)
	if err != nil {
		logrus.WithError(err).Error("JSON marshal error")
		api.WriteAPIError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "JSON marshal error", nil)
		return
	}

	fmt.Fprint(w, string(respJSON))
}
