import * as THREE from 'three';

/**
 * A horizontal time axis with one row per device. Segments show awake (raised) or asleep (flat)
 * periods; service periods are translucent blocks spanning rows.
 */
export function timeline({ length = 10, rows = 3, rowGap = 1, color = '#7a8494' } = {}) {
  const group = new THREE.Group();
  const x0 = -length / 2;
  const rowZ = (row) => (row - (rows - 1) / 2) * rowGap;

  for (let r = 0; r < rows; r++) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0, 0, rowZ(r)), new THREE.Vector3(-x0, 0, rowZ(r))]),
      new THREE.LineBasicMaterial({ color })
    );
    group.add(line);
  }

  return {
    group,
    rowZ,
    xAt: (t) => x0 + t * length,
    /** Adds an awake/asleep segment covering fraction [start, end] of the timeline. */
    segment({ row, start, end, color: segColor = '#0f9a8a', awake = true }) {
      const w = Math.max(0.02, (end - start) * length);
      const h = awake ? 0.5 : 0.08;
      const geometry = new THREE.BoxGeometry(w, h, 0.35);
      geometry.translate(0, h / 2, 0);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: segColor, transparent: true, opacity: awake ? 0.95 : 0.45 }));
      mesh.position.set(x0 + start * length + w / 2, 0, rowZ(row));
      group.add(mesh);
      return mesh;
    },
    /** Adds a translucent service-period block spanning all rows. */
    servicePeriod({ start, end, color: spColor = '#0f9a8a', opacity = 0.18 }) {
      const w = (end - start) * length;
      const geometry = new THREE.BoxGeometry(w, 0.9, rows * rowGap);
      geometry.translate(0, 0.45, 0);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: spColor, transparent: true, opacity, depthWrite: false }));
      mesh.position.set(x0 + start * length + w / 2, 0, 0);
      group.add(mesh);
      return mesh;
    },
    /** A vertical marker at fraction t (e.g., an alarm event). */
    marker({ t, row = null, color: mColor = '#c0392b', height = 1.2 }) {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, height, 8), new THREE.MeshBasicMaterial({ color: mColor }));
      mesh.position.set(x0 + t * length, height / 2, row === null ? 0 : rowZ(row));
      group.add(mesh);
      return mesh;
    }
  };
}
