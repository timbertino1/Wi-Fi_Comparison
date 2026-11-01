// Target Wake Time as one ward over one shift: a voice badge, a location tag and a patient monitor,
// each with its own battery, under the ward's access point. A shift bar fills across each step and
// the batteries drain with it: always listening, they go flat mid-shift; with agreed wake-ups they
// sleep in between and keep more charge. Restricted TWT (optional) adds a busy laptop that supports it
// and pauses for protected slots so the badge's call gets through. Battery levels are illustrative.
const DEVICES = [
  { id: 'badge', type: 'voice-badge', label: 'Voice badge', scale: 2.4, x: -4.4, awake: 1.55, twt: 0.6, offset: 0 },
  { id: 'tag', type: 'rtls-tag', label: 'Location tag', scale: 3, x: -1.6, awake: 1.2, twt: 0.5, offset: 0.035 },
  { id: 'monitor', type: 'telemetry-monitor', label: 'Patient monitor', scale: 1.5, x: 1.2, awake: 1.35, twt: 0.55, offset: 0.07 }
];
const WAKES = [0.1, 0.3, 0.5, 0.7, 0.9]; // agreed wake-ups, as fractions of the shift
const WAKE_LEN = 0.04;
const RUN_S = 9; // seconds for the shift bar to fill (full motion)
// Without live motion, each step settles on the moment that tells its story (mid-wake for groups and slots).
const STILL = { 'always-awake': 0.7, 'twt-schedule': 1, 'twt-sleep': 0.91, rtwt: 0.905, 'clinical-outcome': 1 };
const RED = '#c0392b';
const AMBER = '#d9a521';

