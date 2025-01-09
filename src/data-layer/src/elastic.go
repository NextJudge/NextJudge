package main

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/elastic/go-elasticsearch/v8"
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

	pingRes, err := es.Ping()
	if err != nil {
		return nil, err
	}
	defer pingRes.Body.Close()
	if pingRes.IsError() {
		return nil, err
	}

	problemsExistsRes, err := es.Indices.Exists([]string{cfg.ProblemsIndex})
	if err != nil {
		return nil, err
	}
	defer problemsExistsRes.Body.Close()
	if problemsExistsRes.IsError() {
		return nil, err
	}
	if problemsExistsRes.StatusCode == http.StatusNotFound {
		createProblemsRes, err := es.Indices.Create(cfg.ProblemsIndex)
		if err != nil {
			return nil, err
		}
		defer createProblemsRes.Body.Close()
		if createProblemsRes.IsError() {
			return nil, err
		}
	}

	competitionsExistsRes, err := es.Indices.Exists([]string{cfg.CompetitionsIndex})
	if err != nil {
		return nil, err
	}
	defer competitionsExistsRes.Body.Close()
	if competitionsExistsRes.IsError() {
		return nil, err
	}
	if competitionsExistsRes.StatusCode == http.StatusNotFound {
		createCompetitionsRes, err := es.Indices.Create(cfg.CompetitionsIndex)
		if err != nil {
			return nil, err
		}
		defer createCompetitionsRes.Body.Close()
		if createCompetitionsRes.IsError() {
			return nil, err
		}
	}

	return &ElasticSearch{
		ElasticSearchClient: es,
	}, nil
}

func (es *ElasticSearch) IndexProblem(problem *ProblemDescription) error {
	esDocument := map[string]string{
		"Title":  problem.Title,
		"Prompt": problem.Prompt,
	}
	doc, err := json.Marshal(esDocument)
	if err != nil {
		return err
	}

	res, err := es.ElasticSearchClient.Index(cfg.ProblemsIndex, strings.NewReader(string(doc)), es.ElasticSearchClient.Index.WithDocumentID(strconv.Itoa(problem.ID)))
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.IsError() {
		return err
	}

	return nil
}

func (es *ElasticSearch) SearchProblems(ctx context.Context, query string) ([]ProblemDescription, error) {
	// esQuery := `
	// {
	//     "query": {
	//         "multi_match": {
	//             "query": "%s",
	//             "fields": ["Title", "Prompt"]
	//         }
	//     }
	// }`
	// res, err := es.ElasticSearchClient.Search(
	// 	es.ElasticSearchClient.Search.WithContext(ctx),
	// 	es.ElasticSearchClient.Search.WithIndex(cfg.ProblemsIndex),
	// 	es.ElasticSearchClient.Search.WithBody(strings.NewReader(fmt.Sprintf(esQuery, query))),
	// )
	// if err != nil {
	// 	return nil, err
	// }
	// defer res.Body.Close()
	// if res.IsError() {
	// 	return nil, err
	// }

	// var result map[string]interface{}
	// err = json.NewDecoder(res.Body).Decode(&result)
	// if err != nil {
	// 	return nil, err
	// }

	// hits := result["hits"].(map[string]interface{})["hits"].([]interface{})
	// problems := []ProblemDescription{}
	// for _, hit := range hits {
	// 	doc := hit.(map[string]interface{})
	// 	id := doc["_id"].(string)
	// 	problemId, err := strconv.Atoi(id)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// 	problem, err := db.GetProblemDescriptionByID(problemId)
	// 	if err != nil {
	// 		return nil, err
	// 	}
	// 	if problem != nil {
	// 		problems = append(problems, *problem)
	// 	}
	// }
	// return problems, nil
	return nil, nil
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
