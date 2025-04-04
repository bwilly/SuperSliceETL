const fs = require('fs');
const path = require('path');

/**
 * Scans the immediate subdirectories of a folder for files that match the given regex.
 * @param {string} folderPath - The root folder to scan (e.g., the raw_csv folder).
 * @param {RegExp} regex - A regular expression to match filenames.
 * @returns {Promise<string[]>} - A promise that resolves with an array of file paths.
 */
function scanFolder(folderPath, regex) {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, { withFileTypes: true }, (err, entries) => {
      if (err) {
        return reject(err);
      }

      let fileList = [];
      const subfolderPromises = entries.map(entry => {
        const fullPath = path.join(folderPath, entry.name);
        if (entry.isDirectory()) {
          // For each subdirectory, read its files.
          return new Promise((res, rej) => {
            fs.readdir(fullPath, (err, files) => {
              if (err) return rej(err);
              // Filter files that match the regex.
              files.forEach(file => {
                if (regex.test(file)) {
                  fileList.push(path.join(fullPath, file));
                }
              });
              res();
            });
          });
        } else {
          // Optionally, if there are files directly in raw_csv (which you might not want), ignore them.
          return Promise.resolve();
        }
      });

      Promise.all(subfolderPromises)
        .then(() => resolve(fileList))
        .catch(reject);
    });
  });
}

module.exports = { scanFolder };
