const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://username:password@localhost:5432/yourdb'
});
client.connect();

const filePath = 'path/to/slice_trax.csv';

fs.createReadStream(filePath)
  .pipe(csv())
  .on('data', async (row) => {
    try {
      // 1. Remove currency symbols and parse monetary values.
      const parseMoney = (val) => parseFloat(val.replace(/[^0-9.-]+/g, '')) || 0;

      // 2. Convert order date from format "03-01-2025 01:47 AM" to a JavaScript Date object.
      const orderDate = new Date(row['Order Date']); // May need custom parsing if format is non-standard.

      const values = [
        row['Order #'],
        orderDate,
        row['Customer'],
        row['Order Type'],
        parseMoney(row['Subtotal']),
        parseMoney(row['Prepaid Tip']),
        parseMoney(row['Tax']),
        parseMoney(row['Order Total']),
        row['Status'],
        filePath,                // source_file
      ];

      const query = `
        INSERT INTO slice_trax (
          order_number, order_date, customer, order_type,
          subtotal, prepaid_tip, tax, order_total, status, source_file
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
        )
        ON CONFLICT (order_number) DO NOTHING;
      `;

      await client.query(query, values);
    } catch (err) {
      console.error('Error processing Slice trax row:', err);
    }
  })
  .on('end', () => {
    console.log('Slice trax CSV file successfully processed.');
    client.end();
  });
