# Summary
This directory contains resources for parsing the single source spreadsheet to produce a JSON file containing measure eligibility and performance information.

This file is then used during the enrichment of the measures data to include those attributes.
# Running
## Containerised
### Prerequisites
The only prerequisite to run the containerised process is that you have [docker](https://www.docker.com/) and [docker-compose](https://docs.docker.com/compose/) installed.
### Instructions
Run the script from the container:
```bash
docker-compose run data-analysis python /home/jovyan/work/scripts/single_source_to_json.py
```
The docker-compose file in this directory mounts the correct directories for this operation using the default paths. Other paths can be specified with the following arguments:

* `--single_source_filepath`
    * Path to the spreadsheet containing the claims-related data, e.g. `/claims-related/data/2017_Claims_IndivMeasures_SingleSourceVersion2_11082017_andrea_edit`
* `--measures_data_filepath`
    * Path to the measures data JSON, e.g. `/measures/measures-data.json`
* `--output_filepath`
    * Path to write output to, e.g. `/claims-related/data/qpp-single-source.json`
## Native
The script for processing the spreadsheet can be run outside of the container using the instructions above if your system has [numpy](http://www.numpy.org/) and [pandas](https://pandas.pydata.org/) installed.