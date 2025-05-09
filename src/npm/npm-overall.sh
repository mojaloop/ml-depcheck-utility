#!/bin/bash

echo "Starting the sbom generation and analysis process" 

#export github token here 

export PATH=$HOME/.nvm/versions/node/v20.16.0/bin:$PATH

current_dir=$(pwd)
#cd $current_dir

#Cloning the repositories
rm -rf ./data/npm/cloned-repos/*
mkdir -p ./data/npm/cloned-repos
cd ./data/npm/cloned-repos
bash ../../../src/npm/clone-repos.sh
cd $current_dir

#Generate sboms for all repos 
rm -rf ./data/npm/xml/*
mkdir -p ./data/npm/xml
cd ./data/npm/cloned-repos
bash ../../../src/npm/generate-sboms.sh
cd $current_dir

#Generate dependencies for each repo 
mkdir -p ./data/sbom-dependencies-csv
cd ./src/npm
bash automate-dependencies-csv.sh 
cd $current_dir

#Generate components for each repo 
mkdir -p ./data/sbom-components-csv
cd ./src/npm
bash automate-components-csv.sh 
cd $current_dir
