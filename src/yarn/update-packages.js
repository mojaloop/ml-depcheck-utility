const fs = require('fs');
const path = require('path');

// Specify the JSON file containing the list of filenames
const jsonFilePath = '../../data/repos-list.json';

// Specify the input and output folders
const inputFolder = '../../data/sbom-components-csv';
const outputFolder = '../../data/sbom-components-csv';

// Ensure the output folder exists
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

// Read the list of filenames from the JSON file
let fileNames = [];

try {
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    fileNames = jsonData.yarn || [];
    console.log(`✅ Loaded ${fileNames.length} filenames from ${jsonFilePath}`);
} catch (error) {
    console.error(`❌ Error reading JSON file (${jsonFilePath}):`, error.message);
    process.exit(1);
}

// Function to process a single CSV file
function processCsv(inputFilePath, outputFilePath) {
    fs.readFile(inputFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading input file (${inputFilePath}):`, err);
            return;
        }

        const lines = data.split('\n');

        // First line is the header
        const header = lines[0];
        const rows = lines.slice(1);

        const headers = header.split(',');

        // Find the index of the bom_ref column
        const bomRefIndex = headers.indexOf('bom_ref');

        if (bomRefIndex === -1) {
            console.error(`bom_ref column not found in CSV header for file: ${inputFilePath}`);
            return;
        }

        // Prepare the output
        const output = [header];

        rows.forEach((row) => {
            if (row.trim() === '') {
                return; // skip empty lines
            }

            const columns = row.split(',');

            let bomRef = columns[bomRefIndex];

            if (bomRef) {
                // Remove "npm:" if present
                bomRef = bomRef.replace(/@npm:/, '@');

                // Remove anything like " [something]" after version
                bomRef = bomRef.replace(/\s*\[.*?\]/, '');

                columns[bomRefIndex] = bomRef;
            }

            output.push(columns.join(','));
        });

        // Write the cleaned CSV to output file
        fs.writeFile(outputFilePath, output.join('\n'), (err) => {
            if (err) {
                console.error(`Error writing output file (${outputFilePath}):`, err);
            } else {
                console.log(`✅ Successfully cleaned bom_ref and saved to ${outputFilePath}`);
            }
        });
    });
}

// Process all files in the list
fileNames.forEach((fileName) => {
    const inputFileName = `${fileName}-sbom.csv`;
    const outputFileName = `${fileName}-sbom.csv`;

    const inputFilePath = path.join(inputFolder, inputFileName);
    const outputFilePath = path.join(outputFolder, outputFileName);

    console.log(`Processing file: ${inputFileName}`);
    processCsv(inputFilePath, outputFilePath);
});