#!/bin/bash

# Path to the JSON file
JSON_FILE="./data/repos-list.json"

# Target directory for downloaded SBOMs
TARGET_DIR="./data/sbom-csv"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Read npm and yarn arrays from the JSON file
NPM_REPOS=$(jq -r '.npm[]' "$JSON_FILE")
YARN_REPOS=$(jq -r '.yarn[]' "$JSON_FILE")

# Process npm repos
for REPO in $NPM_REPOS; do
  FILE_URL="https://raw.githubusercontent.com/mojaloop/$REPO/main/sbom-npm.csv"
  OUTPUT_FILE="$TARGET_DIR/${REPO}-sbom-npm.csv"

  echo "Downloading sbom-npm.csv from $REPO..."
  curl -s -f "$FILE_URL" -o "$OUTPUT_FILE"

  if [ $? -eq 0 ]; then
    echo "✔ Downloaded to $OUTPUT_FILE"
  else
    echo "⚠ Failed to download sbom-npm.csv from $REPO"
    rm -f "$OUTPUT_FILE"
  fi
done

# Process yarn repos
for REPO in $YARN_REPOS; do
  FILE_URL="https://raw.githubusercontent.com/mojaloop/$REPO/main/sbom-yarn.csv"
  OUTPUT_FILE="$TARGET_DIR/${REPO}-sbom-yarn.csv"

  echo "Downloading sbom-yarn.csv from $REPO..."
  curl -s -f "$FILE_URL" -o "$OUTPUT_FILE"

  if [ $? -eq 0 ]; then
    echo "✔ Downloaded to $OUTPUT_FILE"
  else
    echo "⚠ Failed to download sbom-yarn.csv from $REPO"
    rm -f "$OUTPUT_FILE"
  fi
done

echo "All done."
