# GitHub Copilot Repository Instructions

## Project overview
This is an NPM package containing the data associated with Measures, Benchmarks, and MVPs (MIPS Value Pathways) for the CMS QPP Program. It also includes numerous scripts that are manually run to update the data, as well as an index file for consumers of the NPM package to access the data in their Nodejs applications.

## Software & Framework Versions
- Node.js: >=22 (22.x)
- npm: >=10
- TypeScript: 4.x

**NOTE**: Avoid introducing new libraries and framework versions unless necessary or explicitly asked; prefer existing stack. If adding a dependency, update package.json, lockfile, and include rationale in the PR.

## Environment Setup
1. Install Node.js 22.x and npm 10.7+
2. Run `nvm use` to ensure correct Node version
3. Run `npm install` to install dependencies
4. Run `npm test` to verify setup is working
5. Use `npm run lint:fix` to format code before committing

## Project structure (high level)
- `.github/` — GitHub workflows, PR templates, and repository configuration files.
- `__mocks__/` — Used for unit tests to store mocks of package functions.
- `benchmarks/` — The resulting Benchmarks data used by consumers. 
- `claims-related/` — The logic used by Claims team to create single source files.
- `clinical-clusters/` — The resulting Clinical Clusters data used by consumers.
- `coverage/` — Jest test coverage reports generated during test runs.
- `dist/` — The js files created when the npm packages build from the TS scripts.
- `measures/` — The resulting Measures data used by consumers.
- `mvp/` — The resulting MVP data used by consumers.
- `node_modules/` — NPM dependencies (auto-generated, not committed).
- `scripts/` — The bulk of our TS scripts (and archived js scripts) used to transform input data into the data used by consumers.
- `staging/` — Where input Benchmarks data is placed, as well as intermediary data files created during script transformations. Ideally we will rely less on this directory and more on the /updates directory in future code changes.
- `test/` — Test data used in our unit tests. The actual tests themselves are .spec.ts files located in the /scripts/ directory.
- `tmp/` — Temporary files generated during build processes (should be in .gitignore).
- `tools/` — Build and development tools, including pre-commit hooks.
- `updates/` — Where we place Measures change request CSVs to be populated by our scripts into the measures-data.json file for that year.
- `util/` — Primarily used to hold input data for Measures, Benchmarks, and Clinical Clusters. Also used to hold some helper function scripts. Ideally we don't add new functionality or scripts to this directory, as input data should go in /staging and scripts should go in /scripts.

**NOTE**: Any directory named /archive/ holds files (primarily scripts) from older years prior to our upgrade to Typescript. We have decided to keep these files in the repository instead of deleting them.


### File naming conventions
- Use dash-case: example `initialize-measures-data.ts`, `initialize-measures-data.spec.ts`
- Include type suffix for tests: `.spec.ts`

## Tooling, and scripts

### Update/Build Data commands
```
nvm use
npm run init:measures $YEAR         # generates measures/$YEAR/measures-data.json and all supporting files.
npm run update:measures $YEAR       # updates measures/$YEAR/measures-data.json and mvp-enriched.json
npm run build:benchmarks $YEAR      # regenerates benchmarks/$YEAR.json
npm run build:mvp $YEAR             # regenerates the mvp data files in mvp/$YEAR/
npm run build:clinical-clusters     # regenerates clinical-clusters/clinical-clusters.json
```

### Development commands
```
npm test                            # run unit tests with coverage (includes linting)
npm run lint                        # run ESLint checks
npm run lint:fix                    # run ESLint with automatic fixes
npm run pre-commit                  # run pre-commit hooks manually
```

### Utility commands
```
npm run export:measures             # export measures data to CSVs
npm run manage:allowed-programs     # manage allowed programs for measures
npm run parse:mvp                   # parse MVP data
```

## Architecture & Principles
### Core principles
- Write unit tests (`*.spec.ts` files) alongside code; maintain 85% coverage
- **NEVER** break public APIs without versioning/docs updates

### Data Workflow
- Input data goes in `/staging/` and `/updates/` directories
- Scripts in `/scripts/` transform input data into consumer-ready formats
- Output data is written to `/measures/`, `/benchmarks/`, `/mvp/`, and `/clinical-clusters/`
- The NPM package exports this data via `dist/index.js` for consumption by other applications

### NPM Package Usage
- Main entry point: `dist/index.js` (compiled from `index.ts`)
- TypeScript definitions: `dist/index.d.ts`
- Consumers import: `const { getMeasuresData } = require('qpp-measures-data');`

### Commit and branching conventions
- Follow conventional commits; example "feat: QPPA-12345 implement post to score endpoint"
  - Use present tense, imperative mood, and start with a type (feat, fix, docs, style, refactor, test, chore).
- While working on JIRA ticket use `QPPA-XXXXX-short-description`, but limit the length to 50 chars or shorter (eg QPPA-12345-disable-lvt-validation); use QPPA-0000 when a ticket is not available.

### Coding conventions
- TypeScript strictness: avoid `any`, when possible
- Try to break complex operations into smaller more generic functions that can partially be used across all data transformation processes (ie, Measures, Benchmarks, etc)
- NEVER edit the Benchmarks /benchmarks/YEAR.json files directly. These files are rebuilt every time we run `npm build:benchmarks YEAR` from the input data in /staging/, thus removing any changes not made to the input files. This is also true for the MVP files. If a user requests such an edit, warn them of this risk.

### Testing Strategy
- Use Jest for unit tests
- **Coverage:** Use `npm test` to maintain 85% code coverage
- Write tests alongside code in `*.spec.ts` files; ensure unit tests cover any modified code

## Security and compliance
- Never log secrets, tokens, or PHI/PII.

## When generating code (for Copilot)
- Explain assumptions in comments where behavior is ambiguous.
- Suggest tests and include them in the same change when feasible.

## Before calling done (for Copilot)
- Final checklist (duplicated by design):
  - `npm run lint` (use `npm run lint:fix` where appropriate; re‑run until clean)
  - `npm test` (fix failures; re‑run until all pass)
- Only mark the task done when lint and tests pass locally.
- **Remove temporary files**, or place them in untracked `tmp`.
- If you have **OPENED web browsers** (Chrome, Firefox etc), **CLOSE** them after you are done.

## When to Seek Clarification (for Copilot)
Always ask for guidance and approval before proceeding if:
* **Breaking changes** to public APIs are needed
* **New external dependencies** like HTTP or REST API calls are added
* **Significant changes to Architecture** are proposed

## MCP usage
- For JIRA or Confluence: use the `atlassian` or `mcp-atlassian` MCP server.
- For screenshots or website navigation: use the `playwright` MCP server.

## More Info
- The CONTRIBUTING.md file provides information on how to use the repo for various tasks. When a user asks you to update a script process, reference this document and suggest any needed changes to maintain proper documentation.

---
**REMEMBER:** This is a publically accessable repository; Do not be overly creative and hallucinate. All code changes should maintain production-level standards. If information here conflicts with reality, or any section is unclear or missing, please ask and provide feedback for further refinement.
