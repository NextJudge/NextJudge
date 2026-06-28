package main

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"goji.io/pat"
)

type CreateQuestionRequest struct {
	Question  string `json:"question"`
	ProblemID *int   `json:"problem_id,omitempty"`
}

type AnswerQuestionRequest struct {
	Answer string `json:"answer"`
}

func getEventQuestions(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event id")
		WriteError(w, http.StatusBadRequest, "bad event id", "400")
		return
	}

	// verify event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		WriteError(w, http.StatusNotFound, "event does not exist", "404")
		return
	}

	questions, err := db.GetEventQuestions(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event questions")
		WriteError(w, http.StatusInternalServerError, "error getting event questions", "500")
		return
	}

	WriteJSON(w, http.StatusOK, questions)
}

func createEventQuestion(w http.ResponseWriter, r *http.Request) {
	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event id")
		WriteError(w, http.StatusBadRequest, "bad event id", "400")
		return
	}

	// verify event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		WriteError(w, http.StatusNotFound, "event does not exist", "404")
		return
	}

	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusInternalServerError, "Error in token", "500")
		return
	}

	reqData := new(CreateQuestionRequest)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		WriteError(w, http.StatusInternalServerError, "error reading request body", "500")
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		WriteError(w, http.StatusInternalServerError, "JSON parse error", "500")
		return
	}

	if reqData.Question == "" {
		logrus.Warn("question text is required")
		WriteError(w, http.StatusBadRequest, "question text is required", "400")
		return
	}

	// validate problem exists if specified
	if reqData.ProblemID != nil {
		problem, err := db.GetProblemDescriptionByID(*reqData.ProblemID)
		if err != nil {
			logrus.WithError(err).Error("error getting problem from db")
			WriteError(w, http.StatusInternalServerError, "error getting problem from db", "500")
			return
		}
		if problem == nil {
			logrus.Error("problem does not exist")
			WriteError(w, http.StatusNotFound, "problem does not exist", "404")
			return
		}
	}

	question := &EventQuestion{
		EventID:    eventId,
		UserID:     token.Id,
		ProblemID:  reqData.ProblemID,
		Question:   reqData.Question,
		IsAnswered: false,
	}

	createdQuestion, err := db.CreateEventQuestion(question)
	if err != nil {
		logrus.WithError(err).Error("error creating question")
		WriteError(w, http.StatusInternalServerError, "error creating question", "500")
		return
	}

	// create notifications for all other users in the event
	err = db.CreateQuestionNotifications(eventId, createdQuestion.ID, token.Id)
	if err != nil {
		logrus.WithError(err).Error("error creating question notifications")
		// don't fail the request if notifications fail, just log the error
	}

	WriteJSON(w, http.StatusCreated, createdQuestion)
}

func answerEventQuestion(w http.ResponseWriter, r *http.Request) {
	questionIdParam := pat.Param(r, "question_id")

	eventId, err := ParseEventID(r)
	if err != nil {
		logrus.Warn("bad event id")
		WriteError(w, http.StatusBadRequest, "bad event id", "400")
		return
	}

	questionId, err := uuid.Parse(questionIdParam)
	if err != nil {
		logrus.Warn("bad question id")
		WriteError(w, http.StatusBadRequest, "bad question id", "400")
		return
	}

	// verify event exists
	event, err := db.GetEventByID(eventId)
	if err != nil {
		logrus.WithError(err).Error("error getting event from db")
		WriteError(w, http.StatusInternalServerError, "error getting event from db", "500")
		return
	}
	if event == nil {
		logrus.Error("event does not exist")
		WriteError(w, http.StatusNotFound, "event does not exist", "404")
		return
	}

	// verify question exists and belongs to event
	question, err := db.GetEventQuestionByID(questionId)
	if err != nil {
		logrus.WithError(err).Error("error getting question from db")
		WriteError(w, http.StatusInternalServerError, "error getting question from db", "500")
		return
	}
	if question == nil {
		logrus.Error("question does not exist")
		WriteError(w, http.StatusNotFound, "question does not exist", "404")
		return
	}
	if question.EventID != eventId {
		logrus.Error("question does not belong to this event")
		WriteError(w, http.StatusBadRequest, "question does not belong to this event", "400")
		return
	}

	// get user from token
	token, ok := r.Context().Value(ContextTokenKey).(*NextJudgeClaims)
	if !ok || token == nil {
		logrus.Error("Error in token")
		WriteError(w, http.StatusInternalServerError, "Error in token", "500")
		return
	}

	reqData := new(AnswerQuestionRequest)
	reqBodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		logrus.WithError(err).Error("error reading request body")
		WriteError(w, http.StatusInternalServerError, "error reading request body", "500")
		return
	}

	err = json.Unmarshal(reqBodyBytes, reqData)
	if err != nil {
		logrus.WithError(err).Error("JSON parse error")
		WriteError(w, http.StatusInternalServerError, "JSON parse error", "500")
		return
	}

	if reqData.Answer == "" {
		logrus.Warn("answer text is required")
		WriteError(w, http.StatusBadRequest, "answer text is required", "400")
		return
	}

	err = db.AnswerEventQuestion(questionId, reqData.Answer, token.Id)
	if err != nil {
		logrus.WithError(err).Error("error answering question")
		WriteError(w, http.StatusInternalServerError, "error answering question", "500")
		return
	}

	// create notification for the question author
	err = db.CreateAnswerNotification(eventId, questionId, question.UserID)
	if err != nil {
		logrus.WithError(err).Error("error creating answer notification")
		// don't fail the request if notifications fail, just log the error
	}

	WriteJSON(w, http.StatusOK, map[string]string{"message": "question answered successfully"})
}
