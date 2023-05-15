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

Create a pull request for your branch via GitHub. The PR template will have instructions on where to add details in the description. Once the PR is created, the users specified in the CODEOWNERS file will be automatically added as reviewers. 

When there are enough reviews, one of the maintainers with write access will merge the PR via a squash commit and delete the branch. It will be merged back into the `develop` branch. Do not update the package version in your branch, this will be done at the time a new release is made.

### Performance year

$YEAR refers to the performance year; this command-line argument is required.  $YEAR is currently only supported as a command-line argument for measures and benchmarks generation, not supported for clinical clusters.

### Generating data
To regenerate and validate data, do the following:

```
nvm use
npm run init:measures $YEAR         # generates measures/$YEAR/measures-data.json
npm run update:measures $YEAR       # updates measures/$YEAR/measures-data.json
npm run build:benchmarks $YEAR      # generates benchmarks/$YEAR.json
npm run build:clinical-clusters     # generates clinical-clusters/clinical-clusters.json
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
### Initializing, Adding, Updating, and Deleting Measures

To create a new perfomance year for measures, run `npm run init:measures $YEAR`. This will create all the necessary folders and files for the new year, as well as increment the quality eMeasureIds and remove last year's spec links from the new measures-data file.

New measures and updates to old measures are handled the same as each other. A CSV file with the proposed changes should be placed in the updates/measures/$YEAR folder. IMPORTANT: Do *not* manually modify the changes.meta.json, this is updated automatically during the ingestion process. 
Once the update file is added, run `npm run update:measures $YEAR`. Errors during ingestion will be logged to your terminal, if any.
NOTE FOR TESTING: You may add the -t flag to the above update script to run the ingestion without persisting to the change.meta file or measures-data file.

Deleting measures is handled by the "Year Removed" field in the change request file. Removal change request files are handled in the same way as updates, outlined above.

The strata are modified by updating the qcdr and quality strata CSVs in the year's util directory, then running `npm run init:measures $YEAR`.

The specification links are added by placing the CSV or JSON files into the year's util directory, then running `npm run init:measures $YEAR`.

### Importing Measures from a CSV File

To handle UTF-8 encoding, make sure that you save any new csv from excel as `CSV UTF-8 (Comma delimited) (.csv)`. This will keep Unknown Characters out of the data set.

### Additional Benchmarks

For 2018-2019, only 'full images' of benchmark data are accepted; the csv must contain a full list of included benchmarks. Incremental files are no longer supported (2017 is no longer supported).

  To add or update benchmarks, rename your csv to 'benchmarks.csv'
  and place that file in staging/$YEAR/benchmarks/. 
  Replace any existing files of the same name.
  Run `nvm use` to make sure you are using the correct versions of npm and Nodejs, then run `npm run build:benchmarks $YEAR` to update benchmark JSON files under benchmarks/.
  $YEAR refers to the performance year you are looking to update. 
  See `build-benchmarks` for more detail.

  `build-benchmarks` will call `parse-benchmarks-data.js` directly and validate the data right after. 
  `parse-benchmarks-data.js` relies on a set of columns to be present and additional empty columns can cause the parsing to fail.
   See that file for additional instructions on how to generate the JSON file.
  
  Also, `parse-benchmarks-data.js` cross references for measureIds in `measures/$YEAR/measures-data.json` for the correct usage. If none are matched, either a padded `000` digit will be used for `measureId`s with all digits or a non-spaced version of the `measureId` will be used.

  If 2 benchmarks have the same Measure ID, Benchmark Year, Performance Year, and Submission method, an error will be thrown. Benchmarks cannot share this composite key.

  Please verify the changes are as expected. (You can run `git diff`.)

### Creating and updating MVP (MIPS Value Pathway) data

Each performance year, we will receive a file named `mvp.json` which contains the data for MVPs for that year. Place this file in the `mvp/$YEAR` directory for the performance year. First run `nvm use` to make sure you are using the correct versions of npm and Nodejs. Then run `npm run update:mvp` which will create the `mvp-enriched.json` file populated with complete measure data. If we receive an updated `mvp.json`, replace the file in the `mvp/$YEAR` directory and simply run `npm run update:mvp` again, which will replace the `mvp-enriched.json` file.

## Testing

When making changes to measures-data, include tests in the tests directory and make sure existing tests still pass using:

```
npm test
npx jest
npm run jest:cov
```

We also use Github Actions CI to run tests on every branch.

## Versioning, publishing, and creating new releases

The release process is semi-automated via github actions. A number of steps are necessarily left manual (such as versioning) and require intervention from the user.

Follow the steps outline in [Package Release Process for Measures Data](https://confluence.cms.gov/x/Wm-gI) to publish new version.

## Debugging

This repository uses GitHub Action for CI/CD. The actions that are used can be found in `.github/workflows/` folder and are self-explanatory. GitHub Actions are pretty straight forward and easy to understand, this section offers a few tips around debugging and get the detailed logs at your finger tips. 
 
### Runner Diagnostic Logging

[Runner diagnostic logging](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/managing-a-workflow-run#enabling-runner-diagnostic-logging) provides additional log files that contain information about how a runner is executing an action.
To enable runner diagnostic logging, set the secret `ACTIONS_RUNNER_DEBUG` to `true` in the repository that contains the workflow.

### Step Debug Logging

[Step debug logging](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/managing-a-workflow-run#enabling-step-debug-logging) increases the verbosity of a job's logs during and after a job's execution.
To enable step debug logging set the secret `ACTIONS_STEP_DEBUG` to `true` in the repository that contains the workflow.

### Output Various Context Variables
Well above two approaches will vomit a lot of things at you, most of it is not even useful to you as a developer and it is easy to get lost. Use the following approach to dump the context data, which is all what you need most of the time to resolve the problem in hand.
```yml
    steps:
      - name: Dump GitHub context
        env:
          GITHUB_CONTEXT: ${{ toJson(github) }}
        run: echo "$GITHUB_CONTEXT"
      - name: Dump job context
        env:
          JOB_CONTEXT: ${{ toJson(job) }}
        run: echo "$JOB_CONTEXT"
      - name: Dump steps context
        env:
          STEPS_CONTEXT: ${{ toJson(steps) }}
        run: echo "$STEPS_CONTEXT"
      - name: Dump runner context
        env:
          RUNNER_CONTEXT: ${{ toJson(runner) }}
        run: echo "$RUNNER_CONTEXT"
      - name: Dump strategy context
        env:
          STRATEGY_CONTEXT: ${{ toJson(strategy) }}
        run: echo "$STRATEGY_CONTEXT"
      - name: Dump matrix context
        env:
          MATRIX_CONTEXT: ${{ toJson(matrix) }}
        run: echo "$MATRIX_CONTEXT"
```

## Licenses

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
