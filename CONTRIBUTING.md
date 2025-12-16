# Contribution Guidelines

## Getting Started

Run:
```
nvm use
npm install
```

Make changes on a feature branch, then open a pull request. Make sure CI passes on your branch, and you include any relevant new tests.

Make sure to generate/update the js files when updating the typescript files. e.g., running `tsc -w -p .` will recompile the typescript as you update it.

### Pull Requests

Create a pull request for your branch via GitHub. The PR template will have instructions on where to add details in the description. Once the PR is created, reach out to your team and QPPA for approvals. At least one QPPA dev should approve before you merge.

When there are enough reviews, one of the maintainers with write access will merge the PR via a squash commit and delete the branch. It will be merged back into the `develop` branch. Do not update the package version in your branch, this will be done at the time a new release is made.

### Generating data
To regenerate and validate data, do the following:

```
nvm use
npm run init:measures $YEAR         # generates measures/$YEAR/measures-data.json and all supporting files.
npm run update:measures $YEAR       # updates measures/$YEAR/measures-data.json and mvp-enriched.json
npm run build:benchmarks $YEAR      # regenerates benchmarks/$YEAR.json
npm run build:mvp $YEAR             # regenerates the mvp data files in mvp/$YEAR/
npm run build:clinical-clusters     # regenerates clinical-clusters/clinical-clusters.json
```

### Generating measures CSVs
To export CSVs of the measures data (one for each category):

```
nvm use
npm run export:measures $YEAR       # generates tmp/$YEAR/[category]-measures.csv
```

### Validation

We've provided a simple tool to validate JSON against our JSON schemas. By providing an argument to indicate the schema against which to validate, it can be used as follows:
```
cat [path to JSON] | node scripts/validate-data.js [measures | benchmarks | clinical-clusters] [$YEAR]
```
e.g. from the base directory:
```
cat measures/2018/measures-data.json  | node scripts/validate-data.js measures 2018
```

Also, the scripts outlined in the `Generating data` section above run validation on their resulting data.
For example, running `npm run update:measures $YEAR` will also validate the measures-data.json for that year.

### Initializing, Adding, Updating, and Deleting Measures

#### Initializing

To create a new perfomance year for measures, run `npm run init:measures $YEAR`. This will create all the necessary folders and files for the new year, as well as perform various resets of the new year's measures data such as increment the quality eMeasureIds and remove last year's spec links from the new measures-data file.

#### Adding/Updating

New measures and updates to old measures are handled the same as each other. A CSV Change Request file (CR) with the proposed changes should be placed in the updates/measures/$YEAR folder. IMPORTANT: Do *not* manually modify the changes.meta.json, this is updated automatically during the ingestion process. 
Once the update file is added, run `npm run update:measures $YEAR`. Errors during ingestion will be logged to your terminal, if any.
NOTE FOR TESTING: You may add the -t flag to the above update script to run the ingestion without persisting to the change.meta file or measures-data file.

You can also make changes directly to the measures-data.json files. This is recommended for small changes for which we have not been provided a CR. The same *cannot* be done for Benchmarks, MVPs, or Clinical Clusters data files, as any direct, manual changes will be overwritten by the next build.

#### Deleting

Deleting measures is handled by the "Year Removed" field in the change request file. Removal change request files are handled in the same way as updates, outlined above.

#### Additional Info

There is no need to ever change CR files after they have been processed. Future data corrections can either be handled in a new CR or via manual updates (see below).

Most external changes will come to us in the form of a CR, but CRs are not required for measures-data.json changes. It is perfectly acceptable to manually update the measures-data.json file manually. This is best for quick data corrections or very small updates. Just make sure to run `npm run update:measures $YEAR` after you make the change to verify all validations pass.

### Adding/Updating Measures Strata

The strata are modified by updating the qcdr and quality strata CSVs in /util/measures/$YEAR/, then running `npm run update:measures $YEAR`. Check earlier years for examples.

### Adding/Updating Spec URL files

The specification links are added by placing the CSV or JSON files into /util/measures/$YEAR/, then running `npm run update:measures $YEAR`. Check earlier years for examples.

### Managing Allowed Programs for Measures

When creating a new AllowedProgram, the program name should be added to the following files. Place the new allowedProgram where it most makes sense in the array and be consistant with its placement in all files:
* util/interfaces/program-names.ts
* util/program-names/program-names.json
* index.spec.ts (The "ProgramNames interface" test)
* measures/$YEAR/measures-schema.yaml

When deleting an allowedProgram that is still allowed for previous years, DO NOT remove it from all the above files. Instead, only remove it from the measures-schema.yaml file for the appropiate year(s).

The `manage:allowed-programs` script enables adding or removing a program from the `allowedPrograms` field of all measures in a specific category for a given performance year. This is especially useful for bulk updates, such as adding a new program or making uniform changes across multiple measures.

```bash
npm run manage:allowed-programs <performanceYear> <category> <program> <add|remove>
```
Example: To remove the program `pcf` from all `ia` category measures for the year `2024`:
```bash
npm run manage:allowed-programs 2024 ia pcf remove
```

### Importing Measures from a CSV File

To handle UTF-8 encoding, make sure that you save any new csv from excel as `CSV UTF-8 (Comma delimited) (.csv)`. This will keep Unknown Characters out of the data set.

### Additional Benchmarks

To add or update benchmarks, rename your csv or json file and place that file in staging/$YEAR/benchmarks/, based on the list of names/directories mentioned below. Replace any existing files of the same name. Run `nvm use` to make sure you are using the correct versions of npm and Nodejs, then run `npm run build:benchmarks $YEAR` to rebuild the benchmark JSON files under /benchmarks/$YEAR/. See `build-benchmarks` for more detail.

Please verify the changes are as expected. (You can run `git diff`.)

Below are the locations where different types of benchmarks should be added:
* Quality/QCDR: &nbsp; staging/$YEAR/benchmarks/benchmarks.csv
* CAHPS: &nbsp; staging/$YEAR/benchmarks/benchmarks_cahps.csv
* WI: &nbsp; staging/$YEAR/benchmarks/json/wi_benchmarks.json
* Mock Cost: &nbsp; staging/$YEAR/benchmarks/json/mock-cost-benchmarks.json

 Check earlier years for examples.

### Creating and updating MVP (MIPS Value Pathway) data

Each performance year, we will receive a file named `mvp.csv` which contains the data for MVPs for that year. Place this file in the `mvp/$YEAR` directory for the performance year. First run `nvm use` to make sure you are using the correct versions of npm and Nodejs. Then run `npm run build:mvp $YEAR` which will create the `mvp-enriched.json` file populated with complete measure data. If we receive an updated `mvp.csv`, replace the file in the `mvp/$YEAR` directory and simply run `npm run build:mvp` again, which will replace the `mvp-enriched.json` file.

For new MVPs, you will need to update the mvp list in the measures-schema.yaml for that year with the new MVP names.

## Add/Update National Averages JSON

Add or update `cost-national-averages.csv` to `util/benchmarks/$YEAR/` and run `npm run build:benchmarks $YEAR` 

## Testing

When making changes to measures-data, include tests in the .spec.ts files and make sure existing tests still pass using:

```
npm test
```

We also use Github Actions CI to run tests on every branch.

## Versioning, publishing, and creating new releases

The release process is semi-automated via github actions. A number of steps are necessarily left manual (such as versioning) and require intervention from the user.

Follow the steps outline in [Package Release Process for Measures Data](https://confluence.cms.gov/x/Wm-gI) to publish a new version.

## Licenses

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
