const AdmZip = require('adm-zip');

// Extract archive file safely.
const extractZip = function (zipPath, extractDir, maxFiles = 100, maxSize = 50000000) {
  const MAX_FILES = maxFiles;
  const MAX_SIZE = maxSize; // 50MB
  const THRESHOLD_RATIO = 10;

  let fileCount = 0;
  let totalSize = 0;
  let zip = new AdmZip(zipPath);
  let zipEntries = zip.getEntries();
  zipEntries.forEach(function(zipEntry) {
      fileCount++;
      if (fileCount > MAX_FILES) throw new Error('Reached max. number of files');

      let entrySize = zipEntry.getData().length;
      totalSize += entrySize;
      if (totalSize > MAX_SIZE) throw new Error('Reached max. size');

      let compressionRatio = entrySize / zipEntry.header.compressedSize;
      if (compressionRatio > THRESHOLD_RATIO) throw new Error('Reached max. compression ratio');

      if (!zipEntry.isDirectory) {
          zip.extractEntryTo(zipEntry.entryName, extractDir);
      }
  });
}

module.exports = extractZip;
