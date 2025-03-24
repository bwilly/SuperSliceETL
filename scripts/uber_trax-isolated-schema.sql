-- uber_trax-isolated-schema.sql
-- This script creates the Uber trax table in PostgreSQL.
-- Each column includes comments explaining its purpose to aid in unification later.

CREATE TABLE uber_trax (
  store TEXT, -- Name of the store/restaurant (e.g., "Garcon SuperSlice Pizza Pie Parlor")
  external_store_id TEXT, -- External store identifier if provided (may be empty)
  country TEXT, -- Country name (e.g., "United States")
  country_code TEXT, -- Country code (e.g., "USA")
  city TEXT, -- City name (e.g., "Boston")
  order_id TEXT, -- Order identifier from the CSV (alphanumeric value)
  order_uuid UUID PRIMARY KEY, -- Unique order UUID (acts as the primary key)
  order_status TEXT, -- Status of the order (e.g., "completed", "canceled", "unfulfilled")
  delivery_status TEXT, -- Delivery status (may be empty if not applicable)
  scheduled BOOLEAN, -- Indicator if the order was scheduled (CSV: 0/1 mapped to BOOLEAN)
  completed BOOLEAN, -- Indicator if the order was completed (CSV: 0/1)
  online_order BOOLEAN, -- Indicator if the order was placed online (CSV: 0/1)
  canceled_by TEXT, -- Who canceled the order (e.g., "restaurant", "customer"), if applicable
  menu_item_count INTEGER, -- Number of menu items in the order
  currency_code TEXT, -- Currency code (e.g., "USD")
  ticket_size NUMERIC(10,2), -- Monetary amount representing the ticket size/order total
  date_ordered DATE, -- Date when the order was placed (YYYY-MM-DD)
  time_customer_ordered TIMESTAMP, -- Timestamp when the customer placed the order
  cancellation_time TIMESTAMP, -- Timestamp when the order was canceled (if applicable)
  time_merchant_accepted TIMESTAMP, -- Timestamp when the merchant accepted the order
  time_to_accept NUMERIC(5,2), -- Time taken to accept the order (in seconds or minutes; adjust as needed)
  original_prep_time NUMERIC(5,2), -- Original expected preparation time
  prep_time_increased BOOLEAN, -- Indicator if the preparation time was increased (CSV: 0/1 mapped to BOOLEAN)
  increased_prep_time NUMERIC(5,2), -- Additional prep time if increased
  courier_arrival_time TIMESTAMP, -- Time when the courier arrived at the restaurant
  time_courier_started_trip TIMESTAMP, -- Timestamp when the courier started the delivery trip
  time_courier_delivered TIMESTAMP, -- Timestamp when the courier delivered the order
  total_delivery_time NUMERIC(5,2), -- Total delivery time (in defined units)
  courier_wait_time_restaurant NUMERIC(5,2), -- Time the courier waited at the restaurant
  courier_wait_time_eater NUMERIC(5,2), -- Time the courier waited for the eater
  total_prep_handoff_time NUMERIC(5,2), -- Combined preparation and handoff time
  order_duration NUMERIC(5,2), -- Overall duration of the order process
  delivery_batch_type TEXT, -- Type of delivery batch (e.g., "NON_BATCHED", "MULTI_MERCHANT")
  fulfillment_type TEXT, -- Type of fulfillment (e.g., "Delivery", "Pickup")
  order_channel TEXT, -- Channel used for the order (e.g., "iOS", "Android", "Web")
  eats_brand TEXT, -- Brand associated with the order (e.g., "Uber Eats", "Postmates")
  subscription_pass TEXT, -- Subscription identifier if applicable (e.g., "UBER_ONE")
  workflow_uuid UUID, -- Workflow UUID for grouping and linking to itemizations
  source_file TEXT, -- Provenance: the CSV file name or path
  updated_at TIMESTAMPTZ DEFAULT now() -- Provenance: timestamp when the record was last updated/loaded
);
