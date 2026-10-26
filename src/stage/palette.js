// Generation colours for 3D scenes. Source of truth: the --gen-* tokens in src/styles/tokens.css
// (tests/content/palette.test.mjs fails if these drift).
import * as THREE from 'three';

export const palette = {
  wifi4: '#7a8494',
  wifi5: '#5b7bd5',
  wifi6: '#c27c0e',
  wifi6e: '#c27c0e',
  wifi7: '#0f9a8a',
  wifi8: '#9a6ad6'
};

export const neutral = {
  light: { floor: '#dfe6ef', wall: '#c8d2df', device: '#5b6779', accent: '#142033', grid: '#b6c2d2' },
  dark: { floor: '#16223a', wall: '#22314f', device: '#8796ad', accent: '#e8eef7', grid: '#2b3a55' }
};

export function colorFor(genId) {
  return new THREE.Color(palette[genId] ?? palette.wifi7);
}

export function materialFor(genId, options = {}) {
  return new THREE.MeshStandardMaterial({ color: colorFor(genId), roughness: 0.55, metalness: 0.05, ...options });
}

export function lineMaterialFor(genId, options = {}) {
  return new THREE.LineBasicMaterial({ color: colorFor(genId), ...options });
}
