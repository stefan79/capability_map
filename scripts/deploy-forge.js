#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
} = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const forgeDir = path.join(rootDir, 'forge');
const distDir = path.join(rootDir, 'dist');
const forgeStaticDir = path.join(forgeDir, 'static');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const args = process.argv.slice(2);
let environment = process.env.FORGE_ENVIRONMENT || 'production';

const envFlagIndex = args.findIndex((arg) => arg === '--environment');
if (envFlagIndex !== -1 && args[envFlagIndex + 1]) {
  environment = args[envFlagIndex + 1];
} else {
  const inlineEnv = args.find((arg) => arg.startsWith('--environment='));
  if (inlineEnv) {
    environment = inlineEnv.split('=')[1];
  }
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    cwd: options.cwd || rootDir,
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Command "${command} ${commandArgs.join(' ')}" failed.`);
  }
}

function copyDirRecursive(source, destination) {
  readdirSync(source, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(destinationPath, { recursive: true });
      copyDirRecursive(sourcePath, destinationPath);
      return;
    }

    if (entry.isSymbolicLink()) {
      const link = readlinkSync(sourcePath);
      symlinkSync(link, destinationPath);
      return;
    }

    if (entry.isFile()) {
      copyFileSync(sourcePath, destinationPath);
    }
  });
}

function ensureDirectories() {
  try {
    const stats = statSync(forgeDir);
    if (!stats.isDirectory()) {
      throw new Error('Expected "forge" to be a directory.');
    }
  } catch (error) {
    throw new Error(
      'Forge directory not found. Ensure forge/manifest.yml exists before deploying.'
    );
  }
}

function main() {
  ensureDirectories();
  console.log('Building Parcel bundle...');
  run(npmCmd, ['run', 'build']);

  try {
    const stats = statSync(distDir);
    if (!stats.isDirectory()) {
      throw new Error();
    }
  } catch {
    throw new Error('dist/ was not generated. Check the build output for errors.');
  }

  console.log('Syncing dist/ into forge/static/ ...');
  rmSync(forgeStaticDir, { recursive: true, force: true });
  mkdirSync(forgeStaticDir, { recursive: true });
  copyDirRecursive(distDir, forgeStaticDir);

  console.log(`Deploying to Forge environment "${environment}"...`);
  run(npxCmd, ['forge', 'deploy', '--environment', environment], { cwd: forgeDir });

  console.log('Forge deployment completed.');
}

main();
