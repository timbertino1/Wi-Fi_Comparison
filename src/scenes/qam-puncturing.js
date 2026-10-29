// More from every channel, told on the highway of the spectrum chapter: one wide channel is a road of
// 20 MHz lanes leaving the access point. Interference blocks one lane. Older Wi-Fi falls back to the
// lanes before it; Wi-Fi 7 closes only that lane and lets one device use lanes on both sides of it
// (puncturing with multiple resource units). Near the access point each trip carries a fuller load
// (4K-QAM). The peak-rate gain comes from a claim; the rest of the picture is illustrative.
const LANES = 8; // 20 MHz lanes across a 160 MHz channel
const BUSY = 2; // the lane with interference
const FALLBACK = 2; // lanes older Wi-Fi keeps: the narrower channel before the busy lane
const LANE_W = 0.55;
const ROAD_LENGTH = 14;
const ROAD_X0 = -6.5;
const NEAR = 4.2; // how far from the access point a trip carries a fuller load
const INTERFERENCE = '#c0392b';

export default {
  id: 'qam-puncturing',
  states: ['blocked-legacy', 'punctured', 'fuller-loads', 'side-by-side', 'imaging-suite'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, seeded, claim } = ctx;
    const rand = seeded(23);
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    const gain = claim('qam-4k-gain').value;
    const motionFull = ctx.motion === 'full';
    let compareGen = 'wifi6';
    let mode = 'blocked-legacy';

    const { group: hubAp } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    hubAp.position.set(ROAD_X0 - 1.2, 0.6, 0);
    scene.add(hubAp);

    // A road of LANES lanes centred on z; `legacy` roads only ever carry older-Wi-Fi traffic.
    function road({ legacy }) {
      const group = new THREE.Group();
      scene.add(group);
      const width = LANES * LANE_W;
      const top = width / 2;
      const surface = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_LENGTH, 0.05, width),
        new THREE.MeshStandardMaterial({ color: palette.wifi7, transparent: true, opacity: 0.45, roughness: 0.9 })
      );
      surface.position.set(ROAD_X0 + ROAD_LENGTH / 2, 0, 0);
      group.add(surface);
      const lanes = kit.laneDividers({ lanes: LANES, laneWidth: LANE_W, top, x0: ROAD_X0, length: ROAD_LENGTH });
      group.add(lanes.mesh);

      // Interference: one lane taken by a neighbouring network, with barriers along it.
      const busyZ = lanes.laneZ(BUSY);
      const busy = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LENGTH, 0.07, LANE_W * 0.96), new THREE.MeshStandardMaterial({ color: INTERFERENCE, transparent: true, opacity: 0.55 }));
      busy.position.set(ROAD_X0 + ROAD_LENGTH / 2, 0.02, busyZ);
      group.add(busy);
      const barriers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.42, LANE_W * 0.7).translate(0, 0.21, 0), new THREE.MeshStandardMaterial({ color: INTERFERENCE }), 7);
      const m = new THREE.Matrix4();
      for (let i = 0; i < 7; i++) {
        m.makeTranslation(ROAD_X0 + 0.9 + i * 2, 0.03, busyZ);
        barriers.setMatrixAt(i, m);
      }
      group.add(barriers);
      const busyAnchor = new THREE.Object3D();
      busyAnchor.position.set(ROAD_X0 + ROAD_LENGTH * 0.62, 0.6, busyZ);
      group.add(busyAnchor);

      // Older Wi-Fi: everything from the busy lane on is unusable; traffic squeezes into the rest.
      const closed = new THREE.Mesh(new THREE.BoxGeometry(ROAD_LENGTH, 0.08, (LANES - FALLBACK) * LANE_W), new THREE.MeshStandardMaterial({ color: neutral.device, transparent: true, opacity: 0.6 }));
      closed.position.set(ROAD_X0 + ROAD_LENGTH / 2, 0.03, top - FALLBACK * LANE_W - ((LANES - FALLBACK) * LANE_W) / 2);
      group.add(closed);
      const old = kit.fleet({
        count: 26, color: palette[compareGen], length: 0.5, height: 0.2, width: LANE_W * 0.7,
        x0: ROAD_X0, xLen: ROAD_LENGTH, speed: 0.4, rand, jam: 0.6, laneOf: (i) => lanes.laneZ(i % FALLBACK)
      });
      group.add(old.mesh);

      // Wi-Fi 7: every lane but the busy one carries traffic.
      const open = Array.from({ length: LANES }, (_, i) => i).filter((i) => i !== BUSY);
      const w7 = legacy ? null : kit.fleet({
        count: 30, color: palette.wifi7, length: 0.55, height: 0.24, width: LANE_W * 0.7,
        x0: ROAD_X0, xLen: ROAD_LENGTH, speed: 1.2, rand, laneOf: (i) => lanes.laneZ(open[i % open.length])
      });
      if (w7) group.add(w7.mesh);
      // One device's traffic on the lanes either side of the busy one, moving as one convoy.
      const convoy = legacy ? null : kit.fleet({
        count: 6, color: '#29d3be', length: 0.62, height: 0.3, width: LANE_W * 0.74,
        x0: ROAD_X0, xLen: ROAD_LENGTH, speed: 1.2, rand, laneOf: (i) => lanes.laneZ(i % 2 ? BUSY + 1 : BUSY - 1)
      });
      if (convoy) {
        // Pair the convoy up across the busy lane so it reads as one device.
        convoy.cars.forEach((c, i) => {
          c.x = Math.floor(i / 2) * 1.4;
          c.v = 1.2;
        });
        convoy.place();
        group.add(convoy.mesh);
      }
      const convoyAnchor = new THREE.Object3D();
      group.add(convoyAnchor);
      // Where the road's own label sits: along its far edge, clear of the controls below.
      const roadLabel = new THREE.Object3D();
      roadLabel.position.set(ROAD_X0 + ROAD_LENGTH * 0.5, 0.3, -top - 0.45);
      group.add(roadLabel);
      // Side by side, both roads are labelled in the gap between them (far edge of the front road,
      // near edge of the back one), offset along the road so the two labels do not meet.
      const nearLabel = new THREE.Object3D();
      nearLabel.position.set(ROAD_X0 + ROAD_LENGTH * 0.28, 0.3, top + 0.45);
      group.add(nearLabel);
      return { group, lanes, busy, barriers, busyAnchor, closed, old, w7, convoy, convoyAnchor, roadLabel, nearLabel };
    }

    const main = road({ legacy: false });
    const cmp = road({ legacy: true });
    cmp.group.visible = false;
    cmp.roadLabel.position.x = ROAD_X0 + ROAD_LENGTH * 0.72;

    // Fuller loads near the access point: the strong-signal stretch of road, marked on the surface.
    const nearZone = new THREE.Mesh(new THREE.BoxGeometry(NEAR, 0.06, LANES * LANE_W), new THREE.MeshStandardMaterial({ color: '#29d3be', transparent: true, opacity: 0 }));
    nearZone.position.set(ROAD_X0 + NEAR / 2, 0.01, 0);
    main.group.add(nearZone);
    const nearAnchor = new THREE.Object3D();
    nearAnchor.position.set(ROAD_X0 + NEAR / 2, 0.7, -LANES * LANE_W / 2 - 0.4);
    main.group.add(nearAnchor);

    // The imaging workstation beside the access point (last step).
    const imaging = kit.client('imaging-cart', { color: neutral.device });
    imaging.scale.setScalar(0.9);
    imaging.position.set(ROAD_X0 - 0.4, 0, LANES * LANE_W / 2 + 0.9);
    imaging.visible = false;
    scene.add(imaging);

    // Labels (shown per state).
    const label = (object, text, className = 'muted') => {
      const l = labels.add(object, text, { className });
      l.element.style.opacity = '0';
      return l;
    };
    const lInterference = label(main.busyAnchor, 'Neighbouring network');
    const lLegacy = label(main.roadLabel, '', 'big');
    const lPunctured = label(main.roadLabel, 'Wi-Fi 7: only the busy lane closes', 'big');
    const lW7Compare = label(main.nearLabel, 'Wi-Fi 7: only the busy lane closes', 'big');
    const lConvoy = label(main.convoyAnchor, 'One device, lanes on both sides');
    const lNear = label(nearAnchor, `Near the access point: ${gain}% more per trip`, 'big');
    const lCmp = label(cmp.roadLabel, '', 'big');
    const lImaging = label(imaging, 'Imaging workstation');
    lImaging.position.set(0, 1.6, 0);
    const legacyText = () => `${genName(compareGen)}: falls back to a narrower channel`;
    labels.setText(lLegacy, legacyText());
    labels.setText(lCmp, legacyText());

    function recolor() {
      for (const r of [main, cmp]) r.old.mesh.material.color.set(palette[compareGen]);
      labels.setText(lLegacy, legacyText());
      labels.setText(lCmp, legacyText());
    }

    const cameras = {
      'blocked-legacy': { pos: [0, 8.6, 9.2], look: [0, 0, 0] },
      punctured: { pos: [0, 8.6, 9.2], look: [0, 0, 0] },
      'fuller-loads': { pos: [-1, 8, 8.6], look: [-1, 0, 0] },
      'side-by-side': { pos: [0, 14.5, 12.5], look: [0, 0, 0.4] },
      'imaging-suite': { pos: [-4.6, 5.2, 7.2], look: [-4.2, 0, 0.6] }
    };
    const anchorSets = {
      'blocked-legacy': { ap: hubAp, 'busy-lane': main.busyAnchor },
      punctured: { ap: hubAp, 'busy-lane': main.busyAnchor, convoy: main.convoyAnchor },
      'fuller-loads': { ap: hubAp, 'near-ap': nearAnchor },
      'side-by-side': { ap: hubAp, 'busy-lane': main.busyAnchor },
      'imaging-suite': { ap: hubAp, imaging, 'busy-lane': main.busyAnchor }
    };
    const lookTarget = { x: 0, y: 0, z: 0 };
    const look = new THREE.Vector3();
    const shownOn = {
      lInterference: ['blocked-legacy', 'punctured', 'imaging-suite'],
      lLegacy: ['blocked-legacy'],
      lPunctured: ['punctured'],
      lW7Compare: ['side-by-side'],
      lConvoy: ['punctured'],
      lNear: ['fuller-loads', 'side-by-side', 'imaging-suite'],
      lCmp: ['side-by-side'],
      lImaging: ['imaging-suite']
    };
    const allLabels = { lInterference, lLegacy, lPunctured, lW7Compare, lConvoy, lNear, lCmp, lImaging };

    // Trips near the access point carry a fuller load: vehicles there are longer and taller, which
    // reads from the high camera as well as from the side.
    const BASE = { convoy: { h: 0.3, l: 0.62 }, traffic: { h: 0.24, l: 0.55 } };
    const FULL = { h: 1.5, l: 1.7 };
    function loads(f, on) {
      if (!f) return;
      const base = f === main.convoy ? BASE.convoy : BASE.traffic;
      for (const c of f.cars) {
        const full = on && c.x < NEAR;
        c.h = full ? base.h * FULL.h : base.h;
        c.l = full ? base.l * FULL.l : base.l;
      }
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const cam = cameras[name];
        const jobs = [animateTo([
          [camera.position, 'x', cam.pos[0]], [camera.position, 'y', cam.pos[1]], [camera.position, 'z', cam.pos[2]],
          [lookTarget, 'x', cam.look[0]], [lookTarget, 'y', cam.look[1]], [lookTarget, 'z', cam.look[2]]
        ], { durationMs: 1300, animate, signal })];
        const legacyView = name === 'blocked-legacy';
        const compare = name === 'side-by-side';
        main.closed.visible = legacyView;
        main.old.mesh.visible = legacyView;
        main.w7.mesh.visible = !legacyView;
        main.convoy.mesh.visible = name === 'punctured';
        cmp.group.visible = compare;
        imaging.visible = name === 'imaging-suite';
        // Side by side: older Wi-Fi's road in front, Wi-Fi 7's behind.
        jobs.push(animateTo([[main.group.position, 'z', compare ? -2.9 : 0], [cmp.group.position, 'z', compare ? 2.9 : 0]], { durationMs: 1000, animate, signal }));
        const near = name === 'fuller-loads' || compare || name === 'imaging-suite';
        jobs.push(animateTo([[nearZone.material, 'opacity', near ? 0.35 : 0]], { durationMs: 700, animate, signal }));
        loads(main.w7, near);
        loads(main.convoy, near);
        for (const [key, l] of Object.entries(allLabels)) l.element.style.opacity = shownOn[key].includes(name) ? '1' : '0';
        if (compare || legacyView) recolor();
        await Promise.all(jobs);
        this.update(0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        recolor();
        ctx.requestRender();
      },
      update(dt) {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
        const near = mode === 'fuller-loads' || mode === 'side-by-side' || mode === 'imaging-suite';
        if (motionFull && dt > 0) {
          for (const f of [main.old, cmp.old, main.w7, main.convoy]) {
            if (!f.mesh.visible || !f.mesh.parent?.visible) continue;
            f.advance(dt);
            if (f !== main.old && f !== cmp.old) {
              loads(f, near);
              f.place();
            }
          }
        } else {
          loads(main.w7, near);
          main.w7.place();
        }
        const lead = main.convoy.cars[0];
        main.convoyAnchor.position.set(ROAD_X0 + lead.x, 0.7, main.lanes.laneZ(BUSY));
      },
      isIdle() {
        return !motionFull;
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [0, 11, 12], target: [0, 0, 0] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
