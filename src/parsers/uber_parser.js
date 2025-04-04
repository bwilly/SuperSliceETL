// parsers/uber_parser.js
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const CsvToPostgresFileParser = require('../parser_abstract'); // our abstract class

class UberParser extends CsvToPostgresFileParser {
  /**
   * @param {object} config - Configuration for Uber parser (expectedHeaders, etc.)
   * @param {object} dbConnection - Database connection.
   */
  constructor(config, dbConnection) {
    super(config, dbConnection);
    this.expectedHeaders = config.expectedHeaders.map(h => h.toLowerCase().trim());
  }

  /**
   * Parses an Uber CSV file, validates headers, and inserts rows into the uber_trax table.
   * Also, optionally sends transformed rows to the unified transformer.
   * @param {string} filePath - Path to the Uber CSV file.
   * @returns {Promise<object>} - Resolves with a result object (e.g., {rowCount: number})
   */
  parseFile(filePath) {
    return new Promise((resolve, reject) => {
      let rowCount = 0;
      const insertPromises = [];
      // Create a read stream and parse CSV
      fs.createReadStream(filePath)
        .pipe(csv({
          headers: true,
          mapHeaders: ({ header }) => header.trim().toLowerCase()
        }))
        .on('headers', (headers) => {
          // Validate headers (case-insensitive)
          const missing = this.expectedHeaders.filter(exp => !headers.includes(exp));
          if (missing.length > 0) {
            return reject(new Error(`Missing headers in file: ${missing.join(', ')}`));
          }
        })
        .on('data', (row) => {
          // Here you may transform row fields (e.g., convert numbers, handle empty strings)
          // For example, convert "scheduled?" to boolean:
          row['scheduled?'] = row['scheduled?'] === '1';
          row['completed?'] = row['completed?'] === '1';
          row['online order?'] = row['online order?'] === '1';
          // Add the source file info to the row for provenance:
          row.source_file = filePath;
          // Insert row into uber_trax table.
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
          // Build values array; adjust parsing as needed.
          const values = [
            row.store,
            row['external store id'],
            row.country,
            row['country code'],
            row.city,
            row['order id'],
            row['order uuid'],
            row['order status'],
            row['delivery status'],
            row['scheduled?'],
            row['completed?'],
            row['online order?'],
            row['canceled by'],
            parseInt(row['menu item count'], 10) || null,
            row['currency code'],
            parseFloat(row['ticket size']),
            row['date ordered'],
            row['time customer ordered'],
            row['cancellation time'] && row['cancellation time'].trim() !== '' ? row['cancellation time'] : null,
            row['time merchant accepted'] && row['time merchant accepted'].trim() !== '' ? row['time merchant accepted'] : null,
            parseFloat(row['time to accept']),
            parseFloat(row['original prep time']),
            row['prep time increased?'] === '1',
            parseFloat(row['increased prep time']),
            row['courier arrival time'] && row['courier arrival time'].trim() !== '' ? row['courier arrival time'] : null,
            row['time courier started trip'] && row['time courier started trip'].trim() !== '' ? row['time courier started trip'] : null,
            row['time courier delivered'] && row['time courier delivered'].trim() !== '' ? row['time courier delivered'] : null,
            parseFloat(row['total delivery time']) || null,
            parseFloat(row['courier wait time (restaurant)']) || null,
            parseFloat(row['courier wait time (eater)']) || null,
            parseFloat(row['total prep & handoff time']) || null,
            parseFloat(row['order duration']) || null,
            row['delivery batch type'],
            row['fulfillment type'],
            row['order channel'],
            row['eats brand'],
            row['subscription pass'],
            row['workflow uuid'],
            row.source_file
          ];
          // Push the insertion promise into our array.
          insertPromises.push(this.dbConnection.query(query, values));
          rowCount++;
        })
        .on('end', async () => {
          try {
            await Promise.all(insertPromises);
            resolve({ rowCount });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }
}

module.exports = UberParser;
