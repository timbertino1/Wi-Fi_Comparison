import * as THREE from 'three';
import { glow } from './glow.js';

// Half-profile of a slim ceiling puck with a domed face and a soft bevelled rim, revolved by LatheGeometry.
const PROFILE = [
  [0, -0.08], [0.6, -0.08], [0.68, -0.06], [0.7, -0.02], [0.69, 0.03], [0.64, 0.07], [0.45, 0.095], [0, 0.11]
].map(([x, y]) => new THREE.Vector2(x, y));

/**
 * A generic ceiling-mount access point with optional radiating rings, one per band.
 * @returns {{ group: THREE.Group, rings: THREE.Mesh[], led: THREE.Mesh }}
 */
export function accessPoint({ color = '#e8eef7', ledColor = '#0f9a8a', rings = [] } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(PROFILE, 32),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0 })
  );
  group.add(body);
  const led = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.02, 24),
    new THREE.MeshBasicMaterial({ color: ledColor })
  );
  led.position.y = 0.11;
  group.add(led);
  const halo = glow({ color: ledColor, size: 0.55, opacity: 0.8 });
  halo.position.y = 0.13;
  group.add(halo);

  const ringMeshes = rings.map(({ color: ringColor, radius = 1.2 }, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius + i * 0.45, 0.025, 12, 128),
      new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    return ring;
  });

  return { group, rings: ringMeshes, led };
}
