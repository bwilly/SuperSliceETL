-- Ensure the uuid-ossp extension is available for UUID generation.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE unified_trax (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Internal UUID primary key.
  platform TEXT NOT NULL,            -- e.g., 'uber', 'square', or 'slice'
  external_order_id TEXT NOT NULL,   -- The original order identifier from the source.
  order_timestamp TIMESTAMPTZ,       -- Combined date and time of the order.
  customer TEXT,                     -- Customer name if available.
  store TEXT,                        -- Store or location.
  fulfillment_type TEXT,             -- e.g., 'Delivery' or 'Pickup'
  order_status TEXT,                 -- e.g., 'completed', 'canceled'
  order_total NUMERIC(10,2),         -- Total order amount.
  tip NUMERIC(10,2),                 -- Tip amount, if applicable.
  tax NUMERIC(10,2),                 -- Tax amount.
  metadata JSONB,                    -- Any additional details stored as JSON.
  source_file TEXT,                  -- Provenance: original CSV file path.
  created_at TIMESTAMPTZ DEFAULT now(),  -- Record insertion timestamp.
  CONSTRAINT uq_platform_external_order_id UNIQUE (platform, external_order_id)
);
