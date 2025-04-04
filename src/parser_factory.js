// parser_factory.js

// Import your platform-specific parser implementations.
const UberParser = require('./parsers/uber_parser');
const SquareParser = require('./parsers/square_parser');
const SliceParser = require('./parsers/slice_parser');

/**
 * Returns an instance of a CSV-to-Postgres file parser based on the platform and file type.
 * @param {string} platform - e.g., 'uber', 'square', 'slice'
 * @param {string} fileType - e.g., 'trax' or 'itemized'
 * @param {object} config - Configuration for the parser (including expected headers).
 * @param {object} dbConnection - Database connection.
 * @returns {object} - A parser instance implementing parseFile(filePath): Promise<Result>
 */
function getParser(platform, fileType, config, dbConnection) {
  switch (platform.toLowerCase()) {
    case 'uber':
      return new UberParser(config.platforms.uber, dbConnection);
    case 'square':
      return new SquareParser(config.platforms.square, dbConnection);
    case 'slice':
      return new SliceParser(config.platforms.slice, dbConnection);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

module.exports = { getParser };
