#!/usr/bin/env node

const path = require("path");

const program = require("commander");
const esbuild = require("esbuild");
const {
  colors,
  executeNodeFile,
  rmdirRecursiveSync,
  copyFolderSync,
  recursiveFindFiles,
} = require("./utils.js");

// Main
program.version(require("../package.json").version, "-v|--version");

const runTypeScript = async (fileName, commanderObj) => {
  const TEMP_DIR = path.join(__dirname, "temp");
  const isFullPath = fileName.includes(".ts");
  const entryFile = isFullPath
    ? path.join(process.cwd(), fileName)
    : path.join(process.cwd(), fileName, "index.ts");
  const outFile = isFullPath
    ? path.join(TEMP_DIR, fileName.replace(".ts", ".js"))
    : path.join(TEMP_DIR, fileName, "index.js");
  const basePath = commanderObj.base ?? path.dirname(entryFile);
  const outBasePath = commanderObj.base
    ? path.join(TEMP_DIR, basePath)
    : path.dirname(outFile);

  const watcher = {
    onRebuild: async (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log(colors.gray("[ts-run]: re-running the files"));
        copyFolderSync(
          basePath,
          outBasePath,
          recursiveFindFiles(basePath, ".ts")
        );
        try {
          await executeNodeFile(outFile);
        } catch (err) {
          console.error(err);
        }
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
    .catch((err) => {
      rmdirRecursiveSync(TEMP_DIR);
      console.error(err);
      process.exit(1);
    });

  try {
    copyFolderSync(basePath, outBasePath, recursiveFindFiles(basePath, ".ts"));

    // 3. Run node to run output JS file
    await executeNodeFile(outFile);

    if (commanderObj.watch) {
      console.log(colors.gray("[ts-run]: watching for file changes"));
    }
  } catch (err) {
    console.error(err);
  } finally {
    // 4. Remove temporary files
    rmdirRecursiveSync(TEMP_DIR);
  }
};

program
  .arguments("<fileName>")
  .option("-b|--base <basePath>")
  .option("-w|--watch", "run in watch mode to listen to file changes")
  .action(runTypeScript);

program.parse(process.argv);
