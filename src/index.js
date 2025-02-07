/*
 License
 --------------
 Copyright © 2020-2024 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Mojaloop Foundation
 - Sam Kummary <skummary@mojaloop.io>
 - Shuchita Prakash <sprakash_cse210557@mgit.ac.in>
 ------------
*/

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const configPath = path.resolve(__dirname, '../config/default.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

const mode = process.env.MODE || config.mode
let count = 0; // Counter for deprecated packages
let output="";

function getDependencies(checkTransitive = false) {
    const args = checkTransitive ? ["ls", "--all", "--json"] : ["ls", "--json"];
    const output = spawnSync("npm", args, { encoding: "utf8" }).stdout;
    return JSON.parse(output).dependencies || {};
}

async function checkPackage(pkgName, version, level) {
    try {
        const viewProcess = spawnSync("npm", ["view", `${pkgName}@${version}`, "--json"], { encoding: "utf8" });
        const viewOutput = viewProcess.stdout;

        if (!viewOutput.trim()) {
            output+=`UNKNOWN: ${pkgName}@${version}\n`;
            return;
        }

        const packageInfo = JSON.parse(viewOutput);

        if (packageInfo.deprecated) {
            count++;
            output+=`${count}: ${pkgName}@${version} \n\tReason: ${packageInfo.deprecated}\n`;

        }
    } catch (err) {
        output+=err.message;
    }
}

function getAllPackages(deps, collected = {}) {
    for (const [name, info] of Object.entries(deps)) {
        const version = info.version;
        if (name && version && !collected[`${name}@${version}`]) {
            collected[`${name}@${version}`] = true;
            if (info.dependencies) getAllPackages(info.dependencies, collected);
        }
    }
    return Object.keys(collected);
}

async function checkDependencies() {
    console.log("\x1b[34mChecking root dependencies...\x1b[0m");
    output="";
    const rootDependencies = getDependencies(false);
    const rootPackageList = Object.entries(rootDependencies).map(([name, info]) => `${name}@${info.version}`);

    await Promise.all(rootPackageList.map(pkg => {
        const [pkgName, version] = pkg.split("@");
        return checkPackage(pkgName, version, "root");
    }));
    if(mode=='warning'){
        if (count > 0) {
            output+='\x1b[33mWARNING!! Deprecated results found at root level.\n\x1b[0m';
        } else {
            output+='\x1b[32mSUCCESS: No deprecated packages found at root level! Congos!!\n\x1b[0m';
        }
    }
    else{
        if (count > 0) {
            output+='\x1b[31mERROR!! Deprecated results found at root level.\n\x1b[0m';
        } else {
            output+='\x1b[32mSUCCESS: No deprecated packages found at root level! Congos!!\n\x1b[0m';
        }
    }
    console.log(output);

    console.log("\x1b[34m\nChecking all transitive dependencies...\x1b[0m");
    output="";
    const allDependencies = getDependencies(true);
    const allPackageList = getAllPackages(allDependencies);

    await Promise.all(allPackageList.map(pkg => {
        const [pkgName, version] = pkg.split("@");
        return checkPackage(pkgName, version, "transitive");
    }));

    if(mode=='warning'){
        if (count > 0) {
            output+='\x1b[33mWARNING!! Deprecated results found in dependencies.\n\x1b[0m';
        } else {
            output+='\x1b[32mSUCCESS: No deprecated packages found! Congos!!\x1b[0m';
        }
    }
    else{
        if (count > 0) {
            output+='\x1b[31mERROR!! Deprecated results found in dependencies.\n\x1b[0m';
        } else {
            output+='\x1b[32mSUCCESS: No deprecated packages found! Congos!!\x1b[0m';
        }
    }
    console.log(output);
   

    if (mode === "error" && count > 0) {
        process.exit(1);
    }
}

module.exports = { checkDependencies };
