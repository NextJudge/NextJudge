package main

import (
	"encoding/json"
	"fmt"
	"net/url"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
)

const (
	SUBMISSION_KEY    = "submission_queue"
	submissionDLQKey  = "submission_queue.dlq"
	publishMaxRetries = 3
)

type RabbitMQService struct {
	mu        sync.Mutex
	conn      *amqp.Connection
	channel   *amqp.Channel
	queueName string
}

var rabbitService *RabbitMQService

type RabbitMQSubmission struct {
	Type string `json:"type"`
	Id   string `json:"id"`
}

type RabbitMQCustomInputSubmission struct {
	Type string `json:"type"`
	Id   string `json:"id"`
}

func SetupRabbitMQConnection() error {
	rabbitService = &RabbitMQService{}
	return rabbitService.connect()
}

func (r *RabbitMQService) connect() error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.channel != nil {
		_ = r.channel.Close()
		r.channel = nil
	}
	if r.conn != nil {
		_ = r.conn.Close()
		r.conn = nil
	}

	rabbitMQEndpoint := fmt.Sprintf(
		"amqp://%s:%s@%s:5672/",
		url.QueryEscape(cfg.RabbitUser),
		url.QueryEscape(cfg.RabbitPassword),
		cfg.RabbitMQHost,
	)

	var conn *amqp.Connection
	var err error
	const maxAttempts = 10
	for attempt := 0; attempt < maxAttempts; attempt++ {
		conn, err = amqp.Dial(rabbitMQEndpoint)
		if err == nil {
			break
		}
		if attempt < maxAttempts-1 {
			time.Sleep(2 * time.Second)
		}
	}
	if err != nil {
		return err
	}

	channel, err := conn.Channel()
	if err != nil {
		_ = conn.Close()
		return err
	}

	queue, err := channel.QueueDeclare(
		SUBMISSION_KEY,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		_ = channel.Close()
		_ = conn.Close()
		return err
	}

	_, err = channel.QueueDeclare(
		submissionDLQKey,
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		_ = channel.Close()
		_ = conn.Close()
		return err
	}

	r.conn = conn
	r.channel = channel
	r.queueName = queue.Name
	return nil
}

func (r *RabbitMQService) reconnect() error {
	logrus.Warn("Reconnecting to RabbitMQ...")
	return r.connect()
}

func (r *RabbitMQService) publish(body []byte) error {
	var lastErr error
	for attempt := 0; attempt < publishMaxRetries; attempt++ {
		r.mu.Lock()
		channel := r.channel
		queueName := r.queueName
		r.mu.Unlock()

		if channel == nil {
			if err := r.reconnect(); err != nil {
				lastErr = err
				time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond)
				continue
			}
			r.mu.Lock()
			channel = r.channel
			queueName = r.queueName
			r.mu.Unlock()
		}

		err := channel.Publish(
			"",
			queueName,
			false,
			false,
			amqp.Publishing{
				ContentType:  "application/json",
				Body:         body,
				DeliveryMode: amqp.Persistent,
			},
		)
		if err == nil {
			return nil
		}

		lastErr = err
		logrus.WithError(err).Warn("RabbitMQ publish failed, reconnecting")
		if reconnectErr := r.reconnect(); reconnectErr != nil {
			lastErr = reconnectErr
		}
		time.Sleep(time.Duration(attempt+1) * 500 * time.Millisecond)
	}
	return lastErr
}

func publishSubmissionMessage(id string) error {
	data := RabbitMQSubmission{
		Type: "submission",
		Id:   id,
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return rabbitService.publish(jsonData)
}

func publishInputSubmissionMessage(id string) error {
	data := RabbitMQCustomInputSubmission{
		Type: "input",
		Id:   id,
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return rabbitService.publish(jsonData)
}

func CloseRabbitMQConnection() {
	if rabbitService == nil {
		return
	}
	rabbitService.mu.Lock()
	defer rabbitService.mu.Unlock()
	if rabbitService.channel != nil {
		_ = rabbitService.channel.Close()
	}
	if rabbitService.conn != nil {
		_ = rabbitService.conn.Close()
	}
}
