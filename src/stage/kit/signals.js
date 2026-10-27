import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** A small frame/packet travelling between devices: a rounded, softly lit capsule-like block. */
export function packet({ color = '#0f9a8a', size = 0.18 } = {}) {
  return new THREE.Mesh(
    new RoundedBoxGeometry(size * 1.6, size, size, 1, size * 0.4),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, roughness: 0.3 })
  );
}

/**
 * An arched link between two points.
 * @returns {{ mesh: THREE.Mesh, curve: THREE.QuadraticBezierCurve3 }}
 */
export function linkBeam(from, to, { color = '#0f9a8a', radius = 0.045, arch = 1.2, bend = 0, opacity = 0.9 } = {}) {
  const a = from.clone();
  const b = to.clone();
  const mid = a.clone().lerp(b, 0.5);
  mid.y += arch;
  mid.z += bend;
  const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 48, radius, 8, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
  );
  return { mesh, curve };
}

/**
 * A square QAM constellation of `order` points (64, 256, 1024, 4096) as one instanced mesh.
 * @returns {{ mesh: THREE.InstancedMesh, side: number }}
 */
export function constellation(order, { color = '#0f9a8a', extent = 4, pointSize } = {}) {
  const side = Math.round(Math.sqrt(order));
  const step = extent / (side - 1);
  const size = pointSize ?? Math.min(0.12, step * 0.55);
  // Round symbols read as constellation points; dense constellations get fewer facets per point.
  const mesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(size * 0.62, 0),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, roughness: 0.35 }),
    side * side
  );
  const m = new THREE.Matrix4();
  let i = 0;
  for (let r = 0; r < side; r++) {
    for (let c = 0; c < side; c++) {
      m.makeTranslation(-extent / 2 + c * step, 0, -extent / 2 + r * step);
      mesh.setMatrixAt(i++, m);
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
  return { mesh, side, step };
}
