#!/usr/bin/env node
/**
 * import_slice_trax.js
 *
 * This script imports Slice trax data (orders) from a CSV file into a PostgreSQL database.
 *
 * Usage:
 *   node import_slice_trax.js --connectionString "postgres://username:password@host:port/dbname" --filePath "/path/to/slice_trax.csv"
 *   // consider-do-not-commit: node scripts/import_slice_trax.js --connectionString "postgres://postgres:saltmeadow-sss@localhost:5432/sss_etl_db" --filePath "sample_data/slice_transactions-sample.csv"
 * 
 * Required CLI Arguments:
 *   --connectionString (or -c): PostgreSQL connection string.
 *   --filePath (or -f): Path to the Slice trax CSV file.
 *
 * We use the "yargs" library for CLI argument parsing.
 */

const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse CLI arguments.
const argv = yargs(hideBin(process.argv))
  .option('connectionString', {
    alias: 'c',
    type: 'string',
    description: 'PostgreSQL connection string',
    demandOption: true
  })
  .option('filePath', {
    alias: 'f',
    type: 'string',
    description: 'Path to the Slice trax CSV file',
    demandOption: true
  })
  .help()
  .argv;

const connectionString = argv.connectionString;
const filePath = argv.filePath;

// PostgreSQL client.
const client = new Client({ connectionString });
client.connect();

// Array to accumulate promises for each insert.
const insertPromises = [];

// Define the expected headers from the Slice CSV.
const headers = [
  'Order #',
  'Order Date',
  'Customer',
  'Order Type',
  'Subtotal',
  'Prepaid Tip',
  'Tax',
  'Order Total',
  'Status'
];

// Helper: convert empty strings to null.
const maybeNull = (val) => (val && val.trim() !== '') ? val.trim() : null;

// Helper: parse monetary values (removes "$" and parses as float).
const parseMoney = (val) => (val && val.trim() !== '') ? parseFloat(val.replace(/[^0-9.-]/g, '')) : null;

// Helper: parse the date/time string. (Format: "03-01-2025 01:47 AM")
const parseDateTime = (val) => {
  if (!val || val.trim() === '') return null;
  // Using new Date() for now; consider a library for custom formats if needed.
  return new Date(val);
};

fs.createReadStream(filePath)
  .pipe(csv({
    headers, // Use the explicitly defined headers
    mapHeaders: ({ header }) => header.trim()
  }))
  .on('headers', (hdrs) => {
    console.log('Detected headers:', hdrs);
  })
  .on('data', (row) => {
    // Log the row as JSON for debugging.
    console.log(JSON.stringify(row, null, 2));

    // Skip a potential header row that may appear as data.
    if (row['Order #'] && row['Order #'].trim() === 'Order #') {
      console.log('Skipping header row');
      return;
    }

    const values = [
      maybeNull(row['Order #']),                   // order_number
      parseDateTime(row['Order Date']),              // order_date
      maybeNull(row['Customer']),                    // customer
      maybeNull(row['Order Type']),                  // order_type
      parseMoney(row['Subtotal']),                   // subtotal
      parseMoney(row['Prepaid Tip']),                // prepaid_tip
      parseMoney(row['Tax']),                        // tax
      parseMoney(row['Order Total']),                // order_total
      maybeNull(row['Status']),                      // status
      filePath                                       // source_file for provenance
    ];

    const query = `
      INSERT INTO slice_trax (
        order_number, order_date, customer, order_type,
        subtotal, prepaid_tip, tax, order_total, status, source_file
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      ON CONFLICT (order_number) DO NOTHING;
    `;

    const p = client.query(query, values).catch(err => {
      console.error('Error inserting row:', err);
    });
    insertPromises.push(p);
  })
  .on('end', async () => {
    console.log('Slice trax CSV file processing finished. Waiting for all rows to be inserted...');
    try {
      await Promise.all(insertPromises);
      console.log('All rows inserted successfully.');
    } catch (err) {
      console.error('Error waiting for all inserts:', err);
    }
    client.end();
  });
