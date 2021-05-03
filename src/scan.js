const fs = require("fs");
const path = require("path");

const shouldScanDirectory = (file) => {
  const ignoredFolders = [
    "plugins",
    "applications",
    "appdata",
    "caches",
    "library",
  ];
  const { name } = file;

  return (
    file.isDirectory() &&
    !name.startsWith(".") &&
    !name.startsWith("$") &&
    !ignoredFolders.includes(name.replace(/ +/g, "-").toLowerCase())
  );
};

const getAllPathsToDirectories = (dirPath, dirTypeToScan, arrayOfDir) => {
  try {
    let files = fs.readdirSync(dirPath, { withFileTypes: true });
    arrayOfDir = arrayOfDir || [];
    files.forEach((file) => {
      let absolutePath = path.join(dirPath, file.name);
      if (shouldScanDirectory(file)) {
        console.log("Scanning : ", absolutePath);
        if (dirTypeToScan.includes(file.name) === true) {
          arrayOfDir.push(absolutePath);
        } else {
          getAllPathsToDirectories(absolutePath, dirTypeToScan, arrayOfDir);
        }
      }
    });
    return arrayOfDir;
  } catch (err) {
    console.error(`Could Not Scan : ${err.code} : ${err.path}`);
  }
};

exports.getHomePath = () => {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
};

exports.allDirectories = (pathToScan, dirTypeToScan) => {
  let results = [];
  const scannedDirs = getAllPathsToDirectories(pathToScan, dirTypeToScan);
  if (Array.isArray(scannedDirs) && scannedDirs.length > 0) {
    results = scannedDirs;
    console.clear();
  }
  return results;
};
