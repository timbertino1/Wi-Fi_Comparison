// Animates numeric properties of scene objects towards targets, e.g.
// animateTo([[mesh, 'scale.y', 1], [mesh.material, 'opacity', 0.5]], { durationMs: 800, animate, signal })
import { tween, easing } from './tween.js';

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => o[k], obj);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((o, k) => o[k], obj);
  target[last] = value;
}

/**
 * @param {Array<[object, string, number]>} targets
 * @returns {Promise<boolean>}
 */
export function animateTo(targets, { durationMs = 900, delayMs = 0, animate = true, signal, ease = easing.easeInOutQuart } = {}) {
  const from = targets.map(([obj, path]) => getPath(obj, path));
  const apply = (t) => {
    targets.forEach(([obj, path, to], i) => setPath(obj, path, from[i] + (to - from[i]) * t));
  };
  if (!animate) {
    apply(1);
    return Promise.resolve(true);
  }
  return tween({ from: 0, to: 1, durationMs, delayMs, ease, signal, onUpdate: apply });
}

/** Deterministic pseudo-random numbers (mulberry32) so end states and snapshots are stable. */
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
