// unified_transformer_abstract.js

class UnifiedTransformer {
    /**
     * Constructs a new UnifiedTransformer.
     * @param {object} dbConnection - A PostgreSQL client/connection.
     */
    constructor(dbConnection) {
      if (new.target === UnifiedTransformer) {
        throw new TypeError("Cannot construct UnifiedTransformer instances directly");
      }
      this.dbConnection = dbConnection;
    }
  
    /**
     * Transforms a source-specific parsed row into a unified row object.
     * Must be implemented by subclass.
     * @param {object} row - A source-specific row.
     * @returns {object} - A unified row object.
     */
    transformRow(row) {
      throw new Error("transformRow() must be implemented by subclass");
    }
  
    /**
     * Inserts a unified row into the unified_trax table.
     * @param {object} unifiedRow - The unified row object.
     * @returns {Promise} - A promise that resolves when the row is inserted.
     */
    async insertUnifiedRow(unifiedRow) {
      const query = `
        INSERT INTO unified_trax (
          platform,
          external_order_id,
          order_timestamp,
          customer,
          store,
          fulfillment_type,
          order_status,
          order_total,
          tip,
          tax,
          metadata,
          source_file
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        )
        ON CONFLICT (platform, external_order_id) DO NOTHING; -- todo: log conflict 
      `;
      const values = [
        unifiedRow.platform,
        unifiedRow.external_order_id,
        unifiedRow.order_timestamp,
        unifiedRow.customer,
        unifiedRow.store,
        unifiedRow.fulfillment_type,
        unifiedRow.order_status,
        unifiedRow.order_total,
        unifiedRow.tip,
        unifiedRow.tax,
        JSON.stringify(unifiedRow.metadata || {}),
        unifiedRow.source_file
      ];
      return this.dbConnection.query(query, values);
    }
  
    /**
     * Processes a single row: transforms it and inserts into the unified table.
     * @param {object} row - A source-specific parsed row.
     * @returns {Promise}
     */
    // async processRow(row) {
     
    //   const unifiedRow = this.transformRow(row);
    //   console.log(row);
    //   return this.insertUnifiedRow(unifiedRow);
    // }
    async processRow(row) {
      const unifiedRow = this.transformRow(row);
      console.log("Transformed unified row:", unifiedRow);
      try {
        const result = await this.insertUnifiedRow(unifiedRow);
        console.log("Insert successful, DB response:", result);
        return result;
      } catch (err) {
        console.error("Error inserting unified row:", err);
        throw err;
      }
    }
  }
  
  module.exports = UnifiedTransformer;
  