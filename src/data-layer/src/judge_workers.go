package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
	"goji.io"
	"goji.io/pat"
)

type JudgeWorkerHeartbeatRequest struct {
	WorkerID string `json:"worker_id"`
	Hostname string `json:"hostname"`
}

type JudgeWorkerStatus struct {
	WorkerID string    `json:"worker_id"`
	Hostname string    `json:"hostname"`
	LastSeen time.Time `json:"last_seen"`
}

var (
	judgeWorkersMu sync.RWMutex
	judgeWorkers   = map[string]JudgeWorkerStatus{}
)

func addJudgeWorkerRoutes(mux *goji.Mux) {
	mux.HandleFunc(pat.Post("/v1/judge_workers/heartbeat"), AtLeastJudgeRequired(postJudgeWorkerHeartbeat))
	mux.HandleFunc(pat.Get("/v1/judge_workers"), AdminRequired(getJudgeWorkers))
}

func postJudgeWorkerHeartbeat(w http.ResponseWriter, r *http.Request) {
	reqData := new(JudgeWorkerHeartbeatRequest)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading judge worker heartbeat body")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"error reading request body"}`)
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("error parsing judge worker heartbeat body")
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"invalid request body"}`)
		return
	}

	if reqData.WorkerID == "" {
		w.WriteHeader(http.StatusBadRequest)
		fmt.Fprint(w, `{"code":"400", "message":"worker_id is required"}`)
		return
	}

	hostname := reqData.Hostname
	if hostname == "" {
		hostname = reqData.WorkerID
	}

	judgeWorkersMu.Lock()
	judgeWorkers[reqData.WorkerID] = JudgeWorkerStatus{
		WorkerID: reqData.WorkerID,
		Hostname: hostname,
		LastSeen: time.Now().UTC(),
	}
	judgeWorkersMu.Unlock()

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, `{"status":"ok"}`)
}

func getJudgeWorkers(w http.ResponseWriter, r *http.Request) {
	judgeWorkersMu.RLock()
	workers := make([]JudgeWorkerStatus, 0, len(judgeWorkers))
	for _, worker := range judgeWorkers {
		workers = append(workers, worker)
	}
	judgeWorkersMu.RUnlock()

	respJSON, err := json.Marshal(workers)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		w.WriteHeader(http.StatusInternalServerError)
		fmt.Fprint(w, `{"code":"500", "message":"JSON parse error"}`)
		return
	}

	fmt.Fprint(w, string(respJSON))
}
