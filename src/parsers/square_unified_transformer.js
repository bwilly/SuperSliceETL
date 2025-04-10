const UnifiedTransformer = require('../unified_transformer_abstract');

class SquareUnifiedTransformer extends UnifiedTransformer {

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
   * Transforms a Square CSV row into a unified row.
   * Please review the field mappings and confirm or adjust:
   *
   * Assumptions:
   * 1. external_order_id: Using "transaction_id" as the order identifier.
   * 2. order_timestamp: Combining "date" and "time" fields (e.g., "2025-04-09" and "14:30:00").
   * 3. customer: Using "customer_name". (Optionally, a more structured object could include customer_id.)
   * 4. store: Using "location" from the Square CSV.
   * 5. fulfillment_type: Using "dining_option" to indicate fulfillment mode.
   * 6. order_status: Taken directly from "transaction_status".
   * 7. order_total: Using "net_total". (Alternatively, "total_collected" might be used.)
   * 8. tip and tax: Directly mapped from Square fields.
   * 9. metadata: Includes other financial details and transaction data.
   *
   * @param {object} row - A parsed row from the Square CSV.
   * @returns {object} - A unified row object.
   */
  transformRow(row) {
    return {
      platform: 'square',
      external_order_id: row.transaction_id,            // Q1: Is transaction_id the correct external order identifier?
      order_timestamp: new Date(`${row.date} ${row.time}`), // Q2: Combine date and time fields? Please confirm format.
      customer: row.customer_name || null,               // Q3: Should we include more customer details (e.g., customer_id)?
      store: row.location,                               // Q4: Is location the right field for store info?
      fulfillment_type: row.dining_option,               // Q5: Is dining_option an appropriate mapping for fulfillment type?
      order_status: row.transaction_status,              // Q6: Confirm this mapping.
      order_total: this.parseMoney(row.net_total), // Convert currency to numeric.
      tip: this.parseMoney(row.tip),   
      tax: this.parseMoney(row.tax),  
      metadata: {
        time_zone: row.time_zone,
        gross_sales: row.gross_sales,
        discounts: row.discounts,
        service_charges: row.service_charges,
        gift_card_sales: row.gift_card_sales,
        partial_refunds: row.partial_refunds,
        total_collected: row.total_collected,
        card: row.card,
        card_entry_methods: row.card_entry_methods,
        cash: row.cash,
        square_gift_card: row.square_gift_card,
        other_tender: row.other_tender,
        other_tender_type: row.other_tender_type,
        tender_note: row.tender_note,
        fees: row.fees,
        payment_id: row.payment_id,
        card_brand: row.card_brand,
        pan_suffix: row.pan_suffix,
        device_name: row.device_name,
        staff_name: row.staff_name,
        staff_id: row.staff_id,
        details: row.details,
        description: row.description,
        event_type: row.event_type,
        customer_id: row.customer_id,
        customer_reference_id: row.customer_reference_id,
        device_nickname: row.device_nickname,
        third_party_fees: row.third_party_fees,
        deposit_id: row.deposit_id,
        deposit_date: row.deposit_date,
        deposit_details: row.deposit_details,
        fee_percentage_rate: row.fee_percentage_rate,
        fee_fixed_rate: row.fee_fixed_rate,
        refund_reason: row.refund_reason,
        discount_name: row.discount_name,
        cash_app: row.cash_app,
        order_reference_id: row.order_reference_id,
        fulfillment_note: row.fulfillment_note,
        free_processing_applied: row.free_processing_applied,
        channel: row.channel,
        unattributed_tips: row.unattributed_tips
      },
      source_file: row.source_file
    };
  }
}

module.exports = SquareUnifiedTransformer;
