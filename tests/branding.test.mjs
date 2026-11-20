import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.json', '.html', '.css', '.md', '.webmanifest', '.toml', '.yml', '.yaml']);

async function textFiles(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name === '.git') continue;
    const target = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await textFiles(target));
    else if (TEXT_EXTENSIONS.has(extname(entry.name)) || entry.name === 'README.md') files.push(target);
  }
  return files;
}

test('public brand naming consistently uses Platform Falak Indonesia', async () => {
  const files = await textFiles('.');
  const oldBrand = /Pusat\s+Fal(?:ak|aq)\s+Indonesia/i;
  const offenders = [];
  for (const file of files) {
    if (oldBrand.test(await readFile(file, 'utf8'))) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
  assert.match(await readFile('index.html', 'utf8'), /Platform Falak Indonesia/);
  assert.match(await readFile('public/manifest.webmanifest', 'utf8'), /Platform Falak Indonesia/);
});
