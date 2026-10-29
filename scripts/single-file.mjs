// Writes dist/wifi7-explainer.html: the whole site as one file that can be copied to any machine
// and opened by double-clicking. The bundle, styles and fallback stills are inlined, and the
// content security policy allows only those exact inline blocks (by SHA-256 hash), so it stays as
// strict as the multi-file site. Runs after the bundle (and, on full builds, the stills) are built.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const out = path.join(dist, 'wifi7-explainer.html');
const read = (file) => fs.readFileSync(path.join(dist, file), 'utf8');
const hash = (text) => `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;

let html = read('index.html');

// Styles, in the order the page links them.
const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">\n?/g)];
const css = links.map((m) => read(m[1])).join('\n');
if (/<\/style/i.test(css)) throw new Error('A stylesheet contains "</style", which cannot be inlined.');

// Fallback stills (only present after a full build) as data URIs, keyed by their relative path.
const images = {};
const stills = path.join(dist, 'fallback');
if (fs.existsSync(stills)) {
  for (const tab of fs.readdirSync(stills)) {
    for (const file of fs.readdirSync(path.join(stills, tab))) {
      images[`fallback/${tab}/${file}`] = `data:image/jpeg;base64,${fs.readFileSync(path.join(stills, tab, file)).toString('base64')}`;
    }
  }
}

// The bundle, without its source-map and licence-file pointers (neither file travels with it).
const app = read('app.js')
  .replace(/\n?\/\/# sourceMappingURL=.*$/m, '')
  .replace(/\/\*! For license information please see app\.js\.LEGAL\.txt \*\/\n?/, '');
// Escape sequences that would end or confuse the inline script; neither appears outside strings.
const js = `globalThis.__FALLBACK_IMAGES__=${JSON.stringify(images)};\n${app}`.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

const legal = read('app.js.LEGAL.txt').replace(/--/g, '- -').trim();

const replaceOnce = (from, to) => {
  const count = html.split(from).length - 1;
  if (count !== 1) throw new Error(`Expected exactly one ${from} in index.html, found ${count}.`);
  html = html.replace(from, () => to);
};
for (const [i, m] of links.entries()) replaceOnce(m[0], i === 0 ? `<style>${css}</style>\n` : '');
replaceOnce('<script defer src="app.js"></script>', `<script>${js}</script>`);
replaceOnce("script-src 'self'", `script-src ${hash(js)}`);
replaceOnce("style-src 'self'", `style-src ${hash(css)}`);
replaceOnce("img-src 'self' data: blob:", 'img-src data: blob:');
replaceOnce('<!doctype html>\n', `<!doctype html>\n<!--\n${legal}\n-->\n`);

fs.writeFileSync(out, html);
const stillCount = Object.keys(images).length;
console.log(`Single file: dist/wifi7-explainer.html, ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(1)} MB${stillCount ? `, ${stillCount} fallback stills inlined` : ', no fallback stills (run the full build to include them)'}`);
