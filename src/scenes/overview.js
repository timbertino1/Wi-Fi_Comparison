// Overview: a hospital floor that fills with wireless devices, then a timeline of generations. The
// closing chapter returns to the same floor on Wi-Fi 7, each device labelled with what it gains.
const GENS = ['wifi4', 'wifi5', 'wifi6', 'wifi6e', 'wifi7'];
const MAX_DEVICES = 180;
const QUIET_DEVICES = 18;

export default {
  id: 'overview',
  states: ['floor-quiet', 'floor-crowded', 'timeline', 'timeline-wifi7', 'floor-wifi7', 'floor-plan'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, seeded } = ctx;
    const rand = seeded(7);

    // --- Hospital floor
    const floor = new THREE.Group();
    scene.add(floor);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(14, 0.12, 8), new THREE.MeshLambertMaterial({ color: neutral.floor }));
    slab.position.y = -0.06;
    floor.add(slab);

    const wallMaterial = new THREE.MeshLambertMaterial({ color: neutral.wall });
    const wallGeometry = new THREE.BoxGeometry(1, 0.5, 1);
    const walls = new THREE.InstancedMesh(wallGeometry, wallMaterial, 32);
    const m = new THREE.Matrix4();
    let w = 0;
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const x = -6 + i * 2.4 + 1.2;
        // back wall and divider of each patient room
        m.compose(new THREE.Vector3(x, 0.25, side * 3.9), new THREE.Quaternion(), new THREE.Vector3(2.35, 1, 0.08));
        walls.setMatrixAt(w++, m);
        m.compose(new THREE.Vector3(x - 1.2, 0.25, side * 2.85), new THREE.Quaternion(), new THREE.Vector3(0.08, 1, 2.1));
        walls.setMatrixAt(w++, m);
      }
    }
    walls.count = w;
    floor.add(walls);

    const station = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 1), new THREE.MeshStandardMaterial({ color: neutral.device, roughness: 0.6 }));
    station.position.set(0, 0.3, 0);
    floor.add(station);
    const stationLabel = labels.add(station, 'Nurses’ station', { className: 'muted', offset: [0, 0.6, 0] });

    const aps = [-4.2, 0, 4.2].map((x) => {
      const { group } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
      group.position.set(x, 2.1, 0);
      group.scale.setScalar(0.7);
      floor.add(group);
      return group;
    });
    const apLabel = labels.add(aps[2], 'Access point', { className: 'muted', offset: [0, 0.6, 0] });

    // Devices: one instanced crowd per typical clinical client; device i is of type i % types, so
    // how many are visible tells the story and every type is present from the quiet floor on.
    // `where`: rooms (bedside kit), corridor (carts) or anywhere (worn and carried devices).
    const TYPES = [
      // The first device of each type anchors its hotspot: spots sit in the left two-thirds of the
      // floor, clear of the callout card on the right.
      { id: 'voice-badge', scale: 0.62, where: 'any', spot: [-5.2, 1.9] },
      { id: 'infusion-pump', scale: 0.38, where: 'room', spot: [-3.0, -2.4] },
      { id: 'telemetry-monitor', scale: 0.5, where: 'room', spot: [-0.5, 2.6] },
      { id: 'phone', scale: 0.55, where: 'any', spot: [2.6, 2.2] },
      { id: 'workstation-cart', scale: 0.42, where: 'corridor', spot: [-2.4, 0.6] },
      { id: 'rtls-tag', scale: 0.85, where: 'any', spot: [-3.4, 2.8] }
    ];
    const genColor = new THREE.Color(palette.wifi7);
    const idleColor = new THREE.Color(neutral.device);
    const crowds = TYPES.map((t) => {
      const mesh = kit.clientCrowd(t.id, Math.ceil(MAX_DEVICES / TYPES.length), { color: neutral.device });
      floor.add(mesh);
      return { ...t, mesh, spots: [] };
    });
    const deviceSpots = [];
    const typeAnchors = {};
    for (let i = 0; i < MAX_DEVICES; i++) {
      const crowd = crowds[i % TYPES.length];
      const k = crowd.spots.length;
      let spot;
      if (k === 0) {
        spot = new THREE.Vector3(crowd.spot[0], 0, crowd.spot[1]);
      } else {
        const side = rand() < 0.5 ? -1 : 1;
        const where = crowd.where === 'any' ? (rand() < 0.75 ? 'room' : 'corridor') : crowd.where;
        const x = -6.6 + rand() * 13.2;
        spot = new THREE.Vector3(x, 0, where === 'room' ? side * (1.4 + rand() * 2.2) : (rand() - 0.5) * 1.6);
      }
      crowd.spots.push(spot);
      deviceSpots.push(spot);
      m.compose(spot, new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * Math.PI, 0)), new THREE.Vector3().setScalar(crowd.scale));
      crowd.mesh.setMatrixAt(k, m);
      crowd.mesh.setColorAt(k, i < QUIET_DEVICES ? genColor : idleColor);
      if (k === 0) {
        // Hotspot anchor at the top of this type's first device, which is visible in every floor state.
        const anchor = new THREE.Object3D();
        anchor.position.set(spot.x, crowd.scale * 1.1, spot.z);
        floor.add(anchor);
        typeAnchors[crowd.id] = anchor;
      }
    }
    // Closing recap: what Wi-Fi 7 does for each kind of device, one chapter each.
    const WINS = {
      'voice-badge': 'Steadier calls · multi-link',
      'infusion-pump': 'Safer sign-in · WPA3',
      'telemetry-monitor': 'Alarms on time',
      phone: 'Room for everyone · OFDMA',
      'workstation-cart': 'Big files fast · 6 GHz',
      'rtls-tag': 'Battery lasts the shift · TWT'
    };
    const winLabels = Object.entries(WINS).map(([id, text]) => {
      const l = labels.add(typeAnchors[id], text, { className: 'big', offset: [0, 0.55, 0] });
      l.element.style.opacity = '0';
      return l;
    });
    const visibleOf = (n, t) => (n > t ? Math.floor((n - 1 - t) / TYPES.length) + 1 : 0);
    for (const [t, c] of crowds.entries()) c.mesh.count = visibleOf(QUIET_DEVICES, t);

    // Ambient packets flowing to the nearest access point while the floor is busy.
    const packets = Array.from({ length: 24 }, (_, i) => {
      const p = kit.packet({ color: palette.wifi7, size: 0.12 });
      p.visible = false;
      p.userData = { phase: i / 24, from: deviceSpots[(i * 7) % MAX_DEVICES] };
      floor.add(p);
      return p;
    });

    // --- Generation timeline
    const timeline = new THREE.Group();
    timeline.position.set(0, 0, 1.5);
    timeline.visible = false;
    scene.add(timeline);
    const gens = GENS.map((id) => ctx.generations.find((g) => g.id === id)).filter(Boolean);
    const pillars = gens.map((gen, i) => {
      const height = 1 + i * 0.55; // order only — heights are illustrative, not data
      const geometry = new THREE.CylinderGeometry(0.42, 0.42, height, 32);
      geometry.translate(0, height / 2, 0);
      const pillar = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: palette[gen.id], roughness: 0.45 }));
      pillar.position.x = (i - (gens.length - 1) / 2) * 2.1;
      pillar.scale.y = 0.001;
      timeline.add(pillar);
      const year = ctx.claim(gen.yearClaimId).value;
      const label = labels.add(pillar, `${gen.name} · ${year}`, { className: 'big', offset: [0, height + 0.45, 0] });
      label.element.style.opacity = '0';
      labels.add(pillar, gen.ieee, { className: 'muted', offset: [0, -0.35, 0.6] }).element.style.opacity = '0';
      return { pillar, height, label, gen };
    });
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 12, 64), new THREE.MeshBasicMaterial({ color: palette.wifi7, transparent: true, opacity: 0 }));
    halo.rotation.x = Math.PI / 2;
    const last = pillars.at(-1);
    halo.position.set(last.pillar.position.x, 0.05, 0);
    timeline.add(halo);

    const cameraFloor = { x: 0, y: 9.5, z: 9.5 };
    const cameraTimeline = { x: 0, y: 4.2, z: 12.5 };
    const cameraPlan = { x: 0, y: 11.5, z: 12.5 };
    const flowing = (name) => name === 'floor-crowded' || name === 'floor-wifi7' || name === 'floor-plan';
    const counter = { n: QUIET_DEVICES };
    let shown = QUIET_DEVICES;
    function applyCount() {
      const n = Math.round(counter.n);
      if (n === shown) return;
      shown = n;
      for (const [t, c] of crowds.entries()) {
        const count = visibleOf(n, t);
        if (count === c.mesh.count) continue;
        for (let k = Math.min(count, c.mesh.count); k < Math.max(count, c.mesh.count); k++) c.mesh.setColorAt(k, k < count ? genColor : idleColor);
        c.mesh.count = count;
        c.mesh.instanceColor.needsUpdate = true;
      }
    }
    // Hotspot anchors per state (contract: cached, hidden objects omitted). `ap` is the middle AP.
    const floorAnchors = { ap: aps[1], ...typeAnchors };
    const timelineAnchors = { ap: aps[1] };
    let mode = 'floor-quiet';
    let time = 0;
    const motionFull = ctx.motion === 'full';

    function setLabelsVisible(visible) {
      for (const { pillar } of pillars) {
        for (const child of pillar.children) if (child.element) child.element.style.opacity = visible ? '1' : '0';
      }
      // The floor's own labels would sit behind the pillars' labels on the timeline.
      for (const l of [stationLabel, apLabel]) l.element.style.opacity = visible ? '0' : '1';
    }

    function lookTarget() {
      camera.lookAt(0, mode.startsWith('timeline') ? 1.9 : 0, 0); // pillars sit low, under the caption
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const toTimeline = name.startsWith('timeline');
        if (toTimeline) timeline.visible = true;
        const cam = toTimeline ? cameraTimeline : name === 'floor-plan' ? cameraPlan : cameraFloor;
        const deviceTarget = name === 'floor-quiet' ? QUIET_DEVICES : MAX_DEVICES;
        const jobs = [
          animateTo([[camera.position, 'x', cam.x], [camera.position, 'y', cam.y], [camera.position, 'z', cam.z]], { durationMs: 1400, animate, signal }),
          animateTo([[floor.position, 'z', toTimeline ? -3.5 : 0], [floor.scale, 'x', toTimeline ? 0.8 : 1], [floor.scale, 'z', toTimeline ? 0.8 : 1]], { durationMs: 1200, animate, signal }),
          animateTo([[counter, 'n', deviceTarget]], { durationMs: 2200, animate, signal })
        ];
        jobs.push(...pillars.map(({ pillar }, i) => animateTo([[pillar.scale, 'y', toTimeline ? (name === 'timeline-wifi7' && i === pillars.length - 1 ? 1.15 : 1) : 0.001]], {
          durationMs: 900, delayMs: toTimeline ? i * 180 : 0, animate, signal, ease: ctx.easing.easeOutBack
        })));
        jobs.push(animateTo([[halo.material, 'opacity', name === 'timeline-wifi7' ? 0.95 : 0]], { durationMs: 800, animate, signal }));
        setLabelsVisible(toTimeline);
        for (const l of winLabels) l.element.style.opacity = name === 'floor-wifi7' ? '1' : '0';
        const finished = await Promise.all(jobs);
        if (!toTimeline && finished.every(Boolean)) timeline.visible = false;
        applyCount();
        for (const p of packets) p.visible = motionFull && flowing(name);
        lookTarget();
        ctx.requestRender();
      },
      setGeneration() {
        // The overview shows every generation at once; nothing to switch.
      },
      update(dt) {
        applyCount();
        lookTarget();
        if (!(motionFull && flowing(mode))) return;
        time += dt;
        for (const p of packets) {
          const t = (time * 0.35 + p.userData.phase) % 1;
          const from = p.userData.from;
          const ap = aps.reduce((best, a) => (Math.abs(a.position.x - from.x) < Math.abs(best.position.x - from.x) ? a : best));
          p.position.set(from.x + (ap.position.x - from.x) * t, 0.3 + (ap.position.y - 0.3) * t, from.z * (1 - t));
        }
      },
      isIdle() {
        return !(motionFull && flowing(mode));
      },
      anchors() {
        return mode.startsWith('timeline') ? timelineAnchors : floorAnchors;
      },
      shots: { wide: { position: [0, 11, 12], target: [0, 0, 0] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 60 : 40;
        camera.updateProjectionMatrix();
      },
      dispose() {
        // Geometries, materials and labels are released by the stage.
      }
    };
  }
};
