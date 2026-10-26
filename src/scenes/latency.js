// Low and predictable latency: an alarm packet stuck behind bulk traffic, the three Wi-Fi 7 tools
// that clear its path, and illustrative delivery-time histograms (shape only, no figures).
const ALARM = '#c0392b';
const BARS = 18;

// Illustrative distribution shapes (relative heights only).
function shape(kind) {
  return Array.from({ length: BARS }, (_, i) => {
    if (kind === 'tight') return i <= 5 ? Math.exp(-((i - 2) ** 2) / 1.6) : 0;
    return Math.exp(-((i - 3) ** 2) / 4) * 0.85 + (i >= 5 ? 0.3 * Math.exp(-(i - 5) / 8) : 0);
  });
}

export default {
  id: 'latency',
  states: ['alarm-delay', 'latency-what', 'latency-tools', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi6';

    // --- Path: monitor → access point → nurses' station.
    const path = new THREE.Group();
    scene.add(path);
    const monitor = kit.client('telemetry-monitor', { color: neutral.device });
    monitor.position.set(-5, 0, 0);
    monitor.scale.setScalar(1.4);
    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(0, 2.6, 0);
    const station = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1), new THREE.MeshStandardMaterial({ color: neutral.device }));
    station.position.set(5, 0.4, 0);
    path.add(monitor, ap, station);
    labels.add(monitor, 'Bedside monitor', { className: 'muted', offset: [0, 1.4, 0] });
    labels.add(station, 'Nurses’ station', { className: 'muted', offset: [0, 0.8, 0] });
    const up = kit.linkBeam(new THREE.Vector3(-5, 1.2, 0), new THREE.Vector3(0, 2.45, 0), { color: palette.wifi7, arch: 0.5 });
    const down = kit.linkBeam(new THREE.Vector3(0, 2.45, 0), new THREE.Vector3(5, 0.9, 0), { color: palette.wifi7, arch: 0.5 });
    path.add(up.mesh, down.mesh);

    const bulk = Array.from({ length: 3 }, (_, i) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.45, 0.45), new THREE.MeshStandardMaterial({ color: neutral.device }));
      b.userData.t = 0.45 + i * 0.16;
      path.add(b);
      return b;
    });
    const alarm = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), new THREE.MeshStandardMaterial({ color: ALARM, emissive: ALARM, emissiveIntensity: 0.5 }));
    path.add(alarm);

    const tools = ['Multi-link', 'Restricted TWT', 'Multi-RU'].map((text, i) => {
      const anchor = new THREE.Object3D();
      anchor.position.set(-3 + i * 3, 4.2, 0);
      path.add(anchor);
      const label = labels.add(anchor, text, { className: 'big' });
      label.element.style.opacity = '0';
      return label;
    });

    // --- Histograms.
    function histogram(kind, genId) {
      const group = new THREE.Group();
      const heights = shape(kind);
      const bars = heights.map((h, i) => {
        const geometry = new THREE.BoxGeometry(0.32, 1, 0.5);
        geometry.translate(0, 0.5, 0);
        const bar = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: palette[genId] }));
        bar.position.x = (i - (BARS - 1) / 2) * 0.38;
        bar.userData.h = Math.max(0.001, h * 3);
        bar.visible = h > 0.01;
        bar.scale.y = 0.001;
        group.add(bar);
        return bar;
      });
      const axis = new THREE.Mesh(new THREE.BoxGeometry(BARS * 0.38, 0.03, 0.03), new THREE.MeshBasicMaterial({ color: neutral.grid }));
      group.add(axis);
      const fast = new THREE.Object3D();
      fast.position.set(-(BARS / 2) * 0.38, -0.35, 0.5);
      const slow = new THREE.Object3D();
      slow.position.set((BARS / 2) * 0.38, -0.35, 0.5);
      const titleAnchor = new THREE.Object3D();
      titleAnchor.position.set(0, 3.4, 0);
      group.add(fast, slow, titleAnchor);
      const labelEls = [
        labels.add(fast, 'Fast', { className: 'muted' }),
        labels.add(slow, 'Slow (tail)', { className: 'muted' }),
        labels.add(titleAnchor, genName(genId), { className: 'big' })
      ];
      scene.add(group);
      return { group, bars, labelEls };
    }
    const histCompare = histogram('tail', compareGen);
    const histWifi7 = histogram('tight', 'wifi7');
    const illustrative = new THREE.Object3D();
    illustrative.position.set(0, 4.6, 0);
    scene.add(illustrative);
    const illustrativeLabel = labels.add(illustrative, 'Illustrative — shape only, no measured values', { className: 'muted' });

    let mode = 'alarm-delay';
    let time = 0;

    function setHist(h, visible, x) {
      h.group.visible = visible;
      h.group.position.set(x, 0, 0);
      for (const l of h.labelEls) l.element.style.opacity = visible ? '1' : '0';
    }

    function placeAlarm(t) {
      const p = t < 0.5 ? up.curve.getPoint(t * 2) : down.curve.getPoint((t - 0.5) * 2);
      alarm.position.copy(p);
    }

    function placeBulk(blocked) {
      bulk.forEach((b, i) => {
        if (blocked) b.position.copy(up.curve.getPoint(0.55 + i * 0.14));
        else b.position.set(-1.5 + i * 1.2, 3.6, -1.6);
      });
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const onPath = name === 'alarm-delay' || name === 'latency-tools' || name === 'clinical-outcome';
        path.visible = onPath;
        const histMode = { 'latency-what': [true, false], 'gen-compare': [true, true], 'clinical-outcome': [false, true] }[name] ?? [false, false];
        if (name === 'clinical-outcome') {
          path.position.x = -3;
          setHist(histCompare, false, 0);
          setHist(histWifi7, true, 6.5);
        } else {
          path.position.x = 0;
          setHist(histCompare, histMode[0], histMode[1] ? -4.4 : 0);
          setHist(histWifi7, histMode[1], histMode[0] ? 4.4 : 0);
        }
        illustrativeLabel.element.style.opacity = histMode[0] || histMode[1] ? '1' : '0';
        for (const label of tools) label.element.style.opacity = name === 'latency-tools' ? '1' : '0';
        placeBulk(name === 'alarm-delay');
        placeAlarm(name === 'alarm-delay' ? 0.2 : 0.95);

        const jobs = [];
        for (const h of [histCompare, histWifi7]) {
          jobs.push(animateTo(h.bars.map((b) => [b.scale, 'y', h.group.visible ? b.userData.h : 0.001]), { durationMs: 1000, animate, signal }));
        }
        const cam = name === 'gen-compare' ? [0, 5.5, 14.5] : name === 'clinical-outcome' ? [0, 6.5, 14] : [0, 5.5, 12];
        jobs.push(animateTo([[camera.position, 'x', cam[0]], [camera.position, 'y', cam[1]], [camera.position, 'z', cam[2]]], { durationMs: 1000, animate, signal }));
        await Promise.all(jobs);
        camera.lookAt(0, 1.6, 0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        for (const b of histCompare.bars) b.material.color.set(palette[genId]);
        labels.setText(histCompare.labelEls[2], genName(genId));
        ctx.requestRender();
      },
      update(dt) {
        camera.lookAt(0, 1.6, 0);
        if (!motionFull || !path.visible) return;
        time += dt;
        if (mode === 'alarm-delay') {
          // The alarm creeps up behind the bulk traffic and waits.
          placeAlarm(Math.min(0.26, 0.05 + (time % 6) * 0.04));
        } else {
          placeAlarm((time * 0.35) % 1);
        }
      },
      isIdle() {
        return !(motionFull && path.visible);
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 66 : 46;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
