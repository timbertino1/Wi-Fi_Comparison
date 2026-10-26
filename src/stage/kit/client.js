import * as THREE from 'three';

// Generic, unbranded device silhouettes built from simple boxes: [width, height, depth, yOffset].
const SHAPES = {
  'voice-badge': [[0.28, 0.42, 0.06, 0.21]],
  phone: [[0.3, 0.6, 0.05, 0.3]],
  tablet: [[0.7, 0.5, 0.05, 0.25]],
  laptop: [[0.9, 0.04, 0.6, 0.02], [0.9, 0.56, 0.03, 0.3]],
  'infusion-pump': [[0.12, 1.4, 0.12, 0.7], [0.5, 0.42, 0.24, 1.0]],
  'telemetry-monitor': [[0.8, 0.55, 0.12, 0.6], [0.12, 0.33, 0.12, 0.16]],
  'rtls-tag': [[0.22, 0.22, 0.08, 0.11]],
  'workstation-cart': [[0.7, 0.06, 0.5, 0.9], [0.08, 0.9, 0.08, 0.45], [0.6, 0.42, 0.04, 1.2]],
  'imaging-cart': [[0.8, 0.9, 0.6, 0.45], [0.7, 0.45, 0.05, 1.15]],
  'telehealth-cart': [[0.6, 0.06, 0.5, 0.85], [0.08, 1.2, 0.08, 0.6], [0.75, 0.48, 0.04, 1.35]]
};

export const clientTypes = Object.keys(SHAPES);

function shapeGeometry(type) {
  if (type === 'dot') return new THREE.SphereGeometry(0.13, 8, 6).translate(0, 0.13, 0);
  const parts = (SHAPES[type] ?? SHAPES.phone).map(([w, h, d, y]) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, y, 0);
    return g;
  });
  if (parts.length === 1) return parts[0];
  // Merge parts into one geometry (keeps draw calls low).
  const positions = [];
  const normals = [];
  const indices = [];
  let offset = 0;
  for (const g of parts) {
    positions.push(...g.attributes.position.array);
    normals.push(...g.attributes.normal.array);
    indices.push(...Array.from(g.index.array, (i) => i + offset));
    offset += g.attributes.position.count;
    g.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setIndex(indices);
  return merged;
}

/** A single client device mesh. */
export function client(type, { color = '#8796ad' } = {}) {
  return new THREE.Mesh(shapeGeometry(type), new THREE.MeshStandardMaterial({ color, roughness: 0.6 }));
}

/**
 * Many identical clients in one draw call. Set per-instance colour with
 * `mesh.setColorAt(i, color)` and positions with `mesh.setMatrixAt(i, matrix)`.
 */
export function clientCrowd(type, count, { color = '#8796ad' } = {}) {
  const mesh = new THREE.InstancedMesh(shapeGeometry(type), new THREE.MeshLambertMaterial({ color: '#ffffff' }), count);
  const c = new THREE.Color(color);
  for (let i = 0; i < count; i++) mesh.setColorAt(i, c);
  return mesh;
}
