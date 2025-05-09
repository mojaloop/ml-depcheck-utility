JSON_FILE="../../../data/repos-list.json"
npm_repos=$(jq -r '.npm[]' "$JSON_FILE")

# Save the current directory to return to it later
SCRIPT_DIR=$(pwd)

# Loop through each repository in the list 
for repo in $npm_repos; do
  echo "Generating SBOM for $repo, please wait ..."
  
  # Navigate to the repository directory
  if ! cd "$repo"; then
    echo "Failed to navigate to $repo, skipping..."
    continue
  fi
  
  # Install dependencies and generate SBOM
  echo "Installing dependencies for $repo..."
  npm install --ignore-scripts --leg --force
  
  echo "Generating SBOM for $repo..."
  npx cyclonedx-npm --ignore-npm-errors --output-format "XML" --output-file "../../../../data/npm/xml/${repo}-sbom.xml"
  
  # Return to the repos directory
  cd "$SCRIPT_DIR" || { echo "Failed to return to repos directory"; exit 1; }
done

# Return to original directory
cd "$SCRIPT_DIR" || { echo "Failed to return to original directory"; exit 1; }
echo "SBOM generation complete!"