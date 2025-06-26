/**
 * Mar26'25
 * Brian Willy
 * 
 * From the thought:
 * Next, i would like to create a file loader that will look in the raw 
 * csv dir and find files that match a configurable regex. 
 * those file are matched from an arg passed to the loader 
 * that determines if it is looking for which platform csv. 
 * Change of thought here. Do determine which platform loader/parser to use, 
 * istead the header row should be inspected in the csv. But that will be more complicated and slower.
 * So I won't do that now. Instead, for this interation, the source platform will be determined by the folder. 
 * Let's use a regex to parse the parent folder name and determine parser to use.
 * 
 * 
 * This job should Scan a folder, Parse the files and Insert the files
 * into a DB, then Move or Delete the files. Let's call this last part 
 * the File Deprovisioner.
 * 
 * FolderScanner
 *  Input: folderPath, regex
 *  Output: fileList
 * 
 * FileMarshal
 *  Input: fileList, parserFactory
 *  Output: statusMessage
 * 
 * ParserFactory
 *  Input: parserName, dbConnection
 *  Output: failedFilesList
 * 
 * CsvToPostgresFileParser
 *  Input: file, dbConnection
 *  Output: statusMessage
 *  Validate: that the headers in the CSV match the expected headers predefined in the parser
 *  Write parsed CSV model to the table predefined by this parser.
 * 
 * UnifiedTransformer
 *  
 */

// Got the trax loading on April 10, 2025
// not yet the itemz

/**
 * Queries for dev, debug, troubleshooting
 * 
 
\dt

SELECT external_store_id, order_id, order_uuid, order_status, date_ordered, time_customer_ordered, workflow_uuid, source_file  FROM uber_trax LIMIT 100;

select * from unified_trax;
SELECT id, platform, external_order_id, order_timestamp, customer, fulfillment_type, order_status, order_total FROM unified_trax LIMIT 100;


 * 
 */

/**
 * 
 * Export DB to CSV for graphing
 * 
 * see evernote
 * 
 */