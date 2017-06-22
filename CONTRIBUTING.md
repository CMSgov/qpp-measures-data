## Develop

Install the following homebrew dependencies:
```
brew install jq wget poppler
```

Run:
```
npm install
```

Make changes on a feature branch, then open a pull request. Make sure CI passes on your branch, and you include any relevant new tests.

### Generating measures-data.json
To regenerate the `measures-data.json` and `measures-data.xml` files, which contain additional metadata and conform to
the measures schema, do the following:

```
npm start
```

### Generating benchmarks data
To regenerate benchmarks data from historical data use the `scripts/parse-benchmarks-data.js` script
like so:
```
cat data/historical-benchmarks/2015.csv | node scripts/parse-benchmarks-data.js 2015 2017
```

### Validation

We've provided a simple tool to validate JSON against our JSON schema.
For example, running
```
cat measures/measures-data.json | node scripts/validate-data.js measures
```
validates the latest version of `measures-data.json` against the latest `measures-schema.yaml`.

To validate measures against `measures-schema.yaml`, run:
```
cat [path to measures JSON] | node scripts/validate-data.js measures
```
To validate benchmarks against `benchmarks-schema.yaml`, run:
```
cat [path to benchmarks JSON] | node scripts/validate-data.js benchmarks
```

### Additional measures

`util/additional-measures.json` includes data objects which are necessary for scoring but are not MIPS measures. At this time `util/additional-measures.json` includes:

1. **Attestations:** Attestations are pre-requisites of submitting additional measurements for a given category.
2. **Exclusions:** Exclusions are optional attestations of conditions which exempt the provider from a corresponding (required) measure. For example, submitting `true` to `ACI_LVPP_1` exempts a user from submitting data for the required measure `ACI_EP_1`.
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
