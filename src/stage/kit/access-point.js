import * as THREE from 'three';

/**
 * A generic ceiling-mount access point with optional radiating rings, one per band.
 * @returns {{ group: THREE.Group, rings: THREE.Mesh[], led: THREE.Mesh }}
 */
export function accessPoint({ color = '#e8eef7', ledColor = '#0f9a8a', rings = [] } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.7, 0.16, 40),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 })
  );
  group.add(body);
  const led = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16),
    new THREE.MeshBasicMaterial({ color: ledColor })
  );
  led.position.y = 0.09;
  group.add(led);

  const ringMeshes = rings.map(({ color: ringColor, radius = 1.2 }, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius + i * 0.45, 0.025, 8, 96),
      new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    return ring;
  });

  return { group, rings: ringMeshes, led };
}
