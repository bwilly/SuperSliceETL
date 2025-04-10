// unified_transformer_factory.js

const UberUnifiedTransformer = require('./parsers/uber_unified_transformer');
const SquareUnifiedTransformer = require('./parsers/square_unified_transformer');
const SliceUnifiedTransformer = require('./parsers/slice_unified_transformer');

class UnifiedTransformerFactory {
  /**
   * Returns an instance of a unified transformer for the given platform.
   * @param {string} platform - The source platform (e.g., 'uber', 'square', 'slice').
   * @param {object} dbConnection - Database connection.
   * @returns {UnifiedTransformer}
   */
  static getTransformer(platform, dbConnection) {
    switch (platform.toLowerCase()) {
      case 'uber':
        return new UberUnifiedTransformer(dbConnection);
      case 'square':
        return new SquareUnifiedTransformer(dbConnection);
      case 'slice':
        return new SliceUnifiedTransformer(dbConnection);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

module.exports = UnifiedTransformerFactory;
