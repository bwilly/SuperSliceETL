#!/usr/bin/env node
/**
 * parsers/square_parser.js
 *
 * A Square CSV-to-Postgres parser that implements the standardized interface.
 * This parser takes a legacy Square trax CSV file, validates headers, transforms rows,
 * inserts rows into the square_trax isolated table, and passes data to the unified transformer.
 */

const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const CsvToPostgresFileParser = require('../parser_abstract'); // abstract base class
const UnifiedTransformerFactory = require('../unified_transformer_factory');

class SquareParser extends CsvToPostgresFileParser {
  /**
   * @param {object} config - Configuration for the Square parser (expectedHeaders, writeIsolated flag, etc.)
   * @param {object} dbConnection - Database connection.
   */
  constructor(config, dbConnection) {
    super(config, dbConnection);
    // [1] Update expectedHeaders: lower-case and trim each header.
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
   * Helper: Parse a monetary value (removes any non-numeric symbols) into a number.
   * @param {string} val
   * @returns {number|null}
   */
  parseMoney(val) {
    if (!val || val.trim() === '') return null;
    const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  }

  /**
   * Parses a Square CSV file, validates headers, and inserts rows into the square_trax table.
   * Also, optionally sends transformed rows to the unified transformer.
   * @param {string} filePath - Path to the Square CSV file.
   * @returns {Promise<object>} - Resolves with a result object (e.g., {rowCount: number})
   */
  parseFile(filePath) {
    return new Promise((resolve, reject) => {
      let rowCount = 0;
      const insertPromises = [];
      const unifiedPromises = [];
      
      fs.createReadStream(filePath)
        .pipe(csv({
          // [2] Updated CSV header mapping:
          // Commenting out explicit headers as we're normalizing headers in the mapHeaders callback.
          // headers: true,
          mapHeaders: ({ header }) =>
            header.trim().toLowerCase().replace(/\s+/g, '_').replace(/[?]/g, '')
        }))
        // .on('headers', (hdrs) => {
        //   console.log('Detected headers:', hdrs);
        //   // Optionally, validate that all expected headers exist.
        //   const missing = this.expectedHeaders.filter(exp => !hdrs.includes(exp));
        //   if (missing.length > 0) {
        //     return reject(new Error(`Missing headers in file: ${missing.join(', ')}`));
        //   }
        // }) todo: re-impl with lowercase and replace
        .on('data', (row) => {
          // Since headers are now lower-case with underscores, update key names accordingly.
          // Skip header row if it appears as data (e.g., first row duplicate).
          if (row['date'] && row['date'].trim() === 'date') {
            console.log('Skipping header row');
            return;
          }
          
          // Log row for debugging.
          // console.log(JSON.stringify(row, null, 2));
          
          // Build values array from CSV fields.
          const values = [
            // transaction_date:
            row['date'] && row['date'].trim() !== 'date' ? row['date'].trim() : null,
            // transaction_time:
            row['time'] && row['time'].trim() !== '' ? row['time'].trim() : null,
            row['time_zone'],
            this.parseMoney(row['gross_sales']),
            this.parseMoney(row['discounts']),
            this.parseMoney(row['service_charges']),
            this.parseMoney(row['net_sales']),
            this.parseMoney(row['gift_card_sales']),
            this.parseMoney(row['tax']),
            this.parseMoney(row['tip']),
            this.parseMoney(row['partial_refunds']),
            this.parseMoney(row['total_collected']),
            row['source'],
            this.parseMoney(row['card']),
            row['card_entry_methods'],
            this.parseMoney(row['cash']),
            this.parseMoney(row['square_gift_card']),
            this.parseMoney(row['other_tender']),
            row['other_tender_type'],
            row['tender_note'],
            this.parseMoney(row['fees']),
            this.parseMoney(row['net_total']),
            row['transaction_id'],
            row['payment_id'],
            row['card_brand'],
            row['pan_suffix'],
            row['device_name'],
            row['staff_name'],
            row['staff_id'],
            row['details'],
            row['description'],
            row['event_type'],
            row['location'],
            row['dining_option'],
            row['customer_id'],
            row['customer_name'],
            row['customer_reference_id'],
            row['device_nickname'],
            this.parseMoney(row['third_party_fees']),
            row['deposit_id'],
            row['deposit_date'] ? new Date(row['deposit_date']) : null,
            row['deposit_details'],
            parseFloat(row['fee_percentage_rate']) || null,
            this.parseMoney(row['fee_fixed_rate']),
            row['refund_reason'],
            row['discount_name'],
            row['transaction_status'],
            this.parseMoney(row['cash_app']),
            row['order_reference_id'],
            row['fulfillment_note'],
            (row['free_processing_applied'] === 'true' || row['free_processing_applied'] === '1'),
            row['channel'],
            this.parseMoney(row['unattributed_tips']),
            filePath // provenance: the source file path
          ];
          
          // Insert into the isolated square_trax table if configured.
          if (this.config.writeIsolated) {
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
            insertPromises.push(this.dbConnection.query(query, values));
            rowCount++;
          }
          
          // Process the unified transform.
          const unifiedTransformer = UnifiedTransformerFactory.getTransformer('square', this.dbConnection);
          insertPromises.push(
            unifiedTransformer.processRow(row).catch(err => {
              console.error('Error processing unified row:', err); // todo: log to logger
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

module.exports = SquareParser;
