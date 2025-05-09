#!/bin/bash

json_file=$1  # The first argument passed to the script is the JSON file

# Check if json_file is provided and the file exists
mkdir -p ./data
if [ -f "$json_file" ]; then
  echo "Copying $json_file to ./data/repos-list.json"
  cp "$json_file" ./data/repos-list.json
else
  echo "$json_file not found. Copying ./config/repos-list.json to ./data/repos-list.json"
  cp ./config/repos-list.json ./data/repos-list.json
fi

current_dir=$(pwd)

bash ./src/npm/npm-overall.sh

bash ./src/yarn/yarn-overall.sh

#Check the status to packages - deprecated or active 
rm -rf ./data/sbom-components-csv-deprecated/*
mkdir -p ./data/sbom-components-csv-deprecated
cd ./src
node find-deprecated.js
cd $current_dir

#Append the last publish details
rm -rf ./data/sbom-repo-wise/*
mkdir -p ./data/sbom-repo-wise
cd ./src
bash publish-details.sh
cd $current_dir

#Map unique dependencies accross all services and identify versions
cd ./src
node map-dependencies.js 
cd $current_dir

#Append last publish details 
cd ./src
bash last-publish.sh
cd $current_dir

#Final csv- Find all unique components accross al repositories and merge it to dependencies 
cd ./src
node sbom-components-to-csv.js 
cd $current_dir

rm -rf ./data/npm
rm -rf ./data/yarn
rm -rf ./data/sbom-components-csv
rm -rf ./data/sbom-components-csv-deprecated
rm -rf ./data/sbom-dependencies-csv
rm ./data/components-dependencies.csv
rm ./data/dependency-services.csv
rm ./data/dependencies-services-last-publish.csv

echo "Thank you for using our SBOM processing tool! 🎉

✨ Processing Complete!
- Individual SBOMs for each repository have been successfully generated and are stored in:
  src/sbom-components-csv-publish/

- The aggregated SBOM for all repositories is available here:
  src/SBOM-aggregate.csv

We appreciate your effort in ensuring software transparency and security! 🚀"