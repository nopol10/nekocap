const AdmZip = require("adm-zip");
const fs = require("fs");

const date = new Date();

const zip = new AdmZip();

const pad = (inString, length, padCharacter) => {
  const stringLength = inString.toString().length;
  if (stringLength < length) {
    for (let i = 0; i < length - stringLength; i++) {
      inString = padCharacter + inString;
    }
  }
  return inString;
};

zip.addLocalFolder("../nekocap", "", (filename) => {
  const excludedFiles = [
    ".env",
    ".env.prod",
    "dist/",
    "dist\\",
    "docker/",
    "docker\\",
    ".git",
    ".vscode",
    "node_modules",
    "server-fonts",
    "webdist",
    ".eslintcache",
    "Dockerfile",
    ".zip",
    "package-backup.json",
    "zip-source.js",
    ".next",
    "pages/",
    "pages\\",
    "public/",
    "public\\",
    "next-env.d.ts",
    "next-i18next.config.js",
    "next.config.js",
    ".release-it.js",
    "webserver.js",
    "server.js",
  ];
  for (let i = 0; i < excludedFiles.length; i++) {
    if (filename.indexOf(excludedFiles[i]) >= 0) {
      return false;
    }
  }
  return true;
});
const filename = `./nekocap-source-${date.getFullYear()}-${pad(
  date.getMonth() + 1,
  2,
  "0",
)}-${pad(date.getDate(), 2, "0")}-${pad(date.getHours(), 2, "0")}-${pad(
  date.getMinutes(),
  2,
  "0",
)}.zip`;

if (fs.existsSync(filename)) {
  fs.unlinkSync(filename);
}

zip.writeZip(filename);
