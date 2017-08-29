# Contribution Guidelines

## Getting Started

Install the following homebrew dependencies:
```
brew install jq wget poppler
```

Run:
```
npm install
```

Make changes on a feature branch, then open a pull request. Make sure CI passes on your branch, and you include any relevant new tests.

### Generating data
To regenerate and validate data, do the following:

```
npm run build:measures          # generates measures/measures-data.json and measures/measures-data.xml, validates measures-data.json
npm run build:benchmarks        # generates benchmarks/2017.json
npm run build:clinical-clusters # generates clinical-clusters/clinical-clusters.json
```

### Validation

We've provided a simple tool to validate JSON against our JSON schemas. By providing an argument to indicate the schema against which to validate, it can be used as follows:
```
cat [path to JSON] | node scripts/validate-data.js [measures | benchmarks | clinical-clusters]
```

### Additional measures or benchmarks

`util/measures/additional-measures.json` includes data objects which are necessary for scoring but are not MIPS measures. Any additional measures should be added to this file, followed by a re-generation of measures data using the command described in the "Generating Data" section.

At this time `util/measures/additional-measures.json` includes:

1. **Attestations:** Attestations are pre-requisites of submitting additional measurements for a given category.
2. **Exclusions:** Exclusions are optional attestations of conditions which exempt the provider from a corresponding (required) measure. For example, submitting `true` to `ACI_LVPP_1` exempts a user from submitting data for the required measure `ACI_EP_1`.

Similarly, `util/benchmarks/additional-benchmarks-2017.json` contains benchmark data that is necessary for scoring but not included in the historical CSV file. Any additional benchmarks should be added to this file, followed by a re-generation of benchmarks data.

## Testing

When making changes to measures-data, include tests in the tests directory and make sure existing tests still pass using:

```
npm test
```

We also use Travis CI to run tests on every branch.

## Publish

To publish a new version, make sure you've bumped the `version` in `package.json`, then:
```
npm login # as cmsgov
npm publish
```

## Licenses

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
