#!/bin/bash

#Install xslt processor
apk add --no-cache libxslt

# Get repo version from package.json
REPO_VERSION=$(node -p "require('./tmp/ml-depcheck-utility/package.json').version")

#Install dependencies
npm install --ignore-scripts --legacy-peer-deps --force

#Generate SBOM
mkdir -p ./tmp/result-individual
npx cyclonedx-npm --ignore-npm-errors --output-format "XML" --output-file "./tmp/result-individual/SBOM.xml"

#Convert SBOM into csv fornat
xsltproc tmp/ml-depcheck-utility/src/individual-repo/npm/components.xslt "./tmp/result-individual/SBOM.xml" > "./tmp/result-individual/SBOM.csv"

#Append fields to sbom - deprecated and last publish
node tmp/ml-depcheck-utility/src/individual-repo/npm/append-fields.js

# Save the SBOM with version in filename
FINAL_SBOM_NAME="sbom-npm-v$REPO_VERSION.csv"
mv tmp/result-individual/SBOM-final.csv "$FINAL_SBOM_NAME"

#Delete files
rm -rf ./tmp

# Check if SBOM was saved
[ -f "$FINAL_SBOM_NAME" ] && echo "🎉 Thank you! SBOM successfully generated and saved as $FINAL_SBOM_NAME" || echo "SBOM file not found. Please check for errors."