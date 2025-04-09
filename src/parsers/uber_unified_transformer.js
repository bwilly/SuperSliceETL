// uber_unified_transformer.js

const UnifiedTransformer = require('../unified_transformer_abstract');

class UberUnifiedTransformer extends UnifiedTransformer {
  /**
   * Transforms an Uber trax row into a unified row.
   * @param {object} row - A parsed row from the Uber trax CSV.
   * @returns {object} - A unified row object.
   */
  transformRow(row) {
    return {
      platform: 'uber',
      // Use order_uuid as the external order identifier.
      external_order_id: row.order_uuid,
      // Combine date_ordered and time_customer_ordered into a single timestamp.
      // order_timestamp: new Date(`${row.date_ordered} ${row.time_customer_ordered}`),
      order_timestamp: new Date(`${row.time_customer_ordered}`),
      // Uber may not supply a customer field.
      customer: null,
      // Use the store field.
      store: row.store,
      // Fulfillment type directly maps.
      fulfillment_type: row.fulfillment_type,
      // Order status mapping.
      order_status: row.order_status,
      // Use ticket_size for the order total.
      order_total: row.ticket_size,
      // Uber might not have separate tip or tax fields.
      tip: null,
      tax: null,
      // Include additional Uber-specific metadata.
      metadata: {
        workflow_uuid: row.workflow_uuid,
        subscription_pass: row.subscription_pass
      },
      // Propagate the source file path.
      source_file: row.source_file
    };
  }
}

module.exports = UberUnifiedTransformer;
