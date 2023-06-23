## Running YoY Comparison for Single Source Json

#### Arguments

    --base <base file name ( last year's file )
    --new <new file name (this year's file )
    --measure <optional: multiple measures which need to be evaluated else evaluate every measure which has changed >

#### Execution in Docker

        docker-compose run  data-analysis python tests/single_source_json/single_source_json_comp.py --base data/qpp-single-source-2021.json --new data/qpp-single-source-2021.json

BE aware that the script does NOT catch changed ordering / resorting in some cases.