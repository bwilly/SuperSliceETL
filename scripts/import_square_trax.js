#!/usr/bin/env node
/**
 * import_square_trax.js
 *
 * This script imports Square trax data from a CSV file into a PostgreSQL database.
 *
 * Usage:
 *   node import_square_trax.js --connectionString "postgres://username:password@host:port/dbname" --filePath "/path/to/square_trax.csv"
 *
 * Required CLI Arguments:
 *   --connectionString (or -c): PostgreSQL connection string.
 *   --filePath (or -f): Path to the Square trax CSV file.
 *
 * We are using the "yargs" library for CLI argument parsing because it is widely adopted,
 * well-documented, and provides an intuitive API with robust error handling.
 */

const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse CLI arguments using yargs.
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
    description: 'Path to the Square trax CSV file',
    demandOption: true
  })
  .help()
  .argv;

const connectionString = argv.connectionString;
const filePath = argv.filePath;

const maybeNull = (val) => (val && val.trim() !== '') ? val : null;

const client = new Client({ connectionString });
client.connect();

const insertPromises = [];

const headers = [
    'Date',
    'Time',
    'Time Zone',
    'Gross Sales',
    'Discounts',
    'Service Charges',
    'Net Sales',
    'Gift Card Sales',
    'Tax',
    'Tip',
    'Partial Refunds',
    'Total Collected',
    'Source',
    'Card',
    'Card Entry Methods',
    'Cash',
    'Square Gift Card',
    'Other Tender',
    'Other Tender Type',
    'Tender Note',
    'Fees',
    'Net Total',
    'Transaction ID',
    'Payment ID',
    'Card Brand',
    'PAN Suffix',
    'Device Name',
    'Staff Name',
    'Staff ID',
    'Details',
    'Description',
    'Event Type',
    'Location',
    'Dining Option',
    'Customer ID',
    'Customer Name',
    'Customer Reference ID',
    'Device Nickname',
    'Third Party Fees',
    'Deposit ID',
    'Deposit Date',
    'Deposit Details',
    'Fee Percentage Rate',
    'Fee Fixed Rate',
    'Refund Reason',
    'Discount Name',
    'Transaction Status',
    'Cash App',
    'Order Reference ID',
    'Fulfillment Note',
    'Free Processing Applied',
    'Channel',
    'Unattributed Tips'
  ];
  

// Use csv-parser to read the CSV file.
// We assume the file is comma-separated and that the first row is the header.
fs.createReadStream(filePath)
  .pipe(csv({
    // headers: true,
    headers, // use the explicitly defined headers
    mapHeaders: ({ header }) => header.trim()
  }))
  .on('headers', (hdrs) => {
    console.log('Detected headers:', hdrs);
  })
  .on('data', (row) => {
 // Skip the header row if it somehow appears as data.
 if (row['Date'] && row['Date'].trim() === 'Date') {
    console.log('Skipping header row');
    return;
  }


      // Log the row as a formatted JSON string for debugging.
    console.log(JSON.stringify(row, null, 2));
    
    // Helper function to parse monetary values: remove any currency symbols.
    const parseMoney = (val) => (val && val.trim() !== '') ? parseFloat(val.replace(/[^0-9.-]/g, '')) : null;

    // Build values array from CSV fields.
    const values = [
    //   row['Date'],                           // transaction_date as string (you may convert to Date if desired)
    //   row['Time'],                           // transaction_time as string
    row['Date'] && row['Date'].trim() !== 'Date' ? row['Date'].trim() : null, // transaction_date
    row['Time'] && row['Time'].trim() !== '' ? row['Time'].trim() : null,       // transaction_time  
    
    row['Time Zone'],                      // time_zone
      parseMoney(row['Gross Sales']),
      parseMoney(row['Discounts']),
      parseMoney(row['Service Charges']),
      parseMoney(row['Net Sales']),
      parseMoney(row['Gift Card Sales']),
      parseMoney(row['Tax']),
      parseMoney(row['Tip']),
      parseMoney(row['Partial Refunds']),
      parseMoney(row['Total Collected']),
      row['Source'],
      parseMoney(row['Card']),
      row['Card Entry Methods'],
      parseMoney(row['Cash']),
      parseMoney(row['Square Gift Card']),
      parseMoney(row['Other Tender']),
      row['Other Tender Type'],
      row['Tender Note'],
      parseMoney(row['Fees']),
      parseMoney(row['Net Total']),
      row['Transaction ID'],
      row['Payment ID'],
      row['Card Brand'],
      row['PAN Suffix'],
      row['Device Name'],
      row['Staff Name'],
      row['Staff ID'],
      row['Details'],
      row['Description'],
      row['Event Type'],
      row['Location'],
      row['Dining Option'],
      row['Customer ID'],
      row['Customer Name'],
      row['Customer Reference ID'],
      row['Device Nickname'],
      parseMoney(row['Third Party Fees']),
      row['Deposit ID'],
      row['Deposit Date'] ? new Date(row['Deposit Date']) : null,
      row['Deposit Details'],
      parseFloat(row['Fee Percentage Rate']) || null,
      parseMoney(row['Fee Fixed Rate']),
      row['Refund Reason'],
      row['Discount Name'],
      row['Transaction Status'],
      parseMoney(row['Cash App']),
      row['Order Reference ID'],
      row['Fulfillment Note'],
      (row['Free Processing Applied'] === 'true' || row['Free Processing Applied'] === '1'),
      row['Channel'],
      parseMoney(row['Unattributed Tips']),
      filePath // Provenance: the source file path.
    ];

    const query = `
      INSERT INTO square_trax (
        transaction_date, transaction_time, time_zone,
        gross_sales, discounts, service_charges, net_sales, gift_card_sales, tax, tip,
        partial_refunds, total_collected, source, card, card_entry_methods, cash,
        square_gift_card, other_tender, other_tender_type, tender_note, fees, net_total,
        transaction_id, payment_id, card_brand, pan_suffix, device_name, staff_name, staff_id,
        details, description, event_type, location, dining_option, customer_id, customer_name,
        customer_reference_id, device_nickname, third_party_fees, deposit_id, deposit_date,
        deposit_details, fee_percentage_rate, fee_fixed_rate, refund_reason, discount_name,
        transaction_status, cash_app, order_reference_id, fulfillment_note, free_processing_applied,
        channel, unattributed_tips, source_file
      ) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
  $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
  $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
  $31,$32,$33,$34,$35,$36,$37,$38,$39,$40,
  $41,$42,$43,$44,$45,$46,$47,$48,$49,$50,
  $51,$52,$53,$54
)

      ON CONFLICT (transaction_id) DO NOTHING;
    `;

    const p = client.query(query, values).catch(err => {
      console.error('Error inserting row:', err);
    });
    insertPromises.push(p);
  })
  .on('end', async () => {
    console.log('Square trax CSV file processing finished. Waiting for all rows to be inserted...');
    try {
      await Promise.all(insertPromises);
      console.log('All rows inserted successfully.');
    } catch (err) {
      console.error('Error waiting for all inserts:', err);
    }
    client.end();
  });
