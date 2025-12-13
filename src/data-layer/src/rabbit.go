package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	"github.com/sirupsen/logrus"
)

const SUBMISSION_KEY string = "submission_queue"

type RabbitMQService struct {
	Connection *amqp.Connection
	Channel    *amqp.Channel
	Queue      *amqp.Queue
}

var rabbit_connection *RabbitMQService

type RabbitMQSubmission struct {
	Type string `json:"type"`
	Id   string `json:"id"`
}

type RabbitMQCustomInputSubmission struct {
	Type       string `json:"type"`
	Id         string `json:"id"`
	Code       string `json:"code"`
	LanguageID string `json:"language_id"`
	Stdin      string `json:"stdin"`
}

func NewRabbitMQConnection() (*RabbitMQService, error) {
	rabbitMQEndpoint := fmt.Sprintf("amqp://%s:%s@%s:5672", url.QueryEscape(cfg.RabbitUser), url.QueryEscape(cfg.RabbitPassword), cfg.RabbitMQHost)

	var conn *amqp.Connection
	var err error
	const MAX_ATTEMPTS = 10
	attempts := 0

	for conn == nil {
		conn, err = amqp.Dial(
			rabbitMQEndpoint,
		)

		if err != nil {
			if attempts < MAX_ATTEMPTS {
				time.Sleep(2 * time.Second)
			} else {
				return nil, err
			}
		}
		attempts += 1
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, err
	}

	submission_queue, err := channel.QueueDeclare(
		SUBMISSION_KEY, // name
		true,           // durable
		false,          // delete when unused
		false,          // exclusive
		false,          // no-wait
		nil,            // arguments
	)
	if err != nil {
		channel.Close()
		conn.Close()
		return nil, err
	}

	return &RabbitMQService{
		Connection: conn,
		Channel:    channel,
		Queue:      &submission_queue,
	}, nil
}

func SetupRabbitMQConnection() error {
	service, err := NewRabbitMQConnection()
	if err != nil {
		return err
	}
	rabbit_connection = service
	return nil
}

func RabbitMQPublishSubmission(id string) {
	data := RabbitMQSubmission{
		Type: "submission",
		Id:   id,
	}

	json_data, err := json.Marshal(data)
	if err != nil {
		log.Fatal(err)
	}

	err = rabbit_connection.Channel.Publish(
		"",                           // exchange
		rabbit_connection.Queue.Name, // routing key
		false,                        // mandatory
		false,                        // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(json_data),
		},
	)

	if err != nil {
		logrus.Fatal(err)
	}

	log.Println("Published")
}

func RabbitMQPublishCustomInputSubmission(id string, body *CustomInputSubmissionStatusPostBody) {
	data := RabbitMQCustomInputSubmission{
		Type:       "input",
		Id:         id,
		Code:       body.SourceCode,
		LanguageID: body.LanguageID.String(),
		Stdin:      body.Stdin,
	}

	json_data, err := json.Marshal(data)
	if err != nil {
		log.Fatal(err)
	}

	err = rabbit_connection.Channel.Publish(
		"",                           // exchange
		rabbit_connection.Queue.Name, // routing key
		false,                        // mandatory
		false,                        // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        []byte(json_data),
		},
	)

	if err != nil {
		logrus.Fatal(err)
	}

	log.Println("Published")
}

func CloseRabbitMQConnection() {
	if rabbit_connection != nil {
		if rabbit_connection.Channel != nil {
			rabbit_connection.Channel.Close()
		}
		if rabbit_connection.Connection != nil {
			rabbit_connection.Connection.Close()
		}
	}
}

func (r *RabbitMQService) Close() error {
	var err error
	if r.Channel != nil {
		if closeErr := r.Channel.Close(); closeErr != nil {
			err = closeErr
		}
	}
	if r.Connection != nil {
		if closeErr := r.Connection.Close(); closeErr != nil {
			err = closeErr
		}
	}
	return err
}
