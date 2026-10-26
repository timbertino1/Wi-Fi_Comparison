import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDenylist } from '../../scripts/validate-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const denylist = loadDenylist();

function* jsonFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* jsonFiles(full);
    else if (entry.name.endsWith('.json')) yield full;
  }
}

function findNames(text) {
  return denylist.filter((name) => new RegExp(`(?<![\\w])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w])`, 'i').test(text));
}

test('denylist is loaded', () => {
  assert.ok(denylist.length > 20);
});

test('content files contain no vendor or product names', () => {
  for (const file of jsonFiles(path.join(root, 'content'))) {
    // Reference URLs are excluded: they point at standards bodies and are checked by the source policy.
    const data = JSON.parse(fs.readFileSync(file, 'utf8'), (key, value) => (key === 'url' ? '' : value));
    assert.deepEqual(findNames(JSON.stringify(data)), [], path.relative(root, file));
  }
});

test('built site contains no vendor or product names in visible strings', { skip: !fs.existsSync(path.join(root, 'dist', 'app.js')) }, () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.deepEqual(findNames(html), [], 'dist/index.html');
  // Only quoted string literals in the bundle are user-visible; third-party license comments live in
  // app.js.LEGAL.txt and are not scanned.
  const bundle = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  const literals = (bundle.match(/"(?:[^"\\\n]|\\.){3,}"|'(?:[^'\\\n]|\\.){3,}'|`(?:[^`\\]|\\.){3,}`/g) ?? []).join('\n');
  assert.deepEqual(findNames(literals), [], 'dist/app.js string literals');
});
