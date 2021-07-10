const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

function createPathIfAbsent(pathToCreate) {
  pathToCreate.split(path.sep).reduce((prevPath, folder) => {
    const currentPath = path.join(prevPath, folder, path.sep);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
    return currentPath;
  }, "");
}

function copyFolderSync(from, to, ignore = [], ignoreEmptyDirs = true) {
  if (ignore.includes(from)) {
    return;
  }
  const fromDirectories = fs.readdirSync(from);

  createPathIfAbsent(to);
  fromDirectories.forEach((element) => {
    const fromElement = path.join(from, element);
    const toElement = path.join(to, element);
    if (fs.lstatSync(fromElement).isFile()) {
      if (!ignore.includes(fromElement)) {
        fs.copyFileSync(fromElement, toElement);
      }
    } else {
      copyFolderSync(fromElement, toElement, ignore);
      if (fs.existsSync(toElement) && ignoreEmptyDirs) {
        try {
          fs.rmdirSync(toElement);
        } catch (err) {
          if (err.code !== "ENOTEMPTY") throw err;
        }
      }
    }
  });
}

function rmdirRecursiveSync(pathToRemove) {
  if (fs.existsSync(pathToRemove)) {
    fs.readdirSync(pathToRemove).forEach((file, index) => {
      const curPath = path.join(pathToRemove, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        rmdirRecursiveSync(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(pathToRemove);
  }
}

async function executeNodeFile(outFile) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [outFile], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

/**
 *
 * @param {String} base directory to search in
 * @param {String} ext Extension you want to search for (e.g. '.abell')
 * @param {String[]} inputFiles Array of directories
 * @param {String[]} inputResult Holds the old input result
 * @return {String[]} Array of filepaths that end with given extension
 */
function recursiveFindFiles(
  base,
  ext,
  inputFiles = undefined,
  inputResult = undefined
) {
  const files = inputFiles || fs.readdirSync(base);
  let result = inputResult || [];

  for (const file of files) {
    const newbase = path.join(base, file);
    if (fs.statSync(newbase).isDirectory()) {
      result = recursiveFindFiles(
        newbase,
        ext,
        fs.readdirSync(newbase),
        result
      );
    } else {
      if (file.endsWith(ext)) {
        result.push(newbase);
      }
    }
  }

  return result;
}

const colors = {
  gray: (str) => `\x1b[90m${str}\x1b[0m`,
};

module.exports = {
  colors,
  executeNodeFile,
  rmdirRecursiveSync,
  copyFolderSync,
  recursiveFindFiles,
};
