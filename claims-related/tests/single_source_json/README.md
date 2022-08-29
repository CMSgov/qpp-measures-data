## Running YoY Comparison for Single Source Json

1. From `claims-related/tests/single_source_json/` run `python single_source_json_comp.py --base qpp-single-source-2021.json --new qpp-single-source-2022.json` with the relevant filenames. 
2. The script will generate an .md file for each measure under `json_report` as well as a high-level `_Summary` file.

BE aware that the script does NOT catch changed ordering / resorting in some cases.