const fs = require('fs')
const axios = require('axios')
const { createObjectCsvWriter } = require('csv-writer')

const inputFile = './tmp/result-individual/SBOM.csv'
const outputFile = './tmp/result-individual/SBOM-final.csv'
const CONCURRENCY_LIMIT = 10

// Read file
fs.readFile(inputFile, 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading file:', err)
    return
  }

  // Dynamically import p-limit as it's an ESM-only module
  const pLimit = (await import('p-limit')).default
  const limit = pLimit(CONCURRENCY_LIMIT)

  const lines = data.trim().split('\n')
  const headers = lines[0].split(',')
  const bomRefIndex = headers.indexOf('bom_ref')

  if (bomRefIndex === -1) {
    console.error('bom_ref field not found in header.')
    return
  }

  // Add new headers
  const newHeaders = [...headers, 'author-email', 'deprecated-status', 'deprecation-reason', 'timestamp']

  // Extract rows
  const rows = lines.slice(1).map(line => line.split(','))

  // Prepare results with concurrency limit
  const augmentedRows = await Promise.all(rows.map(row => limit(async () => {
    try {
      const dependency = row[bomRefIndex].split('|').pop()
      const lastAtIndex = dependency.lastIndexOf('@')
      const name = dependency.substring(0, lastAtIndex)
      const version = dependency.substring(lastAtIndex + 1)

      // Encode scoped packages for URL
      const encodedName = encodeURIComponent(name)

      const url = `https://registry.npmjs.org/${encodedName}`
      const res = await axios.get(url)
      const metadata = res.data

      const versionInfo = metadata.versions[version] || {}
      const email = versionInfo.author?.email || ''
      const deprecated = versionInfo.deprecated ? 'deprecated' : 'active'
      const reason = versionInfo.deprecated || 'Active in npm registry'
      const modified = metadata.time?.modified || ''

      return [...row, email, deprecated, reason, modified]
    } catch (error) {
      return [...row, '', '', '', '']
    }
  })))

  // Write to new CSV
  const csvWriter = createObjectCsvWriter({
    path: outputFile,
    header: newHeaders.map(h => ({ id: h, title: h }))
  })

  // Convert rows to object form
  const outputRecords = augmentedRows.map(row => {
    const record = {}
    newHeaders.forEach((h, i) => {
      record[h] = row[i] || ''
    })
    return record
  })

  await csvWriter.writeRecords(outputRecords)
})
