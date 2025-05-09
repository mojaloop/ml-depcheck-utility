#!/bin/bash

echo "Starting the sbom generation and analysis process" 

#export github token here 

export PATH=$HOME/.nvm/versions/node/v20.16.0/bin:$PATH

current_dir=$(pwd)

#Cloning the repositories
rm -rf ./data/yarn/cloned-repos/*
mkdir -p ./data/yarn/cloned-repos
cd ./data/yarn/cloned-repos
bash ../../../src/yarn/clone-repos.sh
cd $current_dir

#Generate sboms for all repos 
rm -rf ./data/yarn/xml/*
mkdir -p ./data/yarn/xml
cd ./data/yarn/cloned-repos
bash ../../../src/yarn/generate-sboms.sh
cd $current_dir

#Generate dependencies for each repo 
cd ./src/yarn
bash automate-dependencies-csv.sh 
cd $current_dir

#Generate components for each repo 
cd ./src/yarn
bash automate-components-csv.sh 
cd $current_dir

#Update yarn package names to match the other packages 
cd ./src/yarn
node update-packages.js
cd $current_dir
