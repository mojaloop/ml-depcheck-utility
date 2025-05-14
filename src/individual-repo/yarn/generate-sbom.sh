#!/bin/bash

#Install xslt processor
apk add --no-cache libxslt

#Install dependencies
yarn set version stable
yarn install --mode=skip-build

#Generate SBOM
mkdir -p ./tmp/result-individual
yarn dlx @cyclonedx/yarn-plugin-cyclonedx --of XML -o "./tmp/result-individual/SBOM.xml"

#Convert SBOM into csv fornat
xsltproc tmp/ml-depcheck-utility/src/individual-repo/yarn/components.xslt "./tmp/result-individual/SBOM.xml" > "./tmp/result-individual/SBOM.csv"

#Update packages to make it compatible with npm repositories 
node tmp/ml-depcheck-utility/src/individual-repo/yarn/update-packages.js

#Append fields to sbom - deprecated and last publish
node tmp/ml-depcheck-utility/src/individual-repo/yarn/append-fields.js

#Save the sbom generated
mv tmp/result-individual/SBOM-final.csv sbom-yarn.csv

#Delete files
rm -rf ./tmp

[ -f sbom.csv ] && echo "🎉 Thank you! SBOM successfully generated and saved as sbom.csv" || echo "SBOM file not found. Please check for errors."
