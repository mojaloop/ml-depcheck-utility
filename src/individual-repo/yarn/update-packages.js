const fs = require('fs');
const path = require('path');

// Input and output file paths
const inputFilePath = './tmp/result-individual/SBOM.csv';
const outputFilePath = './tmp/result-individual/SBOM.csv';

// Function to process the CSV
function processCsv(inputFilePath, outputFilePath) {
    fs.readFile(inputFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`❌ Error reading input file (${inputFilePath}):`, err);
            return;
        }

        const lines = data.split('\n');
        const header = lines[0];
        const rows = lines.slice(1);

        const headers = header.split(',');
        const bomRefIndex = headers.indexOf('bom_ref');

        if (bomRefIndex === -1) {
            console.error(`❌ 'bom_ref' column not found in header of ${inputFilePath}`);
            return;
        }

        const output = [header];

        rows.forEach((row) => {
            if (row.trim() === '') return;

            const columns = row.split(',');

            let bomRef = columns[bomRefIndex];
            if (bomRef) {
                bomRef = bomRef.replace(/@npm:/, '@');         // Remove "@npm:" prefix
                bomRef = bomRef.replace(/\s*\[.*?\]/, '');     // Remove " [something]" suffix
                columns[bomRefIndex] = bomRef;
            }

            output.push(columns.join(','));
        });

        fs.writeFile(outputFilePath, output.join('\n'), (err) => {
            if (err) {
                console.error(`❌ Error writing to ${outputFilePath}:`, err);
            } else {
                console.log(`✅ Successfully cleaned bom_ref and saved to ${outputFilePath}`);
            }
        });
    });
}

// Run it
console.log(`🔄 Processing file: ${inputFilePath}`);
processCsv(inputFilePath, outputFilePath);
