// What's next as the road ahead. The generations are stretches of one road: Wi-Fi 6, 6E and 7 are
// open; Wi-Fi 8 (IEEE 802.11bn, still in development) is a dashed stretch behind cones. Reliability
// is delivery vans driving through storms (interference): on Wi-Fi 7 a few parcels are dropped;
// the Wi-Fi 8 goal lane drops none, labelled as a goal, not a result. The outlook shows the road's
// foundations (switching, PoE, 6 GHz design) running on under the new stretch. No figures shown.
const STRETCHES = [
  { id: 'wifi6', len: 3.2 },
  { id: 'wifi6e', len: 3.2 },
  { id: 'wifi7', len: 4.4 },
  { id: 'wifi8', len: 4.4, future: true }
];
const ROAD_W = 1.8;
const VAN_SPEED = 2.2;
const RED = '#c0392b';

export default {
  id: 'wifi8',
  states: ['roadmap', 'reliability', 'outlook'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let mode = 'roadmap';
    let time = 0;
    const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...extra });
    const box = (w, h, d, color, extra) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
    const dashed = (geometry, color) => {
      const line = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineDashedMaterial({ color, dashSize: 0.18, gapSize: 0.12 }));
      line.computeLineDistances();
      return line;
    };
    const tag = (object, text, offset, className = 'muted') => {
      const l = labels.add(object, text, { className, offset });
      l.element.style.opacity = '0';
      return l;
    };

    // --- The road of generations.
    const road = new THREE.Group();
    scene.add(road);
    const total = STRETCHES.reduce((s, x) => s + x.len, 0);
    let x0 = -total / 2;
    const stretches = STRETCHES.map((s) => {
      const cx = x0 + s.len / 2;
      x0 += s.len;
      const group = new THREE.Group();
      group.position.x = cx;
      road.add(group);
      if (s.future) {
        const ghost = dashed(new THREE.BoxGeometry(s.len - 0.1, 0.08, ROAD_W), palette.wifi8);
        ghost.position.y = 0.04;
        group.add(ghost);
        for (const dx of [-s.len / 2 + 0.3, -s.len / 2 + 1.1]) {
          for (const dz of [-0.6, 0, 0.6]) {
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.36, 12), mat('#e67e22'));
            cone.position.set(dx, 0.18, dz);
            group.add(cone);
          }
        }
      } else {
        const slab = box(s.len - 0.06, 0.08, ROAD_W, '#4a5466');
        slab.position.y = 0.04;
        const edge = box(s.len - 0.06, 0.1, 0.08, palette[s.id]);
        edge.position.set(0, 0.05, ROAD_W / 2 + 0.04);
        const line = box(s.len - 0.4, 0.09, 0.05, '#ffffff');
        line.position.y = 0.05;
        group.add(slab, edge, line);
      }
      const sign = new THREE.Object3D();
      sign.position.set(0, 0.2, ROAD_W / 2 + 0.3);
      group.add(sign);
      const name = genName(s.id);
      const label = labels.add(sign, s.future ? `${name} · in development` : name, { className: 'big', offset: [0, -0.15, 0.4] });
      return { ...s, group, sign, label, cx };
    });
    const w7 = stretches[2];
    const w8 = stretches[3];
    const lToday = tag(w7.sign, 'You are here: certified today', [0, 1.2, 0]);
    const lBuilds = tag(w8.sign, 'Still being designed, not yet approved', [0, 1.2, 0]);

    // --- Reliability: two lanes (Wi-Fi 7 and the Wi-Fi 8 goal) through storms, with vans.
    const delivery = new THREE.Group();
    scene.add(delivery);
    const LANE_LEN = 10;
    const lanes = [
      { id: 'wifi7', z: -1.1, drops: true },
      { id: 'wifi8', z: 1.1, drops: false }
    ].map((lane) => {
      const g = new THREE.Group();
      g.position.z = lane.z;
      delivery.add(g);
      if (lane.drops) {
        const slab = box(LANE_LEN, 0.08, 1.1, '#4a5466');
        slab.position.y = 0.04;
        g.add(slab);
      } else {
        const ghost = dashed(new THREE.BoxGeometry(LANE_LEN, 0.08, 1.1), palette.wifi8);
        ghost.position.y = 0.04;
        g.add(ghost);
      }
      const start = new THREE.Object3D();
      start.position.set(-LANE_LEN / 2, 0.1, 0);
      g.add(start);
      const vans = Array.from({ length: 4 }, (_, i) => {
        const van = new THREE.Group();
        const body = box(0.75, 0.42, 0.5, lane.drops ? '#e9eef5' : '#ece4f7');
        body.position.y = 0.27;
        const parcel = box(0.24, 0.2, 0.24, '#c89b5a');
        parcel.position.set(-0.1, 0.58, 0);
        van.add(body, parcel);
        van.userData = { offset: i / 4, parcel };
        g.add(van);
        return van;
      });
      // Parcels already lost on the Wi-Fi 7 lane, by the storms.
      const lost = lane.drops ? [-2.5, -2.2, 1.6].map((x) => {
        const p = box(0.24, 0.2, 0.24, RED, { emissive: RED, emissiveIntensity: 0.3 });
        p.position.set(x, 0.12, 0.75);
        p.rotation.y = x;
        g.add(p);
        return p;
      }) : [];
      const label = labels.add(start, lane.drops ? genName('wifi7') : `${genName('wifi8')} goal: no parcels lost (illustrative)`, { className: 'big', offset: [-0.9, 0.3, 0] });
      return { ...lane, g, vans, lost, label };
    });
    const storms = [-2.4, 1.6].map((x) => {
      const cloud = new THREE.Group();
      for (const [dx, dy, r] of [[0, 0, 0.55], [0.5, 0.1, 0.42], [-0.5, 0.05, 0.45]]) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), mat('#7f8a9c', { transparent: true, opacity: 0.85 }));
        puff.position.set(dx, dy, 0);
        cloud.add(puff);
      }
      cloud.position.set(x, 2.3, 0);
      const rain = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2, 16, 1, true), mat('#9fc4e8', { transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }));
      rain.position.set(x, 1.1, 0);
      delivery.add(cloud, rain);
      return cloud;
    });
    const lStorm = tag(storms[0], 'Interference and movement', [0, 0.8, 0]);
    const lLost = tag(lanes[0].lost[2], 'Lost messages', [1.1, 0.1, 0.3]);

    // --- Outlook: the foundations under the road, running on beneath the new stretch.
    const foundations = new THREE.Group();
    road.add(foundations);
    const layers = [
      { text: 'Multi-gigabit switching', color: '#5b6b82' },
      { text: 'PoE power budgets', color: '#e6b422' },
      { text: '6 GHz-capable designs', color: palette.wifi7 }
    ].map((layer, i) => {
      const y = -0.25 - i * 0.32;
      const solid = box(w7.len + w8.len - 0.1, 0.26, ROAD_W, layer.color);
      solid.position.set((w7.cx + w8.cx) / 2, y, 0);
      foundations.add(solid);
      const anchor = new THREE.Object3D();
      anchor.position.set(w7.cx, y, ROAD_W / 2);
      foundations.add(anchor);
      return tag(anchor, layer.text, [0, 0, 0.3]);
    });
    const lCarry = tag(w8.sign, 'Built today, carried forward', [0, 1.2, 0], 'big');

    const cams = {
      roadmap: { pos: [1.4, 4.6, 10.5], look: [1.4, 0.1, 0] },
      reliability: { pos: [-0.9, 3.8, 9.5], look: [-0.9, 0.7, 0] },
      outlook: { pos: [w8.cx - 1.2, 2.4, 8.5], look: [w8.cx - 2.2, -0.2, 0] }
    };
    const lookTarget = { x: 0.6, y: 0.2, z: 0 };
    const look = new THREE.Vector3();
    const anchorSets = {
      roadmap: { ap: w7.sign, wifi7: w7.sign, wifi8: w8.sign },
      reliability: { ap: lanes[0].g, storm: storms[0], goal: lanes[1].g },
      outlook: { ap: w7.sign, wifi8: w8.sign }
    };

    function drawVans() {
      for (const lane of lanes) {
        for (const van of lane.vans) {
          const f = ((time * VAN_SPEED) / LANE_LEN + van.userData.offset) % 1;
          const x = -LANE_LEN / 2 + 0.4 + f * (LANE_LEN - 0.8);
          van.position.set(x, 0.04, 0);
          // On Wi-Fi 7, vans that have passed the second storm may have lost their parcel.
          van.userData.parcel.visible = !(lane.drops && van.userData.offset === 0.5 && x > 1.6);
        }
      }
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        road.visible = name !== 'reliability';
        delivery.visible = name === 'reliability';
        foundations.visible = name === 'outlook';
        for (const s of stretches) s.label.element.style.opacity = name === 'roadmap' || (name === 'outlook' && s.future) ? '1' : '0';
        const on = (label, states) => {
          label.element.style.opacity = states.includes(name) ? '1' : '0';
        };
        on(lToday, ['roadmap']);
        on(lBuilds, ['roadmap']);
        on(lStorm, ['reliability']);
        on(lLost, ['reliability']);
        on(lCarry, ['outlook']);
        for (const l of layers) on(l, ['outlook']);
        for (const lane of lanes) lane.label.element.style.opacity = name === 'reliability' ? '1' : '0';
        drawVans();
        const cam = cams[name];
        await animateTo([
          [camera.position, 'x', cam.pos[0]], [camera.position, 'y', cam.pos[1]], [camera.position, 'z', cam.pos[2]],
          [lookTarget, 'x', cam.look[0]], [lookTarget, 'y', cam.look[1]], [lookTarget, 'z', cam.look[2]]
        ], { durationMs: 1100, animate, signal });
        this.update(0);
        ctx.requestRender();
      },
      setGeneration() {},
      update(dt) {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
        if (!motionFull || !dt || mode !== 'reliability') return;
        time += dt;
        drawVans();
      },
      isIdle() {
        return !(motionFull && mode === 'reliability');
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [0.6, 6, 13], target: [0.6, 0.2, 0] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
