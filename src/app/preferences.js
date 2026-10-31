// Viewer preferences: theme and motion. Stored under one localStorage key; nothing
// else is ever stored (FR-041). Every storage access tolerates storage being unavailable.

const KEY = 'wifi7-explainer:prefs';
const ALLOWED = {
  theme: ['system', 'light', 'dark'],
  motion: ['system', 'full', 'reduced']
};
const DEFAULTS = { theme: 'system', motion: 'system' };

let state = { ...DEFAULTS };
const listeners = new Set();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    for (const [k, allowed] of Object.entries(ALLOWED)) if (allowed.includes(raw?.[k])) state[k] = raw[k];
  } catch {
    // Storage unavailable or corrupt: keep defaults.
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: preferences last for this page view only.
  }
}

load();

export function get(key) {
  return state[key];
}

export function set(key, value) {
  if (!ALLOWED[key]?.includes(value) || state[key] === value) return;
  state = { ...state, [key]: value };
  save();
  for (const fn of listeners) fn(key, value);
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const reducedQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** Effective motion after resolving "system". */
export function effectiveMotion() {
  if (state.motion !== 'system') return state.motion;
  return reducedQuery?.matches ? 'reduced' : 'full';
}

export function onSystemMotionChange(fn) {
  reducedQuery?.addEventListener('change', fn);
}

export function applyTheme() {
  const theme = state.theme;
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
}

/** Whether the effective theme is dark (for scene colours). */
export function isDark() {
  if (state.theme !== 'system') return state.theme === 'dark';
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
}
