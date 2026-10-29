import * as THREE from 'three';

// Highway pieces shared by the spectrum and channel-efficiency chapters: a road runs along x,
// lanes are stacked across z, vehicles travel along their lane and wrap at the road's end.

const dividerGeometry = new THREE.BoxGeometry(1, 0.06, 0.018);
const vehicleGeometry = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

/**
 * Lane markings across a road. `top` is the z of the first lane's outer edge; lanes run towards -z.
 * Returns { mesh, lanes, laneWidth, top, laneZ(i) } where laneZ gives the centre of lane i.
 */
export function laneDividers({ lanes, laneWidth, top, x0, length, color = '#ffffff', opacity = 0.85 }) {
  const mesh = new THREE.InstancedMesh(dividerGeometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity }), Math.max(1, lanes - 1));
  const m = new THREE.Matrix4();
  for (let i = 1; i < lanes; i++) {
    m.compose(new THREE.Vector3(x0 + length / 2, 0.04, top - i * laneWidth), new THREE.Quaternion(), new THREE.Vector3(length, 1, 1));
    mesh.setMatrixAt(i - 1, m);
  }
  mesh.count = lanes - 1;
  return { mesh, lanes, laneWidth, top, laneZ: (i) => top - (i + 0.5) * laneWidth };
}

/**
 * Vehicles in one draw call. `laneOf(i)` returns the z of vehicle i's lane. Each car has its own
 * height `h` and length `l` (starting at `height` and `length`). `jam` (0–1) spreads speeds so
 * traffic bunches. Call `advance(dt)` each frame and `place()` after changing sizes.
 */
export function fleet({ count, color, length, height, width, x0, xLen, speed, rand, laneOf, jam = 0 }) {
  const mesh = new THREE.InstancedMesh(vehicleGeometry, new THREE.MeshStandardMaterial({ color, roughness: 0.55 }), count);
  const cars = Array.from({ length: count }, (_, i) => ({
    x: rand() * xLen,
    z: laneOf(i),
    v: speed * (0.85 + rand() * 0.3) * (1 - jam * rand()),
    h: height,
    l: length
  }));
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const size = new THREE.Vector3();
  const f = {
    mesh,
    cars,
    x0,
    xLen,
    place() {
      cars.forEach((c, i) => {
        pos.set(x0 + c.x, 0.03, c.z);
        size.set(c.l, c.h, width);
        m4.compose(pos, q, size);
        mesh.setMatrixAt(i, m4);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    advance(dt) {
      for (const c of cars) {
        c.x += c.v * dt;
        if (c.x > xLen) c.x -= xLen;
      }
      f.place();
    }
  };
  f.place();
  return f;
}
