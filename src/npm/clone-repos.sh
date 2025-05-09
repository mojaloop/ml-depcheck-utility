#!/bin/bash

# Path to the JSON file
JSON_FILE="../../../data/repos-list.json"

# Extract the list of npm repositories from the JSON file
npm_repos=$(jq -r '.npm[]' "$JSON_FILE")

# Clone each repository from the npm list
for repo in $npm_repos; do
  echo "Creating repo $repo, please wait ..."
  git clone https://github.com/mojaloop/"$repo".git
done