#!/bin/bash

# GitHub org
ORG="mojaloop"

# JSON config file
JSON_FILE="./data/repos-list.json"
TARGET_DIR="./data/sbom-csv"

mkdir -p "$TARGET_DIR"

# GitHub API base
API_URL="https://api.github.com/repos"

# Helper: Get SBOM file name from GitHub API for a given pattern
get_sbom_file_name() {
  local repo=$1
  local pattern=$2

  curl -s "$API_URL/$ORG/$repo/contents" | grep -oP "\"name\":\s*\"$pattern[^\"]*\.csv\"" | head -n 1 | sed -E 's/.*"([^"]+)".*/\1/'
}

# Parse arrays from JSON
NPM_REPOS=$(jq -r '.npm[]' "$JSON_FILE")
YARN_REPOS=$(jq -r '.yarn[]' "$JSON_FILE")

# Process npm repos
for REPO in $NPM_REPOS; do
  echo "⏳ Checking SBOM for $REPO (npm)..."
  FILE_NAME=$(get_sbom_file_name "$REPO" "sbom-npm")

  if [ -n "$FILE_NAME" ]; then
    curl -s -f -L "https://raw.githubusercontent.com/$ORG/$REPO/main/$FILE_NAME" -o "$TARGET_DIR/${REPO}-$FILE_NAME"
    echo "✔ Downloaded to $TARGET_DIR/${REPO}-$FILE_NAME"
  else
    echo "⚠ No sbom-npm CSV found for $REPO"
  fi
done

# Process yarn repos
for REPO in $YARN_REPOS; do
  echo "⏳ Checking SBOM for $REPO (yarn)..."
  FILE_NAME=$(get_sbom_file_name "$REPO" "sbom-yarn")

  if [ -n "$FILE_NAME" ]; then
    curl -s -f -L "https://raw.githubusercontent.com/$ORG/$REPO/main/$FILE_NAME" -o "$TARGET_DIR/${REPO}-$FILE_NAME"
    echo "✔ Downloaded to $TARGET_DIR/${REPO}-$FILE_NAME"
  else
    echo "⚠ No sbom-yarn CSV found for $REPO"
  fi
done

echo "✅ All done."
