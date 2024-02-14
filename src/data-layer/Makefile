.PHONY: build clean postgres

build: bin/data-layer

clean:
	rm -rf ./bin
	docker exec -i data-layer-db-1 psql -U postgres -c 'DROP DATABASE nextjudge'

bin/data-layer: *.go go.mod go.sum
	go build -o bin/data-layer

postgres: 
	# docker exec -i data-layer-db-1 psql -U postgres -c 'CREATE DATABASE nextjudge'
	docker exec -i data-layer-db-1 psql -U postgres nextjudge < nextjudge.sql