# ml-depcheck-utility

This utility provides a script to scan the dependencies and transitive dependencies of a Node.js repository and identify any deprecated packages. It checks both the root-level dependencies and all nested dependencies for deprecation status and provides a detailed report and a configurable interface.

## Features

- **Root-Level Dependency Check:** Verifies the status of dependencies directly listed in the package.json file.

- **Transitive Dependency Check:** Recursively checks all nested dependencies for deprecation.

- **Identifies Dev and Functional Dependencies:** Differentiates between development and functional dependencies.

- **CLI Integration:** Easily run the utility from the command line.

- **Configurable Mode:** Choose between warning or error modes using configuration or environment variables.

- **Reason:** Each deprecated dependency includes a reason, often suggesting alternative packages.

## Usage

You can run the utility directly from the command line once it is installed.<br>
`npm install @mojaloop/ml-depcheck-utility`<br>
`check-deprecations`<br>

## Changing the Configuration Mode

You can change the mode in two ways:

1. **Via the config/default.json file:**
   The default configuration can be modified by updating the mode setting in the config/default.json file. It supports two modes:
   - **warning:** Will log deprecated dependencies as warnings (default behavior).
   - **error:** Will log deprecated dependencies as errors and exit the process with a non-zero exit code.
2. **Via Environment Variable:**
   You can override the configuration by setting the MODE environment variable before running the utility. The commands are as follows:
   - `MODE=warning check-deprecations`
   - `MODE=error check-deprecations`

## Example Output

**Mode: warning**

```
Starting dependency check

Checking root functional dependencies...
1. @example/package1
   Reason:

Checking root dev dependencies...
1. @example/package2
   Reason:

Checking transitive functional dependecies...
1. @example/package3
   Reason:

Checking transitive dev dependecies...
1. @example/package4
   Reason:

WARNING!! Found 4 deprecated dependencies.
```

**Mode: error**

```
Starting dependency check

Checking root functional dependencies...
1. @example/package1
   Reason:

Checking root dev dependencies...
1. @example/package2
   Reason:

Checking transitive functional dependecies...
1. @example/package3
   Reason:

Checking transitive dev dependecies...
1. @example/package4
   Reason:

Error!! Found 4 deprecated dependencies.
```

**Success Case:**

```
Starting dependency check

Checking root functional dependencies...

Checking root dev dependencies...

Checking transitive functional dependecies...

Checking transitive dev dependecies...

CONGOS!!! No deprecated dependencies are found!
```

# SBOM Generation Tool for Mojaloop Repositories

## What is an SBOM?

A **Software Bill of Materials (SBOM)** is a detailed inventory of all the components, libraries, and dependencies used in a software project. It provides critical insights into the dependencies' status, licenses, authors, and other metadata, helping to ensure transparency and security in the software supply chain.

## About This Tool

This tool enables **comprehensive SBOM generation** for Mojaloop repositories. It supports **both npm and yarn repositories** and provides detailed reports on dependencies for each individual repository, as well as an aggregated SBOM for all repositories.

---

## Features

### 1. **Flexible Repository Inclusion**

The repositories to be included in the SBOM generation process can be configured in two ways: a default repository list and a custom repository list sent from the end user.

### 2. **Individual SBOMs for Each Repository**

For every Mojaloop repository, a detailed SBOM is generated. It includes:

- A comprehensive list of dependencies.
- Metadata such as:
  - Status
  - License
  - Version Control System (VCS) information
  - Author details
- All **transitive dependencies** (dependencies of dependencies).

### 3. **Aggregated SBOM for All Repositories**

At the end of the process, an aggregated SBOM is generated. This SBOM:

- Maps dependencies to the Mojaloop services utilizing them.
- Includes additional metadata such as:
  - Version
  - Group
  - Name
  - License
  - Publish details

---

## How to Use This Tool

To use the SBOM generation tool, follow these steps:

1. **Clone the Repository**:
   Clone this repository to your local machine:

   ```bash
   git clone https://github.com/mojaloop/ml-depcheck-utility.git
   cd ml-depcheck-utility
   ```

2. **Install Dependencies**:
   Use `npm` to install all required dependencies:

   ```bash
   npm install
   ```

3. **Run the Tool**:
   You can generate SBOMs using two modes:
   - **For individual repositories**:Use this mode if you want to generate SBOMs for one repository at a time.
     - **For npm-based project**:
       ```bash
       bash src/individual-repo/npm/generate-sbom.sh
       ```
     - **For yarn-based projects**:
       ```bash
       bash src/individual-repo/yarn/generate-sbom.sh
       ```
   - **Generate Aggregate SBOM for Multiple Repositories**: Use this mode to generate SBOMs for a list of repositories, either the default set or a custom list.
     - **Using Default Repository List**:
     ```bash
     bash src/aggregate/generate-sbom.sh
     ```
     - **Using Custom Repository List**:
     ```bash
     bash src/aggregate/generate-sbom.sh custom-repos-list.json
     ```

---

## Output

The results will be stored in the root directory:

- `sbom.csv` : aggregate sbom
- `sbom-npm.csv` : sbom of a npm repository
- `sbom-yarn.csv` : sbom of a yarn repository

---

## Why Use This Tool?

This SBOM generation tool ensures:

- **Transparency**: By providing a clear list of dependencies and their metadata for each Mojaloop repository.
- **Security**: By identifying all dependencies, including transitive ones, it helps identify potential vulnerabilities.
- **Flexibility**: By allowing repository inclusion to be configured dynamically, either through a configuration file or a custom list passed via the command line.
