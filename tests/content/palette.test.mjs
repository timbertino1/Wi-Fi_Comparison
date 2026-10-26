import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { palette } from '../../src/stage/palette.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const css = fs.readFileSync(path.join(root, 'src', 'styles', 'tokens.css'), 'utf8');

test('scene palette mirrors the --gen-* tokens in tokens.css', () => {
  const tokens = Object.fromEntries([...css.matchAll(/--gen-(wifi\w+):\s*(#[0-9a-fA-F]{6})/g)].map(([, id, hex]) => [id, hex.toLowerCase()]));
  assert.deepEqual(Object.keys(palette).sort(), Object.keys(tokens).sort());
  for (const [id, hex] of Object.entries(palette)) assert.equal(hex.toLowerCase(), tokens[id], `--gen-${id}`);
});

test('generation colours are defined once (not overridden per theme)', () => {
  const count = (css.match(/--gen-wifi7:/g) ?? []).length;
  assert.equal(count, 1, 'generation colours must stay the same in light and dark themes');
});
