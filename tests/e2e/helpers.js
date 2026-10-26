import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const indexFile = path.join(root, 'dist', 'index.html');

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
  await page.waitForSelector(`[role="tab"][aria-selected="true"]`);
}
