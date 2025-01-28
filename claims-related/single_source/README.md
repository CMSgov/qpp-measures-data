# Single Source

## Overview

The single source file contains configuration for running the claims to quality (C2Q)
measures. There are really multiple "single source" files varying in file
format and contents.  Mathematica Policy Research (MPR) provides an Excel
version to SemanticBits.  The sheet containing the various codes used in
C2Q is written to a CSV file and stored in this repository at the following path:
qpp-measures-data/claims-related/data. **Note:** *The Excel file may have some
special characters and/or lines that need to be removed before writing the
CSV.*  A JSON format of the single source is also contained in the same directory - this version structures
the original data in a format to be consumed by C2Q.  The fourth and final
version of the single source file resides in the claims-to-quality-analyzer
repository in claims_to_quality/lib/assets.  This fourth version is also JSON
but contains additional data compared to the JSON in this repo - it is the
"enriched single source file".

## Steps for creating enriched file
* Download Mathematica's Excel Single Source file
* Export to CSV format removing any special characters and/or lines
* Create the json file (use Makefile docker-run-csv-to-json)
* Enrich the json file


## Makefile
### Build Docker Image
```makefile
make docker-rebuild
```

### Create the JSON format from the CSV file
```makefile
make docker-run-csv-to-json
```

## Single Source Enrichment
See `CONTRIBUTING.md` in the root of the repo for instructions on software installation and enriching
the single source file.
