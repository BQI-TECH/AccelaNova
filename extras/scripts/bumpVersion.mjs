import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

function bump(version) {
  const [major, minor, patch] = String(version || '0.0.0').split('.').map(Number);
  return [major, minor, (patch || 0) + 1].join('.');
}

function update(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  const next = bump(json.version);
  json.version = next;
  writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
  console.log(`Bumped ${filePath} -> ${next}`);
}

const root = process.cwd();
const files = [
  path.join(root, 'package.json'),
  path.join(root, 'server', 'package.json'),
  path.join(root, 'collector', 'package.json'),
  path.join(root, 'frontend', 'package.json'),
];

for (const f of files) {
  try {
    update(f);
  } catch (e) {
    console.warn(`Skipped ${f}: ${e.message}`);
  }
}






























