#!/bin/bash

#Install xslt processor
sudo apt update
sudo apt install -y xsltproc

# Get repo version from package.json
if [ -n "$1" ]; then
  REPO_VERSION="$1"
else
  REPO_VERSION="v$(node -p "require('./package.json').version")"
fi

# Detect this script's root (inside CLI package)
SCRIPT_DIR="$(cd "$(dirname "$(realpath "$0")")" && pwd)"

#Install dependencies
if ! npm install; then
  echo "npm install failed, retrying with --legacy-peer-deps..."
  if ! npm install --ignore-scripts --legacy-peer-deps --force; then
    echo "npm install failed after retrying."
    exit 0
  fi
fi

#Make temporary directory
mkdir -p ./tmp

#Generate SBOM
mkdir -p ./tmp/result-individual
if ! npx --yes --package @cyclonedx/cyclonedx-npm@3.0.0 -- cyclonedx-npm --ignore-npm-errors --output-format "XML" --output-file "./tmp/result-individual/SBOM.xml"; then
  echo "SBOM generation failed. Exiting gracefully."
  exit 0 
fi

#Convert SBOM into csv fornat
xsltproc $SCRIPT_DIR/components.xslt "./tmp/result-individual/SBOM.xml" > "./tmp/result-individual/SBOM.csv"

#Append fields to sbom - deprecated and last publish
node $SCRIPT_DIR/append-fields.js

# Save the SBOM with version in filename
FINAL_SBOM_NAME="sbom-$REPO_VERSION.csv"
mv tmp/result-individual/SBOM-final.csv "$FINAL_SBOM_NAME"

#Delete files
rm -rf ./tmp

# Check if SBOM was saved
[ -f "$FINAL_SBOM_NAME" ] && echo "🎉 Thank you! SBOM successfully generated and saved as $FINAL_SBOM_NAME" || echo "SBOM file not found. Please check for errors."