// src/parsers/slice_parser.js

const CsvToPostgresFileParser = require('../parser_abstract');

class SliceParser extends CsvToPostgresFileParser {
  constructor(config, dbConnection) {
    super(config, dbConnection);
    this.expectedHeaders = config.expectedHeaders || [];
  }

  async parseFile(filePath) {
    console.log(`SliceParser stub called for file: ${filePath}`);
    return { rowCount: 0 };
  }
}

module.exports = SliceParser;
