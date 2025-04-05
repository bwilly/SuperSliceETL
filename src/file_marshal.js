// file_marshal.js
const path = require('path');
const fs = require('fs');

/**
 * Moves a file from source to destination.
 * @param {string} sourcePath - The current file path.
 * @param {string} destinationFolder - The folder to move the file into.
 * @returns {Promise} - Resolves when move is complete.
 */
function moveFile(sourcePath, destinationFolder) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(sourcePath);
    const destPath = path.join(destinationFolder, fileName);
    fs.rename(sourcePath, destPath, (err) => {
      if (err) return reject(err);
      resolve(destPath);
    });
  });
}

/**
 * Processes an array of files.
 * For each file, it uses the provided parserFactory to get the right parser,
 * calls its parseFile() method, logs the result, and then moves the file to archive or failed folder.
 *
 * @param {string[]} fileList - List of file paths to process.
 * @param {object} parserFactory - A parser factory instance.
 * @param {object} config - Configuration object (includes archivePath, failedPath, dryRun, etc.).
 * @param {object} logger - Winston logger instance.
 * @returns {Promise} - Resolves when all files are processed.
 */
async function processFiles(fileList, parserFactory, config, logger) {
  const results = await Promise.all(fileList.map(async (filePath) => {
    try {
      // Determine platform and file type from the filePath.
      // For this example, we assume the parent folder name indicates the platform.
      const parentFolder = path.basename(path.dirname(filePath)).toLowerCase();
      const platform = parentFolder; // e.g., 'uber', 'square', or 'slice'
      
      // Determine file type using regex values from the config.
      // Assume config.fileTypeRegexes has two properties: 'trax' and 'itemz'.
      const traxRegex = new RegExp(config.fileTypeRegexes.trax, 'i');
      const itemzRegex = new RegExp(config.fileTypeRegexes.itemz, 'i');
      let fileType;
      if (traxRegex.test(filePath)) {
        fileType = 'trax';
      } else if (itemzRegex.test(filePath)) {
        fileType = 'itemz';
      } else {
        throw new Error(`File type for ${filePath} does not match either trax or itemz regex.`);
      }

      logger.info(`Parser platform: ${platform}, type: ${fileType}`);

      // Get the appropriate parser instance.
      const parser = parserFactory.getParser(platform, fileType);
      
      // Parse the file. The parser should handle both insertion into the source-specific table
      // and optionally transformation to the unified table.
      const result = await parser.parseFile(filePath);
      logger.info(`Processed file ${filePath}: ${result.rowCount} rows inserted.`);
      
      // If not in dry-run mode, move the file to archive.
      if (!config.dryRun) {
        await moveFile(filePath, config.archivePath);
        logger.debug(`Moved file ${filePath} to archive folder.`);
      }
      return { filePath, status: 'success', rowCount: result.rowCount };
    } catch (error) {
      logger.error(`Error processing file ${filePath}: ${error.message}`);
      // On error, if not dry-run, move the file to the failed folder.
      if (!config.dryRun) {
        try {
          await moveFile(filePath, config.failedPath);
          logger.debug(`Moved file ${filePath} to failed folder.`);
        } catch (moveErr) {
          logger.error(`Failed to move file ${filePath}: ${moveErr.message}`);
        }
      }
      return { filePath, status: 'failed', error: error.message };
    }
  }));
  return results;
}

module.exports = { processFiles, moveFile };
