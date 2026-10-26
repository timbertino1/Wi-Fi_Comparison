import * as THREE from 'three';

/** Maps frequency (MHz) to scene x using a linear scale. */
export function frequencyScale({ fromMHz, toMHz, width }) {
  const k = width / (toMHz - fromMHz);
  return { x: (mhz) => (mhz - fromMHz) * k - width / 2, size: (mhz) => mhz * k };
}

/** A flat strip representing a band between two frequencies. */
export function band({ startMHz, endMHz, scale, color = '#7a8494', depth = 1.2, opacity = 0.35 }) {
  const width = scale.size(endMHz - startMHz);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.04, depth),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.8 })
  );
  mesh.position.x = scale.x(startMHz) + width / 2;
  return mesh;
}

/** A raised block for one channel. Height can encode utilization. */
export function channelBlock({ startMHz, widthMHz, scale, color = '#0f9a8a', height = 0.5, depth = 0.9, gap = 0.04 }) {
  const width = Math.max(0.02, scale.size(widthMHz) - gap);
  const geometry = new THREE.BoxGeometry(width, 1, depth);
  geometry.translate(0, 0.5, 0);
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.5, transparent: true, opacity: 0.95 }));
  mesh.position.x = scale.x(startMHz) + scale.size(widthMHz) / 2;
  mesh.scale.y = height;
  return mesh;
}

/** A frequency axis line with tick marks; returns tick anchor objects for labels. */
export function frequencyAxis({ scale, ticksMHz, color = '#7a8494', z = 0.9 }) {
  const group = new THREE.Group();
  const xs = ticksMHz.map((f) => scale.x(f));
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(Math.min(...xs), 0, z), new THREE.Vector3(Math.max(...xs), 0, z)]),
    new THREE.LineBasicMaterial({ color })
  );
  group.add(line);
  const anchors = ticksMHz.map((f) => {
    const tick = new THREE.Object3D();
    tick.position.set(scale.x(f), 0, z + 0.25);
    group.add(tick);
    return tick;
  });
  return { group, anchors };
}
