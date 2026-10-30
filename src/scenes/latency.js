// Low and predictable latency as a road from the bedside monitor to the nurses' station. Alarms are
// ambulances; a large download is grey trucks. Every ambulance that arrives adds a block to an
// arrivals board behind the road, so the late "tail" builds up live: most alarms arrive on time,
// a few get stuck behind a truck. Wi-Fi 7 adds a second lane (another band, multi-link) and
// protected slots in which the trucks pull over (Restricted TWT). Timings are illustrative.
const ROAD_X0 = -4.5;
const ROAD_X1 = 4.5;
const LANE_W = 0.95;
const TRUCK = { len: 1.6, speed: 2.5 };
const AMB = { len: 0.9, speed: 6 };
const BUCKETS = 12;
const BUCKET_S = 0.3;
const NOMINAL_S = (ROAD_X1 - ROAD_X0) / AMB.speed;
const LATE_BUCKET = 4;
const KEEP = 50; // arrivals kept on the board
const SLOT_EVERY = 3; // protected slot cadence (Wi-Fi 7)
const SLOT_LEN = 1;
const PREFILL_S = 70; // simulated before showing, so the board is already populated
const ALARM = '#c0392b';

export default {
  id: 'latency',
  states: ['alarm-delay', 'latency-tools', 'gen-compare'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, seeded } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi6';
    let mode = 'alarm-delay';
    const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
    const box = (w, h, d, color, extra) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));

    function ambulanceMesh() {
      const g = new THREE.Group();
      const body = box(AMB.len, 0.42, 0.55, '#f4f6f9');
      body.position.y = 0.26;
      const stripe = box(AMB.len + 0.01, 0.1, 0.56, ALARM);
      stripe.position.y = 0.26;
      const light = box(0.16, 0.1, 0.24, ALARM, { emissive: ALARM, emissiveIntensity: 0.8 });
      light.position.set(0.15, 0.52, 0);
      g.add(body, stripe, light);
      return g;
    }
    function truckMesh() {
      const g = new THREE.Group();
      const trailer = box(1.15, 0.62, 0.62, '#8a94a6');
      trailer.position.set(-0.22, 0.36, 0);
      const cab = box(0.4, 0.46, 0.6, '#5b6b82');
      cab.position.set(0.58, 0.28, 0);
      g.add(trailer, cab);
      return g;
    }

    // A corridor: monitor → road (lanes) → nurses' station, an access point over it and an
    // arrivals board behind it. It runs its own small traffic simulation.
    function corridor({ lanes, pullOver, seed }) {
      const group = new THREE.Group();
      scene.add(group);
      const width = lanes * LANE_W;
      const laneZ = (i) => (i - (lanes - 1) / 2) * LANE_W;
      const road = box(ROAD_X1 - ROAD_X0, 0.05, width + 0.2, '#4a5466');
      road.position.y = 0.02;
      group.add(road);
      for (let i = 1; i < lanes; i++) {
        const line = box(ROAD_X1 - ROAD_X0, 0.06, 0.05, '#ffffff');
        line.position.set(0, 0.03, (laneZ(i) + laneZ(i - 1)) / 2);
        group.add(line);
      }
      const shoulderZ = width / 2 + 0.55;
      const shoulder = box(ROAD_X1 - ROAD_X0, 0.03, 0.8, neutral.grid);
      shoulder.position.set(0, 0.01, shoulderZ);
      shoulder.visible = pullOver;
      group.add(shoulder);

      const monitor = kit.client('telemetry-monitor', { color: '#e9eef5' });
      monitor.scale.setScalar(1.5);
      monitor.position.set(ROAD_X0 - 0.9, 0, 0);
      const station = box(1.2, 0.9, 1.2, neutral.device);
      station.position.set(ROAD_X1 + 0.9, 0.45, 0);
      group.add(monitor, station);
      labels.add(monitor, 'Bedside monitor', { className: 'muted', offset: [0, 1.65, 0] });
      labels.add(station, 'Nurses’ station', { className: 'muted', offset: [0, 0.85, 0] });
      const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
      ap.scale.setScalar(0.7);
      ap.position.set(-2.6, 2.1, 0);
      group.add(ap);

      // Arrivals board: one column per arrival time, stacked blocks, late columns in red.
      const board = new THREE.Group();
      board.position.set(0.8, 0.35, -1.6);
      group.add(board);
      const panel = box(5.6, 2.3, 0.06, '#f2f5f9');
      panel.position.set(0, 1.05, -0.06);
      board.add(panel);
      const colW = 0.42;
      const blockH = 0.085;
      const maxStack = 24;
      const blocks = [];
      for (let c = 0; c < BUCKETS; c++) {
        const col = [];
        for (let r = 0; r < maxStack; r++) {
          const b = box(colW - 0.06, blockH - 0.03, 0.08, c >= LATE_BUCKET ? ALARM : palette.wifi7);
          b.position.set((c - (BUCKETS - 1) / 2) * colW, 0.1 + r * blockH, 0);
          b.visible = false;
          board.add(b);
          col.push(b);
        }
        blocks.push(col);
      }
      const onTime = new THREE.Object3D();
      onTime.position.set(-((BUCKETS - 1) / 2) * colW, 0, 0);
      const late = new THREE.Object3D();
      late.position.set(((BUCKETS - 1) / 2) * colW, 0, 0);
      board.add(onTime, late);
      labels.add(onTime, 'On time', { className: 'muted', offset: [0.2, -0.2, 0] });
      labels.add(late, 'Late', { className: 'muted', offset: [-0.2, -0.2, 0] });
      const boardTitle = labels.add(board, 'Alarm arrival times (illustrative)', { className: 'muted', offset: [0, 2.45, 0] });

      const truckPool = Array.from({ length: 4 * lanes }, () => {
        const m = truckMesh();
        m.visible = false;
        group.add(m);
        return m;
      });
      const ambPool = Array.from({ length: 8 }, () => {
        const m = ambulanceMesh();
        m.visible = false;
        group.add(m);
        return m;
      });
      const laneAnchor = new THREE.Object3D();
      laneAnchor.position.set(2.8, 0.1, laneZ(lanes - 1));
      const shoulderAnchor = new THREE.Object3D();
      shoulderAnchor.position.set(-2.2, 0.1, shoulderZ);
      group.add(laneAnchor, shoulderAnchor);

      return { group, lanes, laneZ, shoulderZ, pullOver, seed, ap, monitor, station, board, boardTitle, blocks, maxStack, truckPool, ambPool, laneAnchor, shoulderAnchor };
    }

    function reset(c) {
      c.rand = seeded(c.seed);
      c.time = 0;
      c.trucks = [];
      c.ambs = [];
      c.arrivals = [];
      c.nextTruck = Array.from({ length: c.lanes }, (_, i) => 0.5 + i * 4.5);
      c.nextAmb = 0.3;
    }
    const slotOn = (c) => c.pullOver && c.time % SLOT_EVERY < SLOT_LEN;
    const entryClear = (c, lane) => !c.trucks.some((v) => v.lane === lane && v.x < ROAD_X0 + TRUCK.len + 0.4) && !c.ambs.some((v) => v.lane === lane && v.x < ROAD_X0 + 1);

    function step(c, dt) {
      c.time += dt;
      for (let lane = 0; lane < c.lanes; lane++) {
        if (c.time >= c.nextTruck[lane] && entryClear(c, lane)) {
          c.trucks.push({ x: ROAD_X0 + TRUCK.len / 2, lane, z: c.laneZ(lane), aside: false, ...TRUCK });
          c.nextTruck[lane] = c.time + 2 + c.rand() * 5;
        }
      }
      if (c.time >= c.nextAmb) {
        // With more than one lane, the alarm takes the lane with no download ahead (multi-link).
        let lane = 0;
        if (c.lanes > 1) {
          const ahead = (l) => c.trucks.some((v) => v.lane === l && !v.aside);
          lane = [...Array(c.lanes).keys()].find((l) => !ahead(l)) ?? 0;
        }
        if (entryClear(c, lane)) {
          c.ambs.push({ x: ROAD_X0 + AMB.len / 2, lane, t0: c.time, ...AMB });
          c.nextAmb = c.time + 1.3 + c.rand() * 1.1;
        }
      }
      // Protected slot: downloads pull over to the shoulder and stop; afterwards they rejoin.
      const slot = slotOn(c);
      for (const v of c.trucks) {
        v.aside = slot;
        const targetZ = slot ? c.shoulderZ : c.laneZ(v.lane);
        v.z += (targetZ - v.z) * Math.min(1, dt * 8);
      }
      for (let lane = 0; lane < c.lanes; lane++) {
        const inLane = [...c.trucks.filter((v) => v.lane === lane && !v.aside), ...c.ambs.filter((v) => v.lane === lane)].sort((a, b) => b.x - a.x);
        let limit = Infinity;
        for (const v of inLane) {
          v.x = Math.min(v.x + v.speed * dt, limit - v.len / 2 - 0.25);
          limit = v.x - v.len / 2;
        }
      }
      c.trucks = c.trucks.filter((v) => v.x - v.len / 2 < ROAD_X1);
      for (const v of c.ambs) {
        if (v.x - v.len / 2 >= ROAD_X1) {
          c.arrivals.push(c.time - v.t0);
          if (c.arrivals.length > KEEP) c.arrivals.shift();
        }
      }
      c.ambs = c.ambs.filter((v) => v.x - v.len / 2 < ROAD_X1);
    }

    function draw(c) {
      for (const [i, m] of c.truckPool.entries()) {
        const v = c.trucks[i];
        m.visible = !!v;
        if (v) m.position.set(v.x, 0.04, v.z);
      }
      for (const [i, m] of c.ambPool.entries()) {
        const v = c.ambs[i];
        m.visible = !!v;
        if (v) m.position.set(v.x, 0.04, c.laneZ(v.lane));
      }
      const counts = new Array(BUCKETS).fill(0);
      for (const t of c.arrivals) counts[Math.max(0, Math.min(BUCKETS - 1, Math.floor((t - NOMINAL_S) / BUCKET_S)))]++;
      for (const [col, stack] of c.blocks.entries()) for (const [r, b] of stack.entries()) b.visible = r < Math.min(counts[col], c.maxStack);
    }

    const older = corridor({ lanes: 1, pullOver: false, seed: 41 });
    const seven = corridor({ lanes: 2, pullOver: true, seed: 41 });
    const corridors = [older, seven];

    const tag = (object, text, offset, className = 'muted') => {
      const l = labels.add(object, text, { className, offset });
      l.element.style.opacity = '0';
      return l;
    };
    const lLegend = tag(older.monitor, 'Ambulance = an alarm · truck = a large download', [2.6, -0.45, 1]);
    const lTail = tag(older.board, 'Most arrive on time · a few very late: the tail', [0, 2.8, 0], 'big');
    const lLane = tag(seven.laneAnchor, 'Second band free: multi-link', [0, 0.5, 0.3]);
    const lSlot = tag(seven.shoulderAnchor, 'Protected slot: downloads pull over', [0, 0.5, 0.3]);
    const lOlderTitle = tag(older.ap, '', [0, 0.65, 0], 'big');
    const lSevenTitle = tag(seven.ap, 'Wi-Fi 7', [0, 0.65, 0], 'big');
    const lOnTime = tag(seven.board, 'Alarms arrive on time, consistently', [0, -1.15, 3], 'big');

    const layout = {
      'alarm-delay': { older: [0, 0], seven: null, cam: [0, 3.8, 9], look: [0, 1, -0.4] },
      'latency-tools': { older: null, seven: [0, 0], cam: [0, 3.8, 9], look: [0, 1, -0.4] },
      'gen-compare': { older: [3.9, -3.2], seven: [0, 0], cam: [0, 6.2, 13.5], look: [0, 2.2, -1.2] }
    };
    const labelStates = [
      [lLegend, ['alarm-delay']],
      [lTail, ['alarm-delay']],
      [lLane, ['latency-tools']],
      [lSlot, ['latency-tools']],
      [lOlderTitle, ['gen-compare']],
      [lSevenTitle, ['gen-compare']],
      [lOnTime, ['gen-compare']]
    ];
    const lookTarget = { x: 0, y: 1, z: -0.4 };
    const look = new THREE.Vector3();
    const anchorSets = {
      'alarm-delay': { ap: older.ap, monitor: older.monitor, board: older.board },
      'latency-tools': { ap: seven.ap, lane: seven.laneAnchor, shoulder: seven.shoulderAnchor },
      'gen-compare': { ap: seven.ap, board: seven.board }
    };
    let live = false;

    function restart(name) {
      mode = name;
      const l = layout[name];
      for (const [c, key] of [[older, 'older'], [seven, 'seven']]) {
        c.group.visible = l[key] !== null;
        if (l[key]) c.group.position.set(0, l[key][0], l[key][1]);
        reset(c);
        for (let t = 0; t < PREFILL_S; t += 1 / 30) step(c, 1 / 30);
        draw(c);
      }
      labels.setText(lOlderTitle, genName(compareGen));
      for (const [label, states] of labelStates) label.element.style.opacity = states.includes(name) ? '1' : '0';
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        restart(name);
        live = animate && motionFull;
        const l = layout[name];
        await animateTo([
          [camera.position, 'x', l.cam[0]], [camera.position, 'y', l.cam[1]], [camera.position, 'z', l.cam[2]],
          [lookTarget, 'x', l.look[0]], [lookTarget, 'y', l.look[1]], [lookTarget, 'z', l.look[2]]
        ], { durationMs: 1100, animate, signal });
        this.update(0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        labels.setText(lOlderTitle, genName(compareGen));
        ctx.requestRender();
      },
      update(dt) {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
        if (!live || !dt) return;
        for (const c of corridors) {
          if (!c.group.visible) continue;
          step(c, Math.min(dt, 0.1));
          draw(c);
        }
      },
      isIdle() {
        return !live;
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [0, 6, 14], target: [0, 1, -0.4] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
