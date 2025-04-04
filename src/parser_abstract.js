// parser_abstract.js

class CsvToPostgresFileParser {
    /**
     * Constructs a new parser instance.
     * @param {object} config - Configuration object for this parser.
     * @param {object} dbConnection - A database connection instance.
     */
    constructor(config, dbConnection) {
      if (new.target === CsvToPostgresFileParser) {
        throw new TypeError("Cannot construct CsvToPostgresFileParser instances directly");
      }
      this.config = config;
      this.dbConnection = dbConnection;
    }
  
    /**
     * Parses a CSV file and loads data into the database.
     * This method must be overridden by subclasses.
     *
     * @param {string} filePath - Path to the CSV file.
     * @returns {Promise<object>} - A promise that resolves with a result object containing status, rowCount, etc.
     */
    async parseFile(filePath) {
      throw new Error("parseFile() must be implemented by subclass");
    }
  }
  
  module.exports = CsvToPostgresFileParser;
  