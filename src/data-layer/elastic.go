package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/google/uuid"
)

type ElasticSearch struct {
	ElasticSearchClient *elasticsearch.Client
}

func NewElasticSearch() (*ElasticSearch, error) {
	es, err := elasticsearch.NewClient(elasticsearch.Config{
		Addresses: []string{
			cfg.ElasticEndpoint,
		},
	})
	if err != nil {
		return nil, err
	}

	res, err := es.Ping()
	if err != nil {
		return nil, err
	}
	if res.IsError() {
		return nil, err
	}
	res.Body.Close()

	res, err = es.Indices.Create(cfg.ProblemsIndex)
	if err != nil {
		return nil, err
	}
	if res.IsError() {
		return nil, err
	}
	res.Body.Close()

	res, err = es.Indices.Create(cfg.CompetitionsIndex)
	if err != nil {
		return nil, err
	}
	if res.IsError() {
		return nil, err
	}
	res.Body.Close()

	return &ElasticSearch{
		ElasticSearchClient: es,
	}, nil
}

func (es *ElasticSearch) IndexProblem(problem *Problem) error {
	esDocument := map[string]string{
		"Title":  problem.Title,
		"Prompt": problem.Prompt,
	}
	doc, err := json.Marshal(esDocument)
	if err != nil {
		return err
	}

	res, err := es.ElasticSearchClient.Index(cfg.ProblemsIndex, strings.NewReader(string(doc)), es.ElasticSearchClient.Index.WithDocumentID(problem.ID.String()))
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		return err
	}

	return nil
}

func (es *ElasticSearch) SearchProblems(ctx context.Context, query string) ([]Problem, error) {
	esQuery := `
    {
        "query": {
            "multi_match": {
                "query": "%s",
                "fields": ["Title", "Prompt"]
            }
        }
    }`
	res, err := es.ElasticSearchClient.Search(
		es.ElasticSearchClient.Search.WithContext(ctx),
		es.ElasticSearchClient.Search.WithIndex(cfg.ProblemsIndex),
		es.ElasticSearchClient.Search.WithBody(strings.NewReader(fmt.Sprintf(esQuery, query))),
	)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.IsError() {
		return nil, err
	}

	var result map[string]interface{}
	err = json.NewDecoder(res.Body).Decode(&result)
	if err != nil {
		return nil, err
	}

	hits := result["hits"].(map[string]interface{})["hits"].([]interface{})
	problems := []Problem{}
	for _, hit := range hits {
		doc := hit.(map[string]interface{})
		id := doc["_id"].(string)
		problemId, err := uuid.Parse(id)
		if err != nil {
			return nil, err
		}
		problem, err := db.GetProblemByID(problemId)
		if err != nil {
			return nil, err
		}
		if problem != nil {
			problems = append(problems, *problem)
		}
	}
	return problems, nil
}

func (es *ElasticSearch) DeleteProblem(problemId string) error {
	res, err := es.ElasticSearchClient.Delete(cfg.ProblemsIndex, problemId)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		return err
	}

	return nil
}
