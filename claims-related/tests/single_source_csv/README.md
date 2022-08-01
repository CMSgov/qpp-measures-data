## Run CSV YoY comparison for single source files

#### Arguments
    
    --base <base file name ( last year's file ) 
    --new <new file name (this year's file )
    --measure <optional: multiple measures which need to be evaluated else evaluate every measure which has changed >

#### Execution in Docker 

    docker-compose run -w /home/jovyan/work/tests/single_source_csv/ data-analysis python3 single_source_csv_comp.py --measure 12 

files would be placed in `../../data` if needed to change default and new arguments