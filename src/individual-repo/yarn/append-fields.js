const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pLimit = require('p-limit').default;
const { createObjectCsvWriter } = require('csv-writer');

const inputFile = './tmp/result-individual/SBOM.csv';
const outputFile = './tmp/result-individual/SBOM-final.csv';
const CONCURRENCY_LIMIT = 10;
const limit = pLimit(CONCURRENCY_LIMIT);

// Read file
fs.readFile(inputFile, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    const lines = data.trim().split('\n');
    const headers = lines[0].split(',');
    const bomRefIndex = headers.indexOf('bom_ref');

    if (bomRefIndex === -1) {
        console.error('bom_ref field not found in header.');
        return;
    }

    // Add new headers
    const newHeaders = [...headers, 'author-email', 'deprecated-status', 'deprecation-reason', 'timestamp'];

    // Extract rows
    const rows = lines.slice(1).map(line => line.split(','));

    // Prepare results with concurrency limit
    const augmentedRows = await Promise.all(rows.map(row => limit(async () => {
        try {
            const dependency = row[bomRefIndex].split("|").pop();
            const lastAtIndex = dependency.lastIndexOf('@');
            const name = dependency.substring(0, lastAtIndex);
            const version = dependency.substring(lastAtIndex + 1);

            // Encode scoped packages for URL
            const encodedName = encodeURIComponent(name);

            const url = `https://registry.npmjs.org/${encodedName}`;
            const res = await axios.get(url);
            const metadata = res.data;

            const versionInfo = metadata.versions[version] || {};
            const email = versionInfo.author?.email || '';
            const deprecated = versionInfo.deprecated ? 'deprecated' : 'active';
            const reason = versionInfo.deprecated || 'Active in npm registory';
            const modified = metadata.time?.modified || '';

            return [...row, email, deprecated, reason, modified];
        } catch (error) {
            console.warn(`Failed for row: ${row[bomRefIndex]}`, error.message);
            return [...row, '', '', '', ''];
        }
    })));

    // Write to new CSV
    const csvWriter = createObjectCsvWriter({
        path: outputFile,
        header: newHeaders.map(h => ({ id: h, title: h })),
    });

    // Convert rows to object form
    const outputRecords = augmentedRows.map(row => {
        const record = {};
        newHeaders.forEach((h, i) => {
            record[h] = row[i] || '';
        });
        return record;
    });

    await csvWriter.writeRecords(outputRecords);
    console.log(`✅ Augmented CSV written to: ${outputFile}`);
});
