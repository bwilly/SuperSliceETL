CREATE TABLE square_trax (
  transaction_date DATE, -- Date of the transaction (from CSV "Date")
  transaction_time TIME, -- Time of the transaction (from CSV "Time")
  time_zone TEXT, -- Time zone information (e.g., "Eastern Time (US & Canada)")
  
  gross_sales NUMERIC(10,2), -- Gross sales amount (e.g., "$9.50")
  discounts NUMERIC(10,2), -- Discounts applied
  service_charges NUMERIC(10,2), -- Service charges applied
  net_sales NUMERIC(10,2), -- Net sales after adjustments
  gift_card_sales NUMERIC(10,2), -- Sales via gift cards
  tax NUMERIC(10,2), -- Tax collected
  tip NUMERIC(10,2), -- Tip amount collected
  partial_refunds NUMERIC(10,2), -- Partial refunds processed
  total_collected NUMERIC(10,2), -- Total amount collected
  
  source TEXT, -- Source of payment entry (e.g., "Register")
  card NUMERIC(10,2), -- Amount paid via card (from CSV "Card")
  card_entry_methods TEXT, -- How the card was entered (e.g., "Tapped", "Dipped")
  cash NUMERIC(10,2), -- Cash amount collected
  square_gift_card NUMERIC(10,2), -- Amount paid using a Square gift card
  other_tender NUMERIC(10,2), -- Amount paid by other tender methods
  other_tender_type TEXT, -- Type of the other tender (if any)
  tender_note TEXT, -- Notes regarding the tender
  
  fees NUMERIC(10,2), -- Fees applied to the transaction (can be negative)
  net_total NUMERIC(10,2), -- Net total after fees
  
  transaction_id TEXT PRIMARY KEY, -- Unique transaction identifier from Square
  payment_id TEXT, -- Payment identifier
  card_brand TEXT, -- Card brand used (e.g., "MasterCard", "Visa")
  pan_suffix TEXT, -- Last four digits of the card (PAN suffix)
  device_name TEXT, -- Name of the device used (e.g., "Square Register 0575")
  staff_name TEXT, -- Name of the staff member who processed the transaction
  staff_id TEXT, -- Staff identifier
  
  details TEXT, -- URL or reference with transaction details
  description TEXT, -- Description of items or services (comma-separated list)
  event_type TEXT, -- Type of event (typically "Payment")
  location TEXT, -- Location or store name (e.g., "Garçon SuperSlice")
  dining_option TEXT, -- Dining option (e.g., "Takeout") if applicable
  
  customer_id TEXT, -- Customer identifier (if provided)
  customer_name TEXT, -- Customer name
  customer_reference_id TEXT, -- Additional customer reference ID if available
  device_nickname TEXT, -- Nickname for the device, if provided
  third_party_fees NUMERIC(10,2), -- Fees assessed by third parties
  
  deposit_id TEXT, -- Identifier for the deposit (if applicable)
  deposit_date DATE, -- Date of deposit
  deposit_details TEXT, -- Additional details regarding the deposit
  fee_percentage_rate NUMERIC(5,2), -- Percentage rate of fees applied
  fee_fixed_rate NUMERIC(10,2), -- Fixed fee amount applied
  refund_reason TEXT, -- Reason for any refund (if applicable)
  discount_name TEXT, -- Name of any discount applied
  
  transaction_status TEXT, -- Status of the transaction (e.g., "Complete")
  cash_app NUMERIC(10,2), -- Amount paid via Cash App (if applicable)
  order_reference_id TEXT, -- Order reference ID (can assist with later unification)
  fulfillment_note TEXT, -- Note on fulfillment, if provided
  free_processing_applied BOOLEAN, -- Indicator if free processing was applied
  channel TEXT, -- Sales channel (e.g., "Register")
  unattributed_tips NUMERIC(10,2), -- Tips that couldn’t be attributed to a specific source
  
  source_file TEXT, -- Provenance: the CSV file name/path
  updated_at TIMESTAMPTZ DEFAULT now() -- Provenance: load/update timestamp
);
