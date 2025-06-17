#!/bin/bash

# GitHub org
ORG="mojaloop"

# JSON config file
JSON_FILE="./data/repos-list.json"
TARGET_DIR="./data/sbom-csv"

mkdir -p "$TARGET_DIR"

# GitHub API base
API_URL="https://api.github.com/repos"

# Get the first sbom-v*.csv file name (from root of main branch)
get_sbom_file_name() {
  local repo=$1

  curl -s "$API_URL/$ORG/$repo/contents" \
    | jq -r '.[] | select(.name | test("^sbom-v.*\\.csv$")) | .name' \
    | head -n 1
}

# Parse arrays from JSON
REPOS=$(jq -r '.repos[]' "$JSON_FILE")

# Download one matching SBOM file per repo
download_sbom_file() {
  local repo=$1
  local type=$2

  echo "⏳ Checking SBOM for $repo ($type)..."

  FILE_NAME=$(get_sbom_file_name "$repo")

  if [ -n "$FILE_NAME" ]; then
    curl -s -f -L "https://raw.githubusercontent.com/$ORG/$repo/main/$FILE_NAME" \
      -o "$TARGET_DIR/${repo}.csv"
    echo "✔ Downloaded $FILE_NAME to $TARGET_DIR/${repo}-$FILE_NAME"
  else
    echo "⚠ No sbom CSV file found for $repo"
  fi
}

# Process repos
for REPO in $REPOS; do
  download_sbom_file "$REPO" "npm"
done

echo "✅ All done."
