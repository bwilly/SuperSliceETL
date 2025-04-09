// parsers/uber_parser.js
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const CsvToPostgresFileParser = require('../parser_abstract'); // our abstract class
const UnifiedTransformerFactory = require('../unified_transformer_factory');


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
   * Helper: Convert a value to null if it's an empty string.
   * @param {string} val 
   * @returns {string|null}
   */
  maybeNull(val) {
    return (val && val.trim() !== '') ? val.trim() : null;
  }

  /**
   * Helper: Parse a value as a number; return null if not a valid number.
   * @param {string} val 
   * @returns {number|null}
   */
  parseNumber(val) {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
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
      fs.createReadStream(filePath)
        // .pipe(csv({
          // headers: true,
          // mapHeaders: ({ header }) => header.trim().toLowerCase()
        // }))
        .pipe(csv({
          //headers: true,
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase().replace(/\s+/g, '_').replace(/[?]/g, '')
        }))
        // .on('headers', (headers) => {
        //   const missing = this.expectedHeaders.filter(exp => !headers.includes(exp));
        //   if (missing.length > 0) {
        //     return reject(new Error(`Missing headers in file: ${missing.join(', ')}`));
        //   }
        // })
        .on('data', (row) => { 
          


          // Transform boolean fields using bracket notation.
          row['scheduled?'] = row['scheduled?'] === '1';
          row['completed?'] = row['completed?'] === '1';
          row['online_order?'] = row['online_order?'] === '1';
          // Add source file info for provenance.
          row.source_file = filePath;
          
          const values = [
            row.store,
            row['external_store_id'],
            row.country,
            row['country_code'],
            row.city,
            row['order_id'],
            row['order_uuid'],
            row['order_status'],
            row['delivery_status'],
            row['scheduled?'],
            row['completed?'],
            row['online_order?'],
            row['canceled_by'],
            parseInt(row['menu_item_count'], 10) || null,
            row['currency_code'],
            this.parseNumber(row['ticket_size']),
            row['date_ordered'],
            row['time_customer_ordered'],
            row['cancellation_time'] && row['cancellation_time'].trim() !== '' ? row['cancellation_time'] : null,
            row['time_merchant_accepted'] && row['time_merchant_accepted'].trim() !== '' ? row['time_merchant_accepted'] : null,
            this.parseNumber(row['time_to_accept']),
            this.parseNumber(row['original_prep_time']),
            row['prep_time_increased?'] === '1',
            this.parseNumber(row['increased_prep_time']),
            row['courier_arrival_time'] && row['courier_arrival_time'].trim() !== '' ? row['courier_arrival_time'] : null,
            row['time_courier_started_trip'] && row['time_courier_started_trip'].trim() !== '' ? row['time_courier_started_trip'] : null,
            row['time_courier_delivered'] && row['time_courier_delivered'].trim() !== '' ? row['time_courier_delivered'] : null,
            this.parseNumber(row['total_delivery_time']),
            this.parseNumber(row['courier_wait_time_restaurant']),
            this.parseNumber(row['courier_wait_time_eater']),
            this.parseNumber(row['total_prep_handoff_time']),
            this.parseNumber(row['order_duration']),
            row['delivery_batch_type'],
            row['fulfillment_type'],
            row['order_channel'],
            row['eats_brand'],
            row['subscription_pass'],
            row['workflow_uuid'],
            row.source_file
          ];
          
          if (this.config.writeIsolated) {
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
            insertPromises.push(this.dbConnection.query(query, values));
            rowCount++;
          }

          const unifiedTransformer = UnifiedTransformerFactory.getTransformer('uber', this.dbConnection);
          insertPromises.push(
            unifiedTransformer.processRow(row).catch(err => {
              console.error('Error processing unified row:', err);
              // todo: add logger
            })
          );


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
