docker-rebuild:
	docker-compose build single-source

docker-terminal:
	docker-compose run -it single-source bash

docker-run-csv-to-json:
	docker compose run single-source ./.venv/bin/python -m single_source.format_json --input-path data/2025_Claims_SingleSource_V9.1.csv --output-path data/qpp-single-source-2025.json --overwrite
