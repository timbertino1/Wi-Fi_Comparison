// Client density as hospital lifts at shift change. Devices queue in the lobby to send; each lift
// trip is one transmission to the access point (uplink). With contention (Wi-Fi 5 and earlier) a trip
// carries one sending device (Wi-Fi 5 shares only downlink trips, with MU-MIMO), so the
// queue grows and devices wait longer (amber, then red). With OFDMA a trip carries several devices
// at once, and Wi-Fi 7 adds more lifts (one per band), so the queue empties. Rates are illustrative.
const ARRIVALS = 2.6; // devices joining the queue per second (shift change)
const TRIP_S = 1.1; // seconds for one lift trip
const SEATS = 6; // devices per trip with OFDMA
const START_QUEUE = 34;
const MAX_SHOWN = 70;
const COLS = 10;
const GAP = 0.36;
const STILL_S = 7; // simulated seconds shown in stills and with reduced motion
const RED = '#c0392b';
const AMBER = '#d9a521';

export default {
  id: 'density',
  states: ['crowd-contention', 'crowd-airtime', 'ofdma-slices', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi5';
    let mode = 'crowd-contention';
    const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
    const box = (w, h, d, color, extra) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
    const colors = { fresh: new THREE.Color(palette.wifi7), amber: new THREE.Color(AMBER), red: new THREE.Color(RED) };
    const tmp = new THREE.Matrix4();

    // A bank of lifts with its own lobby queue. bands: one label per lift (null = unlabelled).
    function bank({ bands, title }) {
      const group = new THREE.Group();
      scene.add(group);
      const lobby = box(4.4, 0.06, 3.2, neutral.grid);
      lobby.position.set(0, -0.03, 1.3);
      group.add(lobby);
      const shaftW = 1.25;
      const lifts = bands.map((band, i) => {
        const x = (i - (bands.length - 1) / 2) * (shaftW + 0.15);
        const shaft = new THREE.Mesh(new THREE.BoxGeometry(shaftW, 3.3, 1), mat('#c8d2df', { transparent: true, opacity: 0.35 }));
        shaft.position.set(x, 1.65, -0.9);
        const car = new THREE.Group();
        car.position.set(x, 0, -0.9);
        const cab = box(1.05, 0.9, 0.8, '#e9eef5');
        cab.position.y = 0.45;
        car.add(cab);
        const seats = Array.from({ length: SEATS }, (_, s) => {
          const seat = box(0.22, 0.22, 0.22, palette.wifi7, { emissive: palette.wifi7, emissiveIntensity: 0.3 });
          seat.position.set(-0.32 + (s % 3) * 0.32, 0.3 + Math.floor(s / 3) * 0.3, 0.42);
          seat.visible = false;
          car.add(seat);
          return seat;
        });
        group.add(shaft, car);
        // The middle band's label sits lower, so neighbouring labels never meet.
        if (band) labels.add(shaft, band, { className: 'muted', offset: [0, 1.95 - (i % 2) * 0.6, 0] });
        return { shaft, car, cab, seats, phase: i / bands.length, boarded: 0 };
      });
      const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
      ap.scale.setScalar(0.8);
      ap.position.set(0, 3.6, -0.9);
      group.add(ap);
      const queueMesh = kit.clientCrowd('dot', MAX_SHOWN, { color: palette.wifi7 });
      group.add(queueMesh);
      const queueAnchor = new THREE.Object3D();
      queueAnchor.position.set(0, 0.2, 2.9);
      group.add(queueAnchor);
      const titleLabel = labels.add(ap, title, { className: 'big', offset: [0, 1.15, 0] });
      return { group, lifts, ap, queueMesh, queueAnchor, titleLabel, capacity: 1, queue: [], time: 0, carry: 0 };
    }

    function reset(b, capacity) {
      b.capacity = capacity;
      b.time = 0;
      b.carry = 0;
      // Start with a queue that has already been waiting a while (oldest first).
      b.queue = Array.from({ length: START_QUEUE }, (_, i) => -6 + (i * 6) / START_QUEUE);
      for (const [i, lift] of b.lifts.entries()) {
        lift.phase = i / b.lifts.length;
        lift.boarded = 0;
      }
    }

    // Advance one bank's simulation: arrivals join the back, each lift boards at the bottom of a trip.
    function step(b, dt) {
      b.time += dt;
      b.carry += ARRIVALS * dt;
      while (b.carry >= 1) {
        b.carry -= 1;
        b.queue.push(b.time);
      }
      for (const lift of b.lifts) {
        const before = lift.phase;
        lift.phase = (lift.phase + dt / TRIP_S) % 1;
        if (lift.phase < before) {
          lift.boarded = Math.min(b.capacity, b.queue.length);
          b.queue.splice(0, lift.boarded);
        }
      }
    }

    function draw(b) {
      const shown = Math.min(b.queue.length, MAX_SHOWN);
      for (let i = 0; i < MAX_SHOWN; i++) {
        if (i < shown) {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          tmp.makeTranslation((col - (COLS - 1) / 2) * GAP, 0, 0.35 + row * GAP);
          const wait = b.time - b.queue[i];
          b.queueMesh.setColorAt(i, wait > 5 ? colors.red : wait > 2.5 ? colors.amber : colors.fresh);
        } else {
          tmp.makeScale(0, 0, 0);
        }
        b.queueMesh.setMatrixAt(i, tmp);
      }
      b.queueMesh.instanceMatrix.needsUpdate = true;
      if (b.queueMesh.instanceColor) b.queueMesh.instanceColor.needsUpdate = true;
      for (const lift of b.lifts) {
        // Board at the bottom, rise, drop the devices off at the top, come back down.
        const p = lift.phase;
        const up = p < 0.12 ? 0 : p < 0.5 ? (p - 0.12) / 0.38 : p < 0.88 ? 1 - (p - 0.5) / 0.38 : 0;
        lift.car.position.y = 2.25 * (0.5 - 0.5 * Math.cos(Math.PI * up));
        const riding = p < 0.5 ? lift.boarded : 0;
        for (const [s, seat] of lift.seats.entries()) seat.visible = s < riding;
      }
    }

    const one = bank({ bands: [null], title: '' });
    const seven = bank({ bands: ['2.4 GHz', '5 GHz', '6 GHz'], title: 'Wi-Fi 7: links in up to three bands' });
    const banks = [one, seven];

    const tag = (object, text, offset, className = 'muted') => {
      const l = labels.add(object, text, { className, offset });
      l.element.style.opacity = '0';
      return l;
    };
    const lQueue = tag(one.queueAnchor, 'Devices waiting to send · red = waiting longest', [0, 1.1, -0.2]);
    const lTrip = tag(one.lifts[0].shaft, 'Each trip = one transmission', [1.7, 1.4, 0]);
    const lShare = tag(one.ap, 'One elevator shared by every device: its airtime', [0, 1.8, 0]); // above the lift's title
    const lSeats = tag(one.lifts[0].car, 'OFDMA (Wi-Fi 6): several devices per trip', [1.8, 0.9, 0]);
    const lQueue7 = tag(seven.queueAnchor, 'Hardly anyone waiting', [0, 0.9, -0.2]);

    // Per state: what the single bank stands for, and where each bank sits.
    const oneTitle = () => {
      if (mode === 'gen-compare') return compareGen === 'wifi5' ? `${genName('wifi5')}: one sender per trip` : `${genName(compareGen)}: several per trip, one elevator`;
      return mode === 'ofdma-slices' ? 'Wi-Fi 6 and 7: several per trip' : 'Wi-Fi 5 and earlier: one sender per trip';
    };
    const oneCapacity = () => {
      if (mode === 'gen-compare') return compareGen === 'wifi5' ? 1 : SEATS;
      return mode === 'ofdma-slices' ? SEATS : 1;
    };
    const layout = {
      'crowd-contention': { one: 0, seven: null, cam: [0, 3.6, 9], look: [0, 2.3, 0.6] },
      'crowd-airtime': { one: 0, seven: null, cam: [0, 3.6, 9], look: [0, 2.3, 0.6] },
      'ofdma-slices': { one: 0, seven: null, cam: [0, 3.6, 9], look: [0, 2.3, 0.6] },
      'gen-compare': { one: -3.3, seven: 3.3, cam: [0, 4.4, 13], look: [0, 2.3, 0.6] },
      'clinical-outcome': { one: null, seven: 0, cam: [0, 3.8, 10], look: [0, 2.3, 0.6] }
    };
    const lookTarget = { x: 0, y: 1.8, z: 0.6 };
    const look = new THREE.Vector3();
    const anchorSets = {
      'crowd-contention': { ap: one.ap, queue: one.queueAnchor, lift: one.lifts[0].car },
      'crowd-airtime': { ap: one.ap, queue: one.queueAnchor, lift: one.lifts[0].car },
      'ofdma-slices': { ap: one.ap, lift: one.lifts[0].car },
      'gen-compare': { ap: seven.ap, lifts: seven.lifts[1].car, queue: one.queueAnchor },
      'clinical-outcome': { ap: seven.ap, queue: seven.queueAnchor }
    };
    let live = false;

    function restart(name) {
      mode = name;
      reset(one, oneCapacity());
      reset(seven, SEATS);
      labels.setText(one.titleLabel, oneTitle());
      const l = layout[name];
      one.group.visible = l.one !== null;
      seven.group.visible = l.seven !== null;
      if (l.one !== null) one.group.position.x = l.one;
      if (l.seven !== null) seven.group.position.x = l.seven;
      const on = (label, states) => {
        label.element.style.opacity = states.includes(name) ? '1' : '0';
      };
      on(lQueue, ['crowd-contention', 'crowd-airtime', 'ofdma-slices']);
      on(lTrip, ['crowd-contention']);
      on(lShare, ['crowd-airtime']);
      on(lSeats, ['ofdma-slices']);
      on(lQueue7, ['clinical-outcome']);
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        restart(name);
        live = animate && motionFull;
        if (!live) for (let t = 0; t < STILL_S; t += 1 / 30) for (const b of banks) step(b, 1 / 30);
        for (const b of banks) draw(b);
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
        if (mode === 'gen-compare') {
          reset(one, oneCapacity());
          labels.setText(one.titleLabel, oneTitle());
          if (!live) for (let t = 0; t < STILL_S; t += 1 / 30) step(one, 1 / 30);
          draw(one);
        }
        ctx.requestRender();
      },
      update(dt) {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
        if (!live || !dt) return;
        for (const b of banks) {
          if (!b.group.visible) continue;
          step(b, Math.min(dt, 0.1));
          draw(b);
        }
      },
      isIdle() {
        return !live;
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [0, 6, 14], target: [0, 1.8, 0.6] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
