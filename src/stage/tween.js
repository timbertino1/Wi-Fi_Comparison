// Minimal tween engine driven by the stage loop (research R4). Under reduced motion every tween
// resolves immediately at its end value.

export const easing = {
  linear: (t) => t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
  easeOutCubic: (t) => 1 - (1 - t) ** 3,
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  }
};

let motion = 'full';
const active = new Set();
let onStart = () => {};

export function setMotion(value) {
  motion = value === 'reduced' ? 'reduced' : 'full';
}

export function getMotion() {
  return motion;
}

/** Called by the stage so it can wake its render loop when a tween starts. */
export function onTweenStart(fn) {
  onStart = fn;
}

function lerp(from, to, t) {
  if (typeof from === 'number') return from + (to - from) * t;
  const out = {};
  for (const k of Object.keys(to)) out[k] = from[k] + (to[k] - from[k]) * t;
  return out;
}

/**
 * @returns {Promise<boolean>} resolves true when finished, false when cancelled.
 */
export function tween({ from = 0, to = 1, durationMs = 600, delayMs = 0, ease = easing.easeInOutCubic, onUpdate = () => {}, signal } = {}) {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve(false);
    if (motion === 'reduced' || durationMs <= 0) {
      onUpdate(lerp(from, to, 1), 1);
      return resolve(true);
    }
    const entry = { elapsed: -delayMs, from, to, durationMs, ease, onUpdate, resolve };
    signal?.addEventListener('abort', () => {
      if (active.delete(entry)) resolve(false);
    }, { once: true });
    active.add(entry);
    onStart();
  });
}

/** Advances all tweens by `dtMs`. */
export function tickTweens(dtMs) {
  for (const entry of [...active]) {
    entry.elapsed += dtMs;
    if (entry.elapsed < 0) continue;
    const t = Math.min(1, entry.elapsed / entry.durationMs);
    entry.onUpdate(lerp(entry.from, entry.to, entry.ease(t)), t);
    if (t >= 1) {
      active.delete(entry);
      entry.resolve(true);
    }
  }
}

export function hasActiveTweens() {
  return active.size > 0;
}

/** Waits `ms` (respecting reduced motion and cancellation). */
export function wait(ms, signal) {
  return tween({ from: 0, to: 1, durationMs: ms, ease: easing.linear, signal });
}

export function cancelAllTweens() {
  for (const entry of active) entry.resolve(false);
  active.clear();
}
