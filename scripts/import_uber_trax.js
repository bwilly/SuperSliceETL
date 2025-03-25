#!/usr/bin/env node
/**
 * import_uber_trax.js
 *
 * Usage:
 *   node import_uber_trax.js --connectionString "postgres://username:password@host:port/dbname" --filePath "/path/to/uber_trax.csv"
 *   // consider-do-not-commit:  node scripts/import_uber_trax.js --connectionString "postgres://postgres:saltmeadow-sss@localhost:5432/sss_etl_db" --filePath "sample_data/uber_eats_transactions-sample.csv"
 *
 * This script imports Uber trax data from a CSV file into PostgreSQL.
 * It uses yargs for CLI argument parsing and accumulates all insert promises
 * before closing the connection.
 */

const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const maybeNull = (val) => (val && val.trim() !== '') ? val : null;

const parseNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };
  


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
    description: 'Path to the Uber trax CSV file',
    demandOption: true
  })
  .help()
  .argv;

const connectionString = argv.connectionString;
const filePath = argv.filePath;

const client = new Client({ connectionString });
client.connect();

const insertPromises = []; // Array to hold all insert query promises.

fs.createReadStream(filePath)
//   .pipe(csv({ separator: '\t' }))
.pipe(csv({
    // separator: '\t',
    mapHeaders: ({ header }) => header.trim()
  }))
  .on('data', (row) => {
    // For debugging, you might uncomment the following line:
    console.log(row);
    // Prepare values with necessary type transformations.
    const values = [
        row['Store'],
        row['External Store ID'],
        row['Country'],
        row['Country Code'],
        row['City'],
        row['Order ID'],
        row['Order UUID'],
        row['Order Status'],
        row['Delivery Status'],
        row['Scheduled?'] === '1',
        row['Completed?'] === '1',
        row['Online Order?'] === '1',
        row['Canceled By'],
        parseInt(row['Menu Item Count'], 10) || null,
        row['Currency Code'],
        parseNumber(row['Ticket Size']),
        row['Date Ordered'],
        row['Time Customer Ordered'],
        maybeNull(row['Cancellation Time']),        // converts "" to null
        maybeNull(row['Time Merchant Accepted']),
        parseNumber(row['Time to Accept']),
        parseNumber(row['Original Prep Time']),
        row['Prep Time Increased?'] === '1',
        parseNumber(row['Increased Prep Time']),
        maybeNull(row['Courier Arrival Time']),       // converts "" to null
        maybeNull(row['Time Courier Started Trip']),    // converts "" to null
        maybeNull(row['Time Courier Delivered']),       // converts "" to null
        parseNumber(row['Total Delivery Time']),
        parseNumber(row['Courier Wait Time (Restaurant)']),
        parseNumber(row['Courier Wait Time (Eater)']),
        parseNumber(row['Total Prep & Handoff Time']),
        parseNumber(row['Order Duration']),
        row['Delivery Batch Type'],
        row['Fulfillment Type'],
        row['Order Channel'],
        row['Eats Brand'],
        row['Subscription Pass'],
        row['Workflow UUID'],
        filePath // provenance: source file path
      ];
      

    const query = `
      INSERT INTO uber_trax (
        store, external_store_id, country, country_code, city, order_id, order_uuid,
        order_status, delivery_status, scheduled, completed, online_order, canceled_by,
        menu_item_count, currency_code, ticket_size, date_ordered, time_customer_ordered,
        cancellation_time, time_merchant_accepted, time_to_accept, original_prep_time,
        prep_time_increased, increased_prep_time, courier_arrival_time, time_courier_started_trip,
        time_courier_delivered, total_delivery_time, courier_wait_time_restaurant,
        courier_wait_time_eater, total_prep_handoff_time, order_duration, delivery_batch_type,
        fulfillment_type, order_channel, eats_brand, subscription_pass, workflow_uuid, source_file
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39
      )
      ON CONFLICT (order_uuid) DO NOTHING;
    `;

    // Instead of using an async callback in .on('data'),
    // push the promise from the query into our array.
    const p = client.query(query, values).catch(err => {
      console.error('Error inserting row:', err);
    });
    insertPromises.push(p);
  })
  .on('end', async () => {
    console.log('CSV file processing finished. Waiting for all rows to be inserted...');
    try {
      await Promise.all(insertPromises);
      console.log('All rows inserted successfully.');
    } catch (err) {
      console.error('Error waiting for all inserts:', err);
    }
    client.end();
  });
