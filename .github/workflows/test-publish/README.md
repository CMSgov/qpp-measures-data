# Resources
* https://github.com/nektos/act
* copy .actrc.template to .actrc
* add a GitHub PAT to .actrc

# act runner for GitHub Action

# Command structure:
act [<event>] [options]
If no event name passed, will default to "on: push"

# List the actions for the default event:
```
act -l
```

# List the actions for a specific event:
act workflow_dispatch -l

# Run the default (`push`) event:
act

# Run a specific job:
act -j test

# Run in dry-run mode:
act -n

# Enable verbose-logging (can be used with any of the above commands)
act -vv

# With Watch and Verbose
```
act -j codebuild_trigger --watch --verbose

## Unit Test Only
* PR to develop; i.e. the standard path for merging new dev code to develop
```
act published -vv -b -j repo-dispatch -e .github/workflows/test-publish/publish-test.json --no-recurse
```