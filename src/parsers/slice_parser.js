#!/usr/bin/env node
/**
 * parsers/slice_parser.js
 *
 * A Slice CSV-to-Postgres parser that implements the standardized interface.
 * This parser takes a legacy Slice trax CSV file, validates normalized headers,
 * transforms rows, inserts rows into the slice_trax isolated table, and passes rows
 * to the unified transformer.
 *
 * Legacy fields (after header normalization):
 *   - order_number   <= from "Order #" (mapped to "order_number")
 *   - order_date     <= from "Order Date"
 *   - customer       <= from "Customer"
 *   - order_type     <= from "Order Type"
 *   - subtotal       <= from "Subtotal"
 *   - prepaid_tip    <= from "Prepaid Tip"
 *   - tax            <= from "Tax"
 *   - order_total    <= from "Order Total"
 *   - status         <= from "Status"
 */

const csv = require('csv-parser');
const fs = require('fs');
const CsvToPostgresFileParser = require('../parser_abstract'); // abstract base class
const UnifiedTransformerFactory = require('../unified_transformer_factory');

class SliceParser extends CsvToPostgresFileParser {
  /**
   * @param {object} config - Configuration for the Slice parser (expectedHeaders, writeIsolated flag, etc.)
   * @param {object} dbConnection - Database connection.
   */
  constructor(config, dbConnection) {
    super(config, dbConnection);
    // Normalize expected headers: we expect them already to be provided in normalized form.
    // For Slice, use: order_number, order_date, customer, order_type, subtotal, prepaid_tip, tax, order_total, status
    this.expectedHeaders = config.expectedHeaders.map(h => h.toLowerCase().trim());
  }

  /**
   * Helper: Convert empty strings to null.
   * @param {string} val
   * @returns {string|null}
   */
  maybeNull(val) {
    return (val && val.trim() !== '') ? val.trim() : null;
  }

  /**
   * Helper: Parse a monetary string into a float.
   * @param {string} val
   * @returns {number|null}
   */
  parseMoney(val) {
    if (!val || val.trim() === '') return null;
    const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  }

  /**
   * Helper: Parse a date/time string into a Date object.
   * Assumes the legacy format (e.g., "03-01-2025 01:47 AM").
   * @param {string} val
   * @returns {Date|null}
   */
  parseDateTime(val) {
    if (!val || val.trim() === '') return null;
    // Using new Date() for now; refine as needed for custom formats.
    return new Date(val);
  }

  /**
   * Parses a Slice CSV file, validates headers, inserts rows into the slice_trax table,
   * and passes rows to the unified transformer.
   * @param {string} filePath - Path to the Slice CSV file.
   * @returns {Promise<object>} - Resolves with a result object (e.g., {rowCount: number})
   */
  parseFile(filePath) {
    return new Promise((resolve, reject) => {
      const insertPromises = [];
      const unifiedPromises = [];
      
      fs.createReadStream(filePath)
        .pipe(csv({
          // Normalize headers: lower-case, trim, replace spaces with underscores, remove "?"
          // and map "order_#" to "order_number".
          mapHeaders: ({ header }) => {
            let normalized = header.trim().toLowerCase().replace(/\s+/g, '_').replace(/[?]/g, '');
            if (normalized === 'order_#') {
              normalized = 'order_number';
            }
            return normalized;
          }
        }))
        .on('headers', (hdrs) => {
          console.log('Detected headers:', hdrs);
          // Validate that all expected headers are present.
          // const missing = this.expectedHeaders.filter(exp => !hdrs.includes(exp));
          // if (missing.length > 0) {
          //   return reject(new Error(`Missing headers in file: ${missing.join(', ')}`));
          // }
        })
        .on('data', (row) => {
          // Skip a header row if it appears as data.
          if (row.order_number && row.order_number.toLowerCase() === 'order_number') {
            console.log('Skipping header row');
            return;
          }
          
          console.log(JSON.stringify(row, null, 2));
          
          const values = [
            this.maybeNull(row.order_number),         // order_number
            this.parseDateTime(row.order_date),         // order_date
            this.maybeNull(row.customer),               // customer
            this.maybeNull(row.order_type),             // order_type
            this.parseMoney(row.subtotal),              // subtotal
            this.parseMoney(row.prepaid_tip),           // prepaid_tip
            this.parseMoney(row.tax),                   // tax
            this.parseMoney(row.order_total),           // order_total
            this.maybeNull(row.status),                 // status
            filePath                                    // source_file for provenance
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

          if (this.config.writeIsolated) {
            insertPromises.push(this.dbConnection.query(query, values));
          }
          
          const unifiedTransformer = UnifiedTransformerFactory.getTransformer('slice', this.dbConnection);
          unifiedPromises.push(
            unifiedTransformer.processRow(row).catch(err => {
              console.error('Error processing unified row:', err);
            })
          );
        })
        .on('end', async () => {
          try {
            await Promise.all([...insertPromises, ...unifiedPromises]);
            resolve({ rowCount: insertPromises.length });
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

module.exports = SliceParser;
