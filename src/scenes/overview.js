// Overview: a hospital floor that fills with wireless devices, then a timeline of generations.
const GENS = ['wifi4', 'wifi5', 'wifi6', 'wifi6e', 'wifi7'];
const MAX_DEVICES = 180;
const QUIET_DEVICES = 18;

export default {
  id: 'overview',
  states: ['floor-quiet', 'floor-crowded', 'timeline', 'timeline-wifi7'],

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
    labels.add(aps[2], 'Access point', { className: 'muted', offset: [0, 0.6, 0] });

    // Devices: one instanced mesh; how many are visible tells the story.
    const devices = kit.clientCrowd('dot', MAX_DEVICES, { color: neutral.device });
    const genColor = new THREE.Color(palette.wifi7);
    const deviceSpots = [];
    for (let i = 0; i < MAX_DEVICES; i++) {
      const inRoom = i % 5 !== 0;
      const side = rand() < 0.5 ? -1 : 1;
      const x = -6.6 + rand() * 13.2;
      const z = inRoom ? side * (1.4 + rand() * 2.2) : (rand() - 0.5) * 1.6;
      deviceSpots.push(new THREE.Vector3(x, 0, z));
      m.compose(deviceSpots[i], new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rand() * Math.PI, 0)), new THREE.Vector3(1, 1, 1));
      devices.setMatrixAt(i, m);
      devices.setColorAt(i, i < QUIET_DEVICES ? genColor : new THREE.Color(neutral.device));
    }
    devices.count = QUIET_DEVICES;
    floor.add(devices);

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
    const counter = { n: QUIET_DEVICES };
    function applyCount() {
      const n = Math.round(counter.n);
      if (n === devices.count) return;
      for (let i = Math.min(n, devices.count); i < Math.max(n, devices.count); i++) devices.setColorAt(i, i < n ? genColor : new THREE.Color(neutral.device));
      devices.count = n;
      devices.instanceColor.needsUpdate = true;
    }
    let mode = 'floor-quiet';
    let time = 0;
    const motionFull = ctx.motion === 'full';

    function setLabelsVisible(visible) {
      for (const { pillar } of pillars) {
        for (const child of pillar.children) if (child.element) child.element.style.opacity = visible ? '1' : '0';
      }
      stationLabel.element.style.opacity = visible ? '0' : '1';
    }

    function lookTarget() {
      camera.lookAt(0, mode.startsWith('timeline') ? 1.4 : 0, 0);
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const toTimeline = name.startsWith('timeline');
        if (toTimeline) timeline.visible = true;
        const cam = toTimeline ? cameraTimeline : cameraFloor;
        const deviceTarget = name === 'floor-quiet' ? QUIET_DEVICES : MAX_DEVICES;
        const jobs = [
          animateTo([[camera.position, 'x', cam.x], [camera.position, 'y', cam.y], [camera.position, 'z', cam.z]], { durationMs: 1400, animate, signal }),
          animateTo([[floor.position, 'z', toTimeline ? -3.5 : 0], [floor.scale, 'x', toTimeline ? 0.8 : 1], [floor.scale, 'z', toTimeline ? 0.8 : 1]], { durationMs: 1200, animate, signal }),
          animateTo([[counter, 'n', deviceTarget]], { durationMs: 2200, animate, signal })
        ];
        jobs.push(...pillars.map(({ pillar }, i) => animateTo([[pillar.scale, 'y', toTimeline ? (name === 'timeline-wifi7' && i === pillars.length - 1 ? 1.35 : 1) : 0.001]], {
          durationMs: 900, delayMs: toTimeline ? i * 180 : 0, animate, signal, ease: ctx.easing.easeOutBack
        })));
        jobs.push(animateTo([[halo.material, 'opacity', name === 'timeline-wifi7' ? 0.95 : 0]], { durationMs: 800, animate, signal }));
        setLabelsVisible(toTimeline);
        const finished = await Promise.all(jobs);
        if (!toTimeline && finished.every(Boolean)) timeline.visible = false;
        applyCount();
        for (const p of packets) p.visible = motionFull && name === 'floor-crowded';
        lookTarget();
        ctx.requestRender();
      },
      setGeneration() {
        // The overview shows every generation at once; nothing to switch.
      },
      update(dt) {
        applyCount();
        lookTarget();
        if (!(motionFull && mode === 'floor-crowded')) return;
        time += dt;
        for (const p of packets) {
          const t = (time * 0.35 + p.userData.phase) % 1;
          const from = p.userData.from;
          const ap = aps.reduce((best, a) => (Math.abs(a.position.x - from.x) < Math.abs(best.position.x - from.x) ? a : best));
          p.position.set(from.x + (ap.position.x - from.x) * t, 0.3 + (ap.position.y - 0.3) * t, from.z * (1 - t));
        }
      },
      isIdle() {
        return !(motionFull && mode === 'floor-crowded');
      },
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
