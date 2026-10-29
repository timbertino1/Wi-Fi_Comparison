// Hash routing per contracts/ui-navigation.md: #/<tabId>/<beat>?gen=…&view=…&present&ref=…&claim=…&test
// Works identically from file:// and a static host.

const PERSISTENT = ['view', 'present', 'test']; // carried across tab changes
const listeners = new Set();
let tabIds = [];
let defaultTab = 'overview';
let current = null;
let resolvedHash = null; // the hash the app last acted on, so a duplicate hashchange is ignored
// In-place URL updates are throttled: WebKit throws after 100 replaceState calls in 10 s, which a
// fast clicker walk can exceed. The route itself (current) still changes at once.
const REPLACE_EVERY_MS = 150;
let lastReplace = -Infinity;
let pendingReplace = null;

export function parse(hash) {
  const raw = (hash ?? '').replace(/^#\/?/, '');
  const [pathPart, query = ''] = raw.split('?');
  const [tabId = '', beat = ''] = pathPart.split('/');
  const params = new Map();
  for (const pair of query.split('&').filter(Boolean)) {
    const [k, v = ''] = pair.split('=');
    params.set(decodeURIComponent(k), decodeURIComponent(v));
  }
  const n = Number.parseInt(beat, 10);
  return { tabId: tabId || null, beat: Number.isFinite(n) ? n : null, params };
}

export function serialize({ tabId, beat, params }) {
  let hash = `#/${tabId}`;
  if (beat) hash += `/${beat}`;
  const query = [...params].map(([k, v]) => (v === '' ? encodeURIComponent(k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)).join('&');
  return query ? `${hash}?${query}` : hash;
}

function cancelReplace() {
  clearTimeout(pendingReplace);
  pendingReplace = null;
}

function writeReplace() {
  cancelReplace();
  if (!current) return;
  // The URL changed from outside (a link, Back, a typed address) since we last wrote or read it:
  // that navigation wins, and its hashchange will resolve the new route.
  if (location.hash !== resolvedHash) return;
  lastReplace = performance.now();
  history.replaceState(history.state, '', serialize({ tabId: current.tabId, beat: current.beat, params: current.params }));
  resolvedHash = location.hash;
}

function resolve() {
  cancelReplace();
  resolvedHash = location.hash;
  const parsed = parse(location.hash);
  const notFound = !!parsed.tabId && !tabIds.includes(parsed.tabId);
  const tabId = parsed.tabId && !notFound ? parsed.tabId : defaultTab;
  current = {
    tabId,
    beat: notFound ? null : parsed.beat,
    params: parsed.params,
    notFound,
    requestedTab: parsed.tabId
  };
  for (const fn of listeners) fn(current);
}

export function init({ tabs, fallback = 'overview' }) {
  tabIds = tabs;
  defaultTab = fallback;
  // Keep the address current if the page is closed or reloaded between throttled writes.
  window.addEventListener('pagehide', () => pendingReplace && writeReplace());
  window.addEventListener('hashchange', () => {
    if (location.hash !== resolvedHash) resolve();
  });
  resolve();
}

export function onRoute(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getRoute() {
  return current;
}

export function param(key) {
  return current?.params.get(key) ?? null;
}

export function hasParam(key) {
  return current?.params.has(key) ?? false;
}

/** Navigates to a tab (adds a history entry so Back moves between tabs). */
export function goTab(tabId, beat = null, extra = {}) {
  const params = new Map();
  for (const k of PERSISTENT) if (current?.params.has(k)) params.set(k, current.params.get(k));
  for (const [k, v] of Object.entries(extra)) if (v !== null && v !== undefined) params.set(k, String(v));
  const hash = serialize({ tabId, beat, params });
  cancelReplace(); // superseded by this navigation
  // Assigning the hash adds a history entry (Back moves between chapters); resolving at once keeps
  // rapid clicker presses in order instead of waiting for the asynchronous hashchange event.
  if (location.hash !== hash) location.hash = hash;
  resolve();
}

/** Updates the beat or a parameter in place (no history entry, no route event). */
export function replace({ beat, set = {}, remove = [] } = {}) {
  if (!current) return;
  const params = new Map(current.params);
  for (const [k, v] of Object.entries(set)) params.set(k, String(v));
  for (const k of remove) params.delete(k);
  current = { ...current, beat: beat ?? current.beat, params };
  if (pendingReplace) return; // the scheduled write will use the latest route
  const wait = lastReplace + REPLACE_EVERY_MS - performance.now();
  if (wait <= 0) writeReplace();
  else pendingReplace = setTimeout(writeReplace, wait);
}
