#!/usr/bin/env bash

if [[ `git symbolic-ref --short HEAD` == 'master' ]]; then
    npm test
fi
