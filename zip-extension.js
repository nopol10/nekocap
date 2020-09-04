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

zip.addLocalFolder("./dist/extension/");

const filename = `./dist/nekocap-extension-${date.getFullYear()}-${pad(
  date.getMonth() + 1,
  2,
  "0"
)}-${pad(date.getDate(), 2, "0")}-${pad(date.getHours(), 2, "0")}-${pad(
  date.getMinutes(),
  2,
  "0"
)}.zip`;

if (fs.existsSync(filename)) {
  fs.unlinkSync(filename);
}

zip.writeZip(filename);