export default {
  id: 'twt',
  states: ['always-awake', 'twt-schedule', 'twt-sleep', 'rtwt', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi5';
    let mode = 'always-awake';
    let progress = 1;
    const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
    const box = (w, h, d, color, extra) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
    const tag = (object, text, offset, className = 'muted') => {
      const l = labels.add(object, text, { className, offset });
      l.element.style.opacity = '0';
      return l;
    };
    const show = (l, on) => {
      const v = on ? '1' : '0';
      if (l.element.style.opacity !== v) l.element.style.opacity = v;
    };

    const floor = box(13, 0.06, 5, neutral.grid);
    floor.position.set(-0.4, -0.03, -0.3);
    scene.add(floor);
    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(-0.2, 3.5, -2);
    scene.add(ap);
    const apHalo = kit.glow({ color: palette.wifi7, size: 2.2, opacity: 0.6 });
    apHalo.position.copy(ap.position);
    scene.add(apHalo);
    const lGroup = tag(ap, 'One wake-up time for the whole group', [0, 0.7, 0]);

    // --- Each device: plinth, device, radio halo, link to the access point, battery and labels.
    const devices = DEVICES.map((d) => {
      const group = new THREE.Group();
      group.position.set(d.x, 0, 0);
      scene.add(group);
      const plinth = box(1.3, 0.5, 1, neutral.device);
      plinth.position.y = 0.25;
      const device = kit.client(d.type, { color: '#e9eef5' });
      device.scale.setScalar(d.scale);
      device.position.y = 0.5;
      group.add(plinth, device);
      const halo = kit.glow({ color: palette.wifi7, size: 1.8, opacity: 0.75 });
      halo.position.set(0, 1.1, 0.3);
      group.add(halo);
      const { mesh: beam } = kit.linkBeam(new THREE.Vector3(d.x, 1.3, 0), ap.position.clone().add(new THREE.Vector3(0, -0.15, 0)), { color: palette.wifi7, arch: 0.5, radius: 0.05 });
      scene.add(beam);

      // A battery standing above the device: dark case, cap and a fill that shrinks from the right.
      const battery = new THREE.Group();
      battery.position.set(0, 2.35, 0);
      group.add(battery);
      const shell = box(1.3, 0.56, 0.12, '#2b3442');
      const cap = box(0.1, 0.24, 0.1, '#2b3442');
      cap.position.x = 0.7;
      const fillGeometry = new THREE.BoxGeometry(1.16, 0.42, 0.14);
      fillGeometry.translate(0.58, 0, 0);
      const fill = new THREE.Mesh(fillGeometry, mat(palette.wifi7, { emissive: palette.wifi7, emissiveIntensity: 0.25 }));
      fill.position.x = -0.58;
      battery.add(shell, cap, fill);

      labels.add(battery, d.label, { className: 'big', offset: [0, 0.6, 0] });
      const status = labels.add(plinth, '', { className: 'muted', offset: [0, -0.55, 0.6] });
      return { ...d, group, device, halo, beam, fill, battery, status, statusText: '', level: 1, awakeNow: true };
    });
    const setStatus = (dev, text) => {
      if (dev.statusText === text) return;
      dev.statusText = text;
      labels.setText(dev.status, text);
    };
    const lFlat = tag(devices[0].battery, 'Dead before the shift ends', [0, 1.15, 0], 'big');

    // --- The busy laptop (Restricted TWT steps).
    const laptopGroup = new THREE.Group();
    laptopGroup.position.set(3.9, 0, 0);
    scene.add(laptopGroup);
    const laptopPlinth = box(1.5, 0.7, 1, neutral.device);
    laptopPlinth.position.y = 0.35;
    const laptop = kit.client('laptop', { color: '#e9eef5' });
    laptop.scale.setScalar(1.4);
    laptop.position.y = 0.7;
    laptopGroup.add(laptopPlinth, laptop);
    const lLaptop = labels.add(laptopGroup, 'Laptop downloading', { className: 'big', offset: [0.7, 1.9, 0] }); // a little right, clear of the monitor's battery
    let laptopText = 'Laptop downloading';
    const { mesh: laptopBeam } = kit.linkBeam(new THREE.Vector3(3.9, 1.3, 0), ap.position.clone().add(new THREE.Vector3(0, -0.15, 0)), { color: neutral.device, arch: 0.5, radius: 0.11 });
    scene.add(laptopBeam);
    const lCall = tag(devices[0].battery, 'Protected slot: the call goes through', [0, 1.15, 0]);
    const lCompare = tag(laptopGroup, '', [0.7, 1.35, 0]); // under the laptop's own label
    const compareText = () => `${genName(compareGen)}: no protected time slots`;

    // --- The shift bar along the front: it fills as the shift goes by.
    const SHIFT_W = 8.6;
    const shift = new THREE.Group();
    shift.position.set(-0.6, 0.12, 1.9);
    scene.add(shift);
    const track = box(SHIFT_W, 0.12, 0.4, '#d5dce6');
    const shiftGeometry = new THREE.BoxGeometry(SHIFT_W, 0.14, 0.42);
    shiftGeometry.translate(SHIFT_W / 2, 0, 0);
    const shiftFill = new THREE.Mesh(shiftGeometry, mat('#5b6b82'));
    shiftFill.position.x = -SHIFT_W / 2;
    shift.add(track, shiftFill);
    const shiftStart = new THREE.Object3D();
    shiftStart.position.set(-SHIFT_W / 2, 0, 0);
    const shiftEnd = new THREE.Object3D();
    shiftEnd.position.set(SHIFT_W / 2, 0, 0);
    shift.add(shiftStart, shiftEnd);
    labels.add(shiftStart, 'Start of shift', { className: 'muted', offset: [0, -0.4, 0] });
    labels.add(shiftEnd, 'End of shift', { className: 'muted', offset: [0, -0.4, 0] });
    const lLasts = tag(devices[1].battery, 'More charge left at shift end', [0, 1.15, 0], 'big');
    labels.add(shift, 'Battery levels are illustrative', { className: 'muted', offset: [0, -0.4, 0] });
    // Marks for the agreed wake-ups along the shift bar.
    const marks = WAKES.map((w) => {
      const m = box(0.08, 0.3, 0.46, palette.wifi7);
      m.position.set(-SHIFT_W / 2 + w * SHIFT_W, 0.08, 0);
      shift.add(m);
      return m;
    });

    const scheduled = () => mode !== 'always-awake';
    const group = () => mode === 'twt-sleep';
    const protectedSlots = () => mode === 'rtwt' || mode === 'clinical-outcome';
    const wakeAt = (dev, p) => {
      const offset = group() ? 0 : dev.offset;
      return WAKES.some((w) => p >= w + offset && p <= w + offset + WAKE_LEN);
    };
    const levelAt = (dev, p) => Math.max(0, 1 - (scheduled() ? dev.twt : dev.awake) * p);

    // Draw everything for a point in the shift (0 = start, 1 = end).
    function draw(p) {
      shiftFill.scale.x = Math.max(0.001, p);
      let anyWake = false;
      let slot = false;
      for (const dev of devices) {
        dev.level = levelAt(dev, p);
        const flat = dev.level <= 0.02;
        dev.fill.scale.x = Math.max(0.001, dev.level);
        dev.fill.material.color.set(dev.level > 0.5 ? palette.wifi7 : dev.level > 0.25 ? AMBER : RED);
        dev.fill.material.emissive.copy(dev.fill.material.color);
        const awake = !flat && (!scheduled() || wakeAt(dev, p));
        const sending = scheduled() && awake;
        anyWake ||= sending;
        if (dev.id === 'badge' && sending && protectedSlots()) slot = true;
        dev.halo.visible = awake;
        dev.beam.visible = sending;
        dev.device.material.emissive?.set(awake ? palette.wifi7 : '#000000');
        if (dev.device.material.emissiveIntensity !== undefined) dev.device.material.emissiveIntensity = awake ? 0.25 : 0;
        setStatus(dev, flat ? 'Flat: unreachable' : !scheduled() ? 'Always listening' : awake ? 'Awake' : 'Asleep');
      }
      apHalo.visible = group() && anyWake;
      laptopBeam.visible = protectedSlots() && !slot;
      show(lCall, slot);
      const text = slot ? 'Laptop paused: protected slot' : 'Laptop downloading';
      if (text !== laptopText) labels.setText(lLaptop, (laptopText = text));
      show(lFlat, mode === 'always-awake' && p > 0.6);
      show(lLasts, (mode === 'twt-schedule' || mode === 'clinical-outcome') && p > 0.95);
      show(lGroup, group());
    }

    const cameras = {
      'always-awake': { pos: [-1.6, 4.2, 10.5], look: [-1.6, 1.6, 0] },
      'twt-schedule': { pos: [-1.6, 4.2, 10.5], look: [-1.6, 1.6, 0] },
      'twt-sleep': { pos: [-1.6, 4.6, 10.5], look: [-1.6, 1.9, 0] },
      rtwt: { pos: [-0.2, 4.4, 11.5], look: [-0.2, 1.7, 0] },
      'clinical-outcome': { pos: [-0.2, 4.4, 11.5], look: [-0.2, 1.7, 0] }
    };
    const lookTarget = { x: -1.6, y: 1.6, z: 0 };
    const look = new THREE.Vector3();
    const byId = Object.fromEntries(devices.map((d) => [d.id, d.device]));
    const anchorSets = {
      'always-awake': { ap, badge: byId.badge, tag: byId.tag, monitor: byId.monitor, shift },
      'twt-schedule': { ap, badge: byId.badge, shift },
      'twt-sleep': { ap, tag: byId.tag },
      rtwt: { ap, badge: byId.badge, laptop },
      'clinical-outcome': { ap, badge: byId.badge, laptop }
    };

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const withLaptop = protectedSlots();
        laptopGroup.visible = withLaptop;
        if (!withLaptop) laptopBeam.visible = false;
        for (const m of marks) m.visible = scheduled();
        labels.setText(lCompare, compareText());
        show(lCompare, name === 'rtwt');
        // Full motion runs the shift live; otherwise show the end of the shift at once.
        progress = animate && motionFull ? 0 : STILL[name];
        draw(progress);
        if (progress < 1 && !(animate && motionFull)) progress = 1; // a still: no live run afterwards
        const cam = cameras[name];
        await animateTo([
          [camera.position, 'x', cam.pos[0]], [camera.position, 'y', cam.pos[1]], [camera.position, 'z', cam.pos[2]],
          [lookTarget, 'x', cam.look[0]], [lookTarget, 'y', cam.look[1]], [lookTarget, 'z', cam.look[2]]
        ], { durationMs: 1100, animate, signal });
        this.update(0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        labels.setText(lCompare, compareText());
        ctx.requestRender();
      },
      update(dt) {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
        if (progress >= 1 || !dt) return;
        progress = Math.min(1, progress + dt / RUN_S);
        draw(progress);
      },
      isIdle() {
        return progress >= 1;
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [-0.4, 5.5, 13.5], target: [-0.4, 1.5, 0] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
