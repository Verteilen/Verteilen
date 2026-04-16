#!/bin/bash

npm cache clean --force && npm install verteilen-core && cat package.json | grep core