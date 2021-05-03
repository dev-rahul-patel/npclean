const inquirer = require("inquirer");
const scan = require("./scan");
const fs = require("fs");
const getSize = require("get-folder-size");

const handleError = (error) => {
  if (error.isTtyError) {
    // Prompt couldn't be rendered in the current environment
    console.error("Current Environment Not Supported");
  } else {
    // Something else went wrong
    console.error("Something Went Wrong", error);
  }
};

const askForDeleteConfirmation = (dirsToDelete) => {
  inquirer
    .prompt([
      {
        type: "confirm",
        message: "Selected Folders Will Be Delete, Is that Fine ?",
        name: "dirToDelete",
        default: false,
      },
    ])
    .then((consent) => {
      if (consent.dirToDelete === true) {
        dirsToDelete.forEach((dir) => {
          let dirWithSize = dir.split(" | ");
          fs.rmdirSync(dirWithSize[1], { recursive: true });
          console.warn("DELETED: ", dir);
        });
      }
    })
    .catch(handleError);
};

const addFileSizeToDirectoryPath = (dirsToDelete = []) => {
  return dirsToDelete.map((dir) => {
    return new Promise((resolve, reject) => {
      getSize(dir, (err, size) => {
        if (err) {
          reject(err);
        }
        resolve({
          path: dir,
          size: (size / 1024 / 1024).toFixed(2),
        });
      });
    });
  });
};

const askUserToSelectDirectoriesToDelete = (dirsToDelete = []) => {
  const dirsWithSizes = addFileSizeToDirectoryPath(dirsToDelete);
  console.log("Scan Completed...");
  console.log("Taking Care Of Few Things...");
  Promise.all(dirsWithSizes)
    .then((dirsToDelete) => {
      const getPathWithSizes = dirsToDelete.map((stats) => {
        return `${stats.size}MB | ${stats.path}`;
      });
      inquirer
        .prompt([
          {
            type: "checkbox",
            message: "Which Folder Do You Want To Delete ?",
            name: "dirToDelete",
            choices: getPathWithSizes,
          },
        ])
        .then((selectedDirToDelete) => {
          if (selectedDirToDelete.dirToDelete.length > 0) {
            askForDeleteConfirmation(selectedDirToDelete.dirToDelete);
          } else {
            askUserToSelectDirectoriesToDelete(dirsToDelete);
          }
        })
        .catch(handleError);
    })
    .catch(handleError);
};

const askUserForDirsTypes = (pathToScan) => {
  inquirer
    .prompt([
      {
        type: "checkbox",
        message: "Which Folder Do You Want TO Scan For ?",
        name: "dirToScan",
        choices: ["node_modules", "vendor"],
      },
    ])
    .then((answers) => {
      const dirTypeToScan = answers.dirToScan;
      if (dirTypeToScan.length > 0) {
        const dirsToDelete = scan.allDirectories(pathToScan, dirTypeToScan);
        if (dirsToDelete.length > 0) {
          askUserToSelectDirectoriesToDelete(dirsToDelete);
        } else {
          console.log("No Directories Found");
        }
      } else {
        askUserForDirsTypes(pathToScan);
      }
    })
    .catch(handleError);
};

const askUserForFilePath = () => {
  inquirer
    .prompt([
      {
        type: "input",
        message: "Please Enter Absolute Path For Folder You Want To Scan",
        name: "dirToScan",
      },
    ])
    .then((answers) => {
      const userSelection = answers.dirToScan;
      if (userSelection) {
        const checkPathToScan = fs.statSync(userSelection);
        if (checkPathToScan.isDirectory()) {
          askUserForDirsTypes(userSelection);
        } else {
          askUserForFilePath();
        }
      } else {
        askUserForFilePath();
      }
    })
    .catch(handleError);
};

exports.init = () => {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Which Folder Do You Want To Scan ?",
        name: "dirToScan",
        choices: [scan.getHomePath(), "CustomPath"],
      },
    ])
    .then((answers) => {
      const userSelection = answers.dirToScan;
      if (userSelection === "CustomPath") {
        askUserForFilePath();
      } else {
        askUserForDirsTypes(userSelection);
      }
    })
    .catch(handleError);
};
