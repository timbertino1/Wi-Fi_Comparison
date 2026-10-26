import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');

// research.md R12 — keep in sync with docs/hosting-security.md.
export const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; media-src 'none'; frame-src 'none'; worker-src 'none'; manifest-src 'none'; base-uri 'none'; form-action 'none'";

function* sourceFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (entry.name.endsWith('.js')) yield full;
  }
}

test('index.html carries the R12 CSP and no-referrer policy', () => {
  assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`), 'CSP meta tag must match research.md R12 exactly');
  assert.ok(html.includes('<meta name="referrer" content="no-referrer">'));
  const cspIndex = html.indexOf('Content-Security-Policy');
  assert.ok(cspIndex < html.indexOf('<link'), 'CSP must come before any resource');
});

test('index.html has no inline script, event handlers or style attributes', () => {
  // Exactly one script element, and it is the exact external app.js tag (no inline code).
  const scriptCount = html.toLowerCase().split('<script').length - 1;
  assert.equal(scriptCount, 1, 'exactly one script element is allowed');
  assert.ok(html.includes('<script defer src="app.js"></script>'), 'the only script must be <script defer src="app.js"></script>');
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, 'no on*= handlers');
  assert.doesNotMatch(html, /\sstyle\s*=/i, 'no style attributes');
  assert.doesNotMatch(html, /<style/i, 'no inline style blocks');
});

test('source uses no eval-like APIs and only the documented HTML sinks', () => {
  const banned = [/\beval\s*\(/, /new\s+Function\s*\(/, /set(?:Timeout|Interval)\s*\(\s*['"`]/, /document\.write/, /insertAdjacentHTML/, /outerHTML\s*=/];
  for (const file of sourceFiles(path.join(root, 'src'))) {
    const text = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);
    for (const re of banned) assert.doesNotMatch(text, re, `${rel} uses ${re}`);
    for (const [i, line] of text.split('\n').entries()) {
      if (/\binnerHTML\s*=/.test(line) && !line.includes('// safe: renderMarkup')) {
        assert.fail(`${rel}:${i + 1} assigns innerHTML without "// safe: renderMarkup"`);
      }
    }
  }
});

test('dependencies are pinned to exact versions with a lockfile', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
    assert.match(version, /^\d+\.\d+\.\d+$/, `${name}@${version} must be an exact version`);
  }
  assert.ok(fs.existsSync(path.join(root, 'package-lock.json')));
});
