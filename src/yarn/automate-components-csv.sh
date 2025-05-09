repos=$(ls ../../data/yarn/xml)

for repo in $repos; do 
    #echo "Generating dependencies for $repo"

    IFS="." read -r -a array <<< "$repo"
    OUTPUT_FILE="${array[0]}.csv"

    xsltproc components.xslt "../../data/yarn/xml/$repo" > "../../data/sbom-components-csv/$OUTPUT_FILE"

    echo $OUTPUT_FILE

done