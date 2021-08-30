#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const program = require("commander");
const esbuild = require("esbuild");
const chokidar = require("chokidar");
const { spawn } = require("child_process");

// configs
const chokidarOptions = {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100,
  },
};

// Utils
const removeFileIfExist = (pathToDelete) => {
  if (fs.existsSync(pathToDelete)) {
    fs.unlinkSync(pathToDelete);
  }
};

async function executeNodeFile(outFile) {
  let parentArgs;
  if (process.argv.includes("-w") || process.argv.includes("--watch")) {
    parentArgs = process.argv.slice(3, process.argv.indexOf("-w"));
  } else {
    parentArgs = process.argv.slice(3);
  }

  return new Promise((resolve, reject) => {
    const child = spawn("node", [outFile, ...parentArgs], {
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

const colors = {
  gray: (str) => `\x1b[90m${str}\x1b[0m`,
};

// Main
program.version(require("../package.json").version, "-v|--version");

const runTypeScript = async (fileName, commanderObj) => {
  const isFullPath = fileName.includes(".ts");
  const entryFile = isFullPath
    ? path.join(process.cwd(), fileName)
    : path.join(process.cwd(), fileName, "index.ts");
  const outFile = path.join(path.dirname(entryFile), ".temp-bundle.ts-run.js");

  const watcher = {
    onRebuild: async (err, result) => {
      if (err) {
        console.error(err);
      } else {
        console.log(colors.gray("[ts-run]: re-running the files"));
        try {
          await executeNodeFile(outFile);
        } catch (err) {
          console.error(err);
        }
      }
      removeFileIfExist(outFile);
    },
  };

  const transpileTypeScript = () => {
    try {
      return esbuild.build({
        entryPoints: [entryFile],
        bundle: true,
        watch: commanderObj.watch === true ? watcher : false,
        platform: "node",
        outfile: outFile,
        incremental: commanderObj.watch ? true : false,
      });
    } catch (err) {
      removeFileIfExist(outFile);
      console.error(err);
      process.exit(1);
    }
  };

  // 1. clean earlier temp files, if exist
  removeFileIfExist(outFile);

  // 2. Build with esbuild
  const esbuildResult = await transpileTypeScript();

  // 3. Watch for changes in base, if -w is passed
  if (typeof commanderObj.watch === "object") {
    for (const watchPath of commanderObj.watch) {
      chokidar
        .watch(path.join(process.cwd(), watchPath), chokidarOptions)
        .on("all", async (event, fileName) => {
          if (
            event === "unlink" &&
            fileName.endsWith(".temp-bundle.ts-run.js")
          ) {
            return;
          }
          await esbuildResult.rebuild(); // incremental rebuild
          watcher.onRebuild(null, { event, fileName });
        });
    }
  }

  try {
    // 4. Run node to execute output JS file
    await executeNodeFile(outFile);

    if (commanderObj.watch === true) {
      console.log(colors.gray("[ts-run]: watching for file changes"));
    } else if (typeof commanderObj.watch === "object") {
      console.log(
        colors.gray(
          `[ts-run]: watching for file changes in ${commanderObj.watch.join(
            ", "
          )}`
        )
      );
    }
  } catch (err) {
    console.error(err);
  } finally {
    // 5. Remove output file
    removeFileIfExist(outFile);
  }
};

program
  .arguments("<fileName>")
  .option(
    "-w|--watch [watcherPath...]",
    "run in watch mode to listen to file changes"
  )
  .action(runTypeScript);

program.parse(process.argv);
