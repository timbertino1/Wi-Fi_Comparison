import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const indexFile = path.join(root, 'dist', 'index.html');

/** Content tabs in story order. */
export function contentTabs() {
  const dir = path.join(root, 'content', 'tabs');
  return fs.readdirSync(dir).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

/** Chapters in the clicker path (everything except the references page), in order. */
export function talkChapters() {
  return contentTabs().filter((t) => t.kind !== 'references' && t.beats.length);
}

/** Every step of the talk in clicker order: { chapter, step (1-based), tab, beat }. */
export function talkPath() {
  return talkChapters().flatMap((tab) => tab.beats.map((beat, i) => ({ chapter: tab.id, step: i + 1, tab, beat })));
}

/** Plain text of inline markup ([[term|text]], {{claim}}, **bold**). */
export function plainMarkup(text) {
  return (text ?? '').replace(/\[\[[^\]|]+\|([^\]]+)\]\]|\[\[([^\]]+)\]\]/g, '$1$2').replace(/\{\{[^}]+\}\}/g, '').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

/** file:// URL of the built site, with an optional hash such as "#/mlo/3". */
export function fileUrl(hash = '') {
  return pathToFileURL(indexFile).href + hash;
}

/**
 * Aborts and records every request that isn't a local file (or an inline data:/blob: URL).
 * Returns a getter for the blocked URLs so tests can assert none happened.
 */
export async function guardOffline(page) {
  const blocked = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (/^(file|data|blob):/.test(url)) return route.continue();
    blocked.push(url);
    return route.abort();
  });
  return () => blocked;
}

/** Whether the browser can create a WebGL context (headless Firefox on Linux CI cannot). */
export function hasWebGL(page) {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  });
}

/** Collects console errors and uncaught page errors. */
export function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(String(err)));
  return () => errors;
}

/** Records Content-Security-Policy violations reported by the page. */
export async function trackCspViolations(page) {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push({ directive: e.violatedDirective, blocked: e.blockedURI, source: e.sourceFile });
    });
  });
  return () => page.evaluate(() => window.__cspViolations ?? []);
}

/** Opens a tab (and optionally a 1-based beat) by URL. */
export async function gotoTab(page, id, beat, query = '') {
  const hash = `#/${id}${beat ? `/${beat}` : ''}${query ? `?${query}` : ''}`;
  await page.goto(fileUrl(hash));
  await page.waitForSelector(`#chapter-list a[aria-current="step"][data-chapter="${id}"]`, { state: 'attached' });
}
