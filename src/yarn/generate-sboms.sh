JSON_FILE="../../../data/repos-list.json"
yarn_repos=$(jq -r '.yarn[]' "$JSON_FILE")

# Save the current directory to return to it later
SCRIPT_DIR=$(pwd)

# Loop through each repository in the list 
for repo in $yarn_repos; do
  echo "Generating SBOM for $repo, please wait ..."
  
  # Navigate to the repository directory
  if ! cd "$repo"; then
    echo "Failed to navigate to $repo, skipping..."
    continue
  fi
  
  # Install dependencies and generate SBOM
  echo "Installing dependencies for $repo..."
  yarn set version stable
  yarn install --mode=skip-build
  
  echo "Generating SBOM for $repo..."
  yarn dlx @cyclonedx/yarn-plugin-cyclonedx --of XML -o ../../../../data/yarn/xml/${repo}-sbom.xml
  
  # Return to the repos directory
  cd "$SCRIPT_DIR" || { echo "Failed to return to repos directory"; exit 1; }
done

# Return to original directory
cd "$SCRIPT_DIR" || { echo "Failed to return to original directory"; exit 1; }
echo "SBOM generation complete!"