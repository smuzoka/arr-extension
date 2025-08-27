#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const VALID_TYPES = ['minor', 'major'];

function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
}

function bumpVersion(type = 'minor') {
  if (!VALID_TYPES.includes(type)) {
    console.error(`Invalid bump type: ${type}. Valid types: ${VALID_TYPES.join(', ')}`);
    process.exit(1);
  }

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('package.json not found in current directory');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  
  if (!currentVersion) {
    console.error('No version field found in package.json');
    process.exit(1);
  }

  const versionParts = currentVersion.split('.');
  
  if (versionParts.length !== 3) {
    console.error(`Invalid version format: ${currentVersion}. Expected format: YYYYMM.x.0`);
    process.exit(1);
  }

  const [datePart, minor] = versionParts;
  const minorNum = Number(minor);
  
  if (isNaN(minorNum)) {
    console.error(`Invalid version format: ${currentVersion}. Minor must be a number`);
    process.exit(1);
  }

  const currentYearMonth = getCurrentYearMonth();
  let newVersion;
  
  switch (type) {
    case 'major':
      newVersion = `${currentYearMonth}.1.0`;
      break;
    case 'minor':
      if (datePart === currentYearMonth) {
        newVersion = `${datePart}.${minorNum + 1}.0`;
      } else {
        newVersion = `${currentYearMonth}.1.0`;
      }
      break;
  }

  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
  return newVersion;
}

const type = process.argv[2] || 'minor';
bumpVersion(type);