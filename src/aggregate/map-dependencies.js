const fs = require('fs');
const path = require('path');

// Directory containing SBOM CSVs
const directoryPath = "./data/sbom-csv";

// Map to hold the data
// Structure: Map<dependency, { type, group, author, name, email, versions: Map<version, { services: Set, licenseId, timestamp }> }>
const map = new Map();

fs.readdirSync(directoryPath).forEach((file) => {
    const filePath = path.join(directoryPath, file);

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const lines = data.split('\n');

        lines.forEach((line) => {
            const fields = line.split(",");

            if (fields.length < 24) return; // Ensure line has all fields

            const dependency = fields[1];
            if (!dependency || dependency === 'dependency') return; // Skip empty lines or headers

            const type = fields[0];
            const licenseId = fields[2];
            const group = fields[3];
            const author = fields[4];
            const name = fields[5];
            const email = fields[20];
            const timestamp = fields[23];

            const repoName = file.split('.')[0];
            const service = repoName.substring(0, repoName.length - 5);

            const versionParts = dependency.split("@");
            const version = versionParts.pop();
            const depName = versionParts.join("@");

            if (!map.has(depName)) {
                map.set(depName, {
                    type,
                    group,
                    author,
                    name,
                    email,
                    versions: new Map()
                });
            }

            const depEntry = map.get(depName);

            if (!depEntry.versions.has(version)) {
                depEntry.versions.set(version, {
                    services: new Set(),
                    licenseId,
                    timestamp
                });
            }

            depEntry.versions.get(version).services.add(service);
        });

    } catch (err) {
        console.error(`Unable to read file ${file}:`, err);
    }
});

// === Create CSV ===
let csvContent = 'dependency,version,type,group,author,name,email,licenseId,timestamp,services\n';

map.delete("");

map.forEach((depEntry, dep) => {
    depEntry.versions.forEach((verEntry, version) => {
        let first = true;
        verEntry.services.forEach(service => {
            csvContent += first
                ? `${dep},${version},${depEntry.type},${depEntry.group},${depEntry.author},${depEntry.name},${depEntry.email},${verEntry.licenseId},${verEntry.timestamp},${service}\n`
                : `,,,,,,,,,${service}\n`;
            first = false;
        });
    });
});

const csvFilePath = "./data/sbom.csv";
fs.writeFileSync(csvFilePath, csvContent, 'utf8');
console.log(`✅ Saved CSV to ${csvFilePath}`);


