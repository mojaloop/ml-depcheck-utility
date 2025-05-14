#!/bin/bash

#Install xslt processor
apk add --no-cache libxslt

#Install dependencies
npm install --ignore-scripts --legacy-peer-deps --force

#Generate SBOM
mkdir -p ./tmp/result-individual
npx cyclonedx-npm --ignore-npm-errors --output-format "XML" --output-file "./tmp/result-individual/SBOM.xml"

#Convert SBOM into csv fornat
xsltproc tmp/ml-depcheck-utility/src/individual-repo/npm/components.xslt "./tmp/result-individual/SBOM.xml" > "./tmp/result-individual/SBOM.csv"

#Append fields to sbom - deprecated and last publish
node tmp/ml-depcheck-utility/src/individual-repo/npm/append-fields.js

#Save the sbom generated
mv tmp/result-individual/SBOM-final.csv sbom-npm.csv

#Delete files
rm -rf ./tmp

[ -f sbom.csv ] && echo "🎉 Thank you! SBOM successfully generated and saved as sbom.csv" || echo "SBOM file not found. Please check for errors."