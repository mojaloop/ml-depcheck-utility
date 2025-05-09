import fs from 'fs';
import path from 'path';
import pacote from 'pacote';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import pLimit from 'p-limit';
import fetch from 'node-fetch'; // Use node-fetch to fetch additional details
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create output directory if it doesn't exist
const inputDir = '../data/sbom-components-csv';
const outputDir = '../data/sbom-components-csv-deprecated';

// Concurrency limit — tweak this if needed
const limit = pLimit(10);

// Load repository list from JSON file
const reposFilePath = path.join(__dirname, '../data/repos-list.json');
let ML_REPO_LIST = [];

try {
    const reposData = JSON.parse(fs.readFileSync(reposFilePath, 'utf8'));
    ML_REPO_LIST = [...(reposData.npm || []), ...(reposData.yarn || [])];
    console.log(`✅ Loaded ${ML_REPO_LIST.length} repositories from ${reposFilePath}`);
} catch (error) {
    console.error(`❌ Error reading repositories from ${reposFilePath}:`, error.message);
    process.exit(1);
}

// Function to check package status using pacote and fetch additional publish details
async function checkPackageStatus(packageName, version) {
    try {
        console.log(`📡 Checking status for: ${packageName}@${version}`);

        // Use pacote to fetch package metadata
        const manifest = await pacote.manifest(`${packageName}@${version}`);

        // If the version is deprecated, return the deprecation details
        if (manifest.deprecated) {
            console.log(`⚠️ Version ${version} is deprecated in npm: ${packageName}`);
            return {
                deprecated_status: 'DEPRECATED',
                publish_details: '', // We'll fetch the time explicitly below
                reason: manifest.deprecated
            };
        }

        // Fetch the `time` property (publish details) directly from the npm registry API
        const npmResponse = await fetch(`https://registry.npmjs.org/${packageName}`);
        if (npmResponse.ok) {
            const npmData = await npmResponse.json();
            const publishDetails = npmData.time?.[version] || '';
            console.log(`✅ Package is active in npm: ${packageName}@${version}, published on: ${publishDetails}`);
            return {
                deprecated_status: 'active',
                publish_details: publishDetails,
                reason: 'Active in npm registry'
            };
        }

        console.log(`📦 Package not found in npm registry: ${packageName}`);
        return {
            deprecated_status: 'unknown',
            publish_details: '',
            reason: 'Package not found in npm registry'
        };
    } catch (err) {
        console.error(`❌ Error checking ${packageName}@${version}:`, err.message);
        return {
            deprecated_status: 'unknown',
            publish_details: '',
            reason: `Error: ${err.message}`
        };
    }
}

async function processCsv(repo) {
    const inputFile = path.join(inputDir, `${repo}-sbom.csv`);
    const outputFile = path.join(outputDir, `${repo}-sbom.csv`);

    if (!fs.existsSync(inputFile)) {
        console.log(`⚠️ Input file not found: ${inputFile}`);
        return;
    }

    console.log(`\n🔍 Processing ${repo}...`);
    
    const records = [];
    const headers = [];

    await new Promise((resolve, reject) => {
        fs.createReadStream(inputFile)
            .pipe(csv())
            .on('headers', (h) => headers.push(...h))
            .on('data', (row) => records.push(row))
            .on('end', resolve)
            .on('error', reject);
    });

    const csvWriter = createObjectCsvWriter({
        path: outputFile,
        header: [
            ...headers.map(h => ({ id: h, title: h })),
            { id: 'publish_details', title: 'publish_details' },
            { id: 'deprecated_status', title: 'deprecated_status' },
            { id: 'reason', title: 'reason' }
        ]
    });

    for (const row of records) {
        const bomRef = row['bom_ref'];
        if (!bomRef) {
            console.log(`⚠️ Skipping record - missing bom_ref`);
            row.deprecated_status = '';
            row.publish_details = '';
            row.reason = '';
            continue;
        }

        const parts = bomRef.split('|');
        const packageInfo = parts[parts.length - 1];
        const lastAtIndex = packageInfo.lastIndexOf('@');
        
        if (lastAtIndex === -1) {
            row.deprecated_status = 'unknown';
            row.publish_details = '';
            row.reason = 'Invalid package format';
            continue;
        }
        
        const packageName = packageInfo.substring(0, lastAtIndex);
        const version = packageInfo.substring(lastAtIndex + 1);
        
        const { deprecated_status, publish_details, reason } = await checkPackageStatus(packageName, version);
        row.deprecated_status = deprecated_status;
        row.publish_details = publish_details;
        row.reason = reason;
    }

    await csvWriter.writeRecords(records);
    console.log(`\n✅ Finished processing: ${repo} -> ${outputFile}`);
}

console.log(`🚀 Starting to process ${ML_REPO_LIST.length} repositories...`);

try {
    await Promise.all(
        ML_REPO_LIST.map(repo => limit(() => processCsv(repo)))
    );
    console.log('✨ All repositories processed successfully!');
} catch (error) {
    console.error('❌ Error during processing:', error);
}