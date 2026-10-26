// Target Wake Time: always-awake radios versus scheduled wake windows, and Restricted TWT's
// protected service periods. Battery gauges are illustrative (no figures).
const ROWS = [
  { id: 'badge', label: 'Voice badge' },
  { id: 'tag', label: 'Location tag' },
  { id: 'monitor', label: 'Monitor' },
  { id: 'laptop', label: 'Laptop (busy)' }
];
const WINDOWS = [0.08, 0.33, 0.58, 0.83]; // wake windows as fractions of the timeline
const WINDOW_LEN = 0.07;

export default {
  id: 'twt',
  states: ['always-awake', 'twt-schedule', 'twt-sleep', 'rtwt', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    let compareGen = 'wifi5';

    const tl = kit.timeline({ length: 11, rows: ROWS.length, rowGap: 1.25, color: neutral.grid });
    tl.group.position.x = 0.8;
    scene.add(tl.group);

    // Per row: an always-awake bar, scheduled windows, and (for the laptop) long transmissions.
    const rows = ROWS.map((row, r) => {
      const awake = tl.segment({ row: r, start: 0, end: 1, color: palette[compareGen], awake: true });
      const windows = WINDOWS.map((w) => tl.segment({ row: r, start: w + r * 0.012, end: w + r * 0.012 + WINDOW_LEN, color: palette.wifi7, awake: true }));
      const sleep = tl.segment({ row: r, start: 0, end: 1, color: neutral.grid, awake: false });
      const anchor = new THREE.Object3D();
      anchor.position.set(tl.xAt(0) - 1.6 + 0.8, 0.2, tl.rowZ(r));
      scene.add(anchor);
      labels.add(anchor, row.label, { className: 'muted' });
      return { row, awake, windows, sleep };
    });
    const laptop = rows[3];
    // Laptop bursts: long transmissions that, under r-TWT, end before each protected period.
    const bursts = WINDOWS.map((w, i) => tl.segment({ row: 3, start: w - 0.2 + 0.02, end: w - 0.01, color: neutral.device, awake: true }));
    const overlap = WINDOWS.map((w) => tl.segment({ row: 3, start: w - 0.01, end: w + WINDOW_LEN, color: neutral.device, awake: true }));

    // Protected service periods (r-TWT).
    const periods = WINDOWS.map((w) => {
      const sp = tl.servicePeriod({ start: w, end: w + WINDOW_LEN + 0.04, color: palette.wifi7, opacity: 0.2 });
      sp.scale.y = 0.001;
      return sp;
    });
    const spAnchor = new THREE.Object3D();
    spAnchor.position.set(tl.xAt(WINDOWS[1] + 0.05) + 0.8, 1.4, -2.6);
    scene.add(spAnchor);
    const spLabel = labels.add(spAnchor, 'Protected slot (Restricted TWT)', { className: 'muted' });

    // Battery gauges (illustrative).
    const gauges = ROWS.slice(0, 3).map((row, r) => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.9), new THREE.MeshStandardMaterial({ color: neutral.grid }));
      frame.position.set(tl.xAt(1) + 1.6 + 0.8, 0, tl.rowZ(r));
      const fillGeometry = new THREE.BoxGeometry(0.4, 1, 0.8);
      fillGeometry.translate(0, 0.5, 0);
      const fill = new THREE.Mesh(fillGeometry, new THREE.MeshStandardMaterial({ color: palette.wifi7 }));
      fill.position.copy(frame.position);
      fill.scale.y = 0.2;
      scene.add(frame, fill);
      return fill;
    });
    const gaugeAnchor = new THREE.Object3D();
    gaugeAnchor.position.set(tl.xAt(1) + 2.4, 1.6, tl.rowZ(0) - 0.6);
    scene.add(gaugeAnchor);
    labels.add(gaugeAnchor, 'Battery (illustrative)', { className: 'muted' });

    // Playhead.
    const playhead = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.1, ROWS.length * 1.25), new THREE.MeshBasicMaterial({ color: palette.wifi7, transparent: true, opacity: 0.7 }));
    playhead.position.set(tl.xAt(0) + 0.8, 0.55, 0);
    scene.add(playhead);

    let mode = 'always-awake';
    let time = 0;

    function setVisible(list, visible) {
      for (const m of list) m.visible = visible;
    }

    function apply(name) {
      const awakeAll = name === 'always-awake';
      const scheduled = !awakeAll;
      const rtwt = name === 'rtwt' || name === 'clinical-outcome';
      for (const [r, row] of rows.entries()) {
        const isLaptop = r === 3;
        row.awake.visible = awakeAll && !isLaptop;
        row.awake.material.color.set(palette[compareGen]);
        row.sleep.visible = scheduled && !isLaptop;
        setVisible(row.windows, scheduled && !isLaptop);
      }
      // The laptop is busy in every state; without r-TWT its bursts run into the wake windows.
      laptop.sleep.visible = true;
      setVisible(bursts, true);
      setVisible(overlap, !rtwt);
      spLabel.element.style.opacity = rtwt ? '1' : '0';
      playhead.visible = name === 'twt-sleep' || name === 'clinical-outcome';
    }

    function recolor() {
      for (const row of rows) row.awake.material.color.set(palette[compareGen]);
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        apply(name);
        const level = name === 'always-awake' ? 0.25 : 0.85;
        const rtwt = name === 'rtwt' || name === 'clinical-outcome';
        const jobs = [
          animateTo(gauges.map((g) => [g.scale, 'y', level]), { durationMs: 1200, animate, signal }),
          animateTo(periods.map((p) => [p.scale, 'y', rtwt ? 1 : 0.001]), { durationMs: 800, animate, signal }),
          animateTo([[camera.position, 'x', 0], [camera.position, 'y', 8.5], [camera.position, 'z', 10.5]], { durationMs: 900, animate, signal })
        ];
        await Promise.all(jobs);
        camera.lookAt(0.8, 0, 0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        recolor();
        ctx.requestRender();
      },
      update(dt) {
        camera.lookAt(0.8, 0, 0);
        if (!motionFull || !playhead.visible) return;
        time += dt;
        const t = (time * 0.08) % 1;
        playhead.position.x = tl.xAt(t) + 0.8;
        for (const row of rows.slice(0, 3)) {
          for (const [i, w] of row.windows.entries()) {
            const inWindow = t >= WINDOWS[i] && t <= WINDOWS[i] + WINDOW_LEN + 0.03;
            w.scale.y = inWindow ? 1.6 : 1;
          }
        }
      },
      isIdle() {
        return !(motionFull && (mode === 'twt-sleep' || mode === 'clinical-outcome'));
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 66 : 46;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
