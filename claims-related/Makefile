docker-rebuild:
	docker-compose build single-source

docker-terminal:
	docker-compose run -it single-source bash

docker-run-csv-to-json:
	docker-compose run single-source ./.venv/bin/python -m single_source.format_json --input-path data/2023_Claims_SingleSource_v7.0_1.29.24.csv --output-path data/qpp-single-source-2023.json --overwrite
