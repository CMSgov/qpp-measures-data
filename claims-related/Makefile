docker-setup:
	docker-compose up -d

docker-teardown:
	docker-compose down --remove-orphans

docker-rebuild:
	docker-compose build single-source

docker-terminal:
	docker-compose run -it single-source bash

docker-run-excel-to-csv:
	docker-compose run single-source ./.venv/bin/python -m single_source.excel_to_csv --input-path data/2023_Claims_SingleSource_v7.0_1.29.24.xlsx --overwrite

docker-run-csv-to-json:
	docker-compose run single-source ./.venv/bin/python -m single_source.format_json --input-path data/2023_Claims_SingleSource_v7.0_1.29.24.csv --output-path data/qpp-single-source-2023.json

docker-run-compare:
	docker-compose run single-source ./.venv/bin/python -m pytest -v --no-header single_source

docker-run-single-source-measures:
	docker-compose run single-source ./.venv/bin/python -m single_source.single_source_measures  --single-source data/qpp-single-source-2023.json --measures-data measures/2023/measures-data.json --output-path data/measures-data-single-source.json
