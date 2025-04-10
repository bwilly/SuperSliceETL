const UnifiedTransformer = require('../unified_transformer_abstract');

class SliceUnifiedTransformer extends UnifiedTransformer {

/**
   * Parses a currency string and returns a numeric value.
   * E.g., "$9.73" becomes 9.73.
   * @param {string} val - The input currency string.
   * @returns {number|null} - The parsed number or null if conversion fails.
   */
parseMoney(val) {
    if (!val || typeof val !== 'string' || val.trim() === '') return null;
    const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : num;
  }


  /**
   * Transforms a Slice CSV row into a unified row.
   *
   * Assumptions:
   *  - platform: Fixed as 'slice'
   *  - external_order_id: Using the normalized order_number from the CSV.
   *  - order_timestamp: Converted from the order_date field.
   *  - customer: Directly from the customer field.
   *  - fulfillment_type: Derived from order_type.
   *  - order_status: Directly from status.
   *  - order_total: Parsed value from order_total.
   *  - metadata: Includes additional details like subtotal, prepaid_tip, and tax.
   *
   * @param {object} row - A parsed row from the Slice CSV.
   * @returns {object} - A unified row object.
   */
  transformRow(row) {
    return {
      platform: 'slice',
      external_order_id: row.order_number,            // Using order_number as identifier.
      order_timestamp: new Date(row.order_date),        // Combining (or converting) order_date.
      customer: row.customer || null,                   // Customer details.
      fulfillment_type: row.order_type,                 // Mapping order_type as fulfillment_type.
      order_status: row.status,                         // Mapping status.
      order_total: this.parseMoney(row.order_total) || null, // Convert order_total to numeric.
      metadata: {
        subtotal: row.subtotal,
        prepaid_tip: row.prepaid_tip,
        tax: row.tax
      },
      source_file: row.source_file
    };
  }
}

module.exports = SliceUnifiedTransformer;
