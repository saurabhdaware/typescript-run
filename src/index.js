#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const program = require("commander");
const esbuild = require("esbuild");

// Utils
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

const gray = (str) => `\x1b[90m${str}\x1b[0m`;

// Main
program.version(require("../package.json").version, "-v|--version");

program
  .arguments("<fileName>")
  .option("-w|--watch", "run in watch mode to listen to file changes")
  .action(async (fileName, commanderObj) => {
    const TEMP_DIR = path.join(__dirname, "temp");
    const entryFile = path.join(process.cwd(), fileName);
    const outFile = path.join(TEMP_DIR, fileName.replace(".ts", ".js"));
    const watcher = {
      onRebuild: async (err, result) => {
        if (err) {
          console.error(err);
        } else {
          console.log(gray("[ts-run]: re-running the files"));
          await executeNodeFile(outFile);
        }
        rmdirRecursiveSync(TEMP_DIR);
      },
    };

    // 1. clean earlier temp files, if exist
    rmdirRecursiveSync(TEMP_DIR);

    // 2. Build with esbuild
    await esbuild
      .build({
        entryPoints: [entryFile],
        bundle: true,
        watch: commanderObj.watch ? watcher : false,
        platform: "node",
        outfile: outFile,
      })
      .catch(() => process.exit(1));

    // 3. Run node to run output JS file
    await executeNodeFile(outFile);

    // 4. Remove temporary files
    rmdirRecursiveSync(TEMP_DIR);

    if (commanderObj.watch) {
      console.log(gray("[ts-run]: watching for file changes"));
    }
  });

program.parse(process.argv);
