## Run CSV YoY comparison for single source files

#### Arguments

    --base <base file name ( last year's file )
    --new <new file name (this year's file )
    --measure <optional: multiple measures which need to be evaluated else evaluate every measure which has changed >

#### Execution in Docker


    docker-compose run  data-analysis python tests/single_source_csv/single_source_csv_comp.py --base data/2021_Claims_SingleSource_v1.3.csv --new data/2022_Claims_SingleSource_v6.0_08-12-2022.csv --measure 14

