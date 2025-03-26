CREATE TABLE slice_trax (
  order_number TEXT PRIMARY KEY, -- Unique order number from Slice (e.g., "126819643")
  order_date TIMESTAMP,          -- Date and time of the order (parsed from "03-01-2025 01:47 AM")
  customer TEXT,                 -- Customer name (e.g., "Kat S")
  order_type TEXT,               -- Type of order (e.g., "Delivery", "Pickup")
  subtotal NUMERIC(10,2),        -- Subtotal amount (e.g., 29.00); ensure currency symbols are removed during import
  prepaid_tip NUMERIC(10,2),     -- Prepaid tip amount (e.g., 0.00)
  tax NUMERIC(10,2),             -- Tax charged on the order (e.g., 1.81)
  order_total NUMERIC(10,2),     -- Total order amount (e.g., 30.81)
  status TEXT,                   -- Order status (e.g., "Paid")
  
  source_file TEXT,              -- Provenance: the CSV file name or path from which this data was imported
  updated_at TIMESTAMPTZ DEFAULT now() -- Provenance: timestamp when the record was loaded/updated
);
