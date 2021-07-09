#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const program = require('commander');
const esbuild = require('esbuild');

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

async function executeCommand(...command) {
  return new Promise((resolve, reject) => {
    const child = spawn(...command);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

// Main
program.arguments('<fileName>').action(async (fileName) => {
  const TEMP_DIR = path.join(__dirname, 'temp')

  // 1. clean earlier temp files, if exist
  rmdirRecursiveSync(TEMP_DIR);

  const entryFile = path.join(process.cwd(), fileName);
  const outFile = path.join(TEMP_DIR, fileName.slice(0, -3) + '.js');

  // 2. Build with esbuild
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    outfile: outFile,
  }).catch(() => process.exit(1))

  // 3. Run node to run output JS file
  await executeCommand('node', [outFile], {
    cwd: process.cwd(),
    stdio: [process.stdin, process.stdout, process.stderr]
  });
  
  // 4. Remove temporary files
  rmdirRecursiveSync(TEMP_DIR);
});


program.parse(process.argv);
