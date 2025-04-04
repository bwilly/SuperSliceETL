#!/usr/bin/env node
/**
 * main_pipeline.js
 *
 * This is the entry point for the unified ETL pipeline.
 * It loads configuration, initializes logging, scans the CSV folder, processes each file using the parser factory,
 * and then deprovisions files (archives or moves to a failed folder).
 */

const yaml = require('js-yaml');
const fs = require('fs');
const { Client } = require('pg');
const { scanFolder } = require('./folder_scanner');
const { processFiles } = require('./file_marshal');
const { getParser } = require('./parser_factory');
const winston = require('winston');
const path = require('path');

// Load configuration from YAML
const config = yaml.load(fs.readFileSync('../config/config.yaml', 'utf8'));

// Initialize Winston logger with debug level.
const logger = winston.createLogger({
  level: config.logLevel || 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: config.logFile || 'app.log' })
  ]
});

// Create a PostgreSQL client using connection string from config.
const dbClient = new Client({ connectionString: config.database.connectionString });
dbClient.connect().then(() => {
  logger.info('Database connected.');
  // Scan the raw CSV directory using the provided regex (convert string to RegExp)
  const fileRegex = new RegExp(config.fileRegex);
  scanFolder(config.rawCsvDir, fileRegex)
    .then(async (fileList) => {
      logger.info(`Found ${fileList.length} files to process.`);
      
      // Process files using the FileMarshal module.
      // Here, we pass a custom parserFactory function to get a parser instance.
      // For each file, we determine the platform from its parent folder.
      const parserFactory = {
        getParser: (platform, fileType) => getParser(platform, fileType, config, dbClient)
      };
      
      const results = await processFiles(fileList, parserFactory, config, logger);
      results.forEach(result => {
        if (result.status === 'success') {
          logger.info(`File processed: ${result.filePath} (${result.rowCount} rows inserted)`);
        } else {
          logger.error(`File failed: ${result.filePath} - ${result.error}`);
        }
      });
    })
    .catch(err => {
      logger.error('Error scanning folder: ' + err.message);
    })
    .finally(() => {
      dbClient.end().then(() => logger.info('Database connection closed.'));
    });
}).catch(err => {
  logger.error('Database connection failed: ' + err.message);
});
