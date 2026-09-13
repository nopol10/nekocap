const fs = require("fs");
const path = require("path");
const { zipSync } = require("fflate");

/**
 * Recursively lists every file and directory under `dir`.
 * Directory entries carry a trailing path separator so that filters can
 * distinguish them from files (matches the previous adm-zip behaviour).
 */
const listEntries = (dir) => {
  let entries = [];
  fs.readdirSync(dir).forEach((name) => {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    entries.push(
      path.normalize(fullPath) + (stat.isDirectory() ? path.sep : ""),
    );
    if (stat.isDirectory()) {
      entries = entries.concat(listEntries(fullPath));
    }
  });
  return entries;
};

/**
 * Zips the contents of `localPath` into `outputFile`.
 *
 * `filter` receives each entry's path relative to `localPath` (using the OS
 * path separator, directories end with the separator) and should return
 * `true` to include the entry.
 */
const zipFolder = (localPath, outputFile, filter = () => true) => {
  const root = path.normalize(localPath);
  if (!fs.existsSync(root)) {
    throw new Error(`Folder not found: ${root}`);
  }
  const files = {};
  listEntries(root).forEach((entry) => {
    const relative = path.relative(root, entry);
    const isDirectory = entry.endsWith(path.sep);
    const filterPath = isDirectory ? relative + path.sep : relative;
    if (isDirectory || !filter(filterPath)) {
      return;
    }
    const entryName = relative.split(path.sep).join("/");
    const stat = fs.statSync(entry);
    files[entryName] = [fs.readFileSync(entry), { mtime: stat.mtime }];
  });
  fs.writeFileSync(outputFile, zipSync(files));
};

module.exports = { zipFolder };
