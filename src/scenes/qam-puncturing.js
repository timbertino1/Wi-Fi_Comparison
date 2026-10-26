// 4K-QAM constellations, preamble puncturing around an interferer, and Multi-RU assignment.
const SLICES = 16; // 20 MHz subchannels in a 320 MHz channel
const BUSY = 5; // index of the slice with interference
const INTERFERENCE = '#c0392b';

export default {
  id: 'qam-puncturing',
  states: ['interferer', 'constellation-grow', 'puncture', 'ru-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, claim } = ctx;
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi6';

    // --- Constellations: one per generation, bits per subcarrier from claims.
    const constellations = new THREE.Group();
    scene.add(constellations);
    const qams = [
      { gen: 'wifi5', bits: claim('vht-256qam-bits').value },
      { gen: 'wifi6', bits: claim('he-1024qam-bits').value },
      { gen: 'wifi7', bits: claim('eht-4096qam-bits').value }
    ].map(({ gen, bits }, i) => {
      const order = 2 ** bits;
      const { mesh } = kit.constellation(order, { color: palette[gen], extent: 3.2, pointSize: order > 2000 ? 0.035 : undefined });
      mesh.position.set((i - 1) * 4.4, 0, 0);
      mesh.scale.set(1, 0.001, 1);
      constellations.add(mesh);
      const anchor = new THREE.Object3D();
      anchor.position.set(mesh.position.x, 0, 2.4);
      constellations.add(anchor);
      const label = labels.add(anchor, `${genName(gen)}: ${order}-QAM · ${bits} bits`, { className: 'big' });
      label.element.style.opacity = '0';
      return { mesh, label };
    });

    // --- Channel strip of 20 MHz slices.
    const strip = new THREE.Group();
    scene.add(strip);
    const sliceWidth = 0.78;
    const slices = Array.from({ length: SLICES }, (_, i) => {
      const geometry = new THREE.BoxGeometry(sliceWidth - 0.06, 1, 1.4);
      geometry.translate(0, 0.5, 0);
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: neutral.grid, transparent: true, opacity: 0.35 }));
      mesh.position.x = (i - (SLICES - 1) / 2) * sliceWidth;
      mesh.scale.y = 0.3;
      strip.add(mesh);
      return mesh;
    });
    const interferer = new THREE.Mesh(new THREE.BoxGeometry(sliceWidth - 0.06, 1.6, 1.6), new THREE.MeshStandardMaterial({ color: INTERFERENCE, emissive: INTERFERENCE, emissiveIntensity: 0.3 }));
    interferer.position.set(slices[BUSY].position.x, 0.8, 0);
    strip.add(interferer);
    labels.add(interferer, 'Interference', { className: 'muted', offset: [0, 1.2, 0] });
    const stripLabelAnchor = new THREE.Object3D();
    stripLabelAnchor.position.set(0, 2.4, 0);
    strip.add(stripLabelAnchor);
    const stripLabel = labels.add(stripLabelAnchor, '', { className: 'big' });

    // --- Resource-unit map: two rows, eight RUs each.
    const ruGroup = new THREE.Group();
    scene.add(ruGroup);
    const deviceShades = [palette.wifi7, '#7a8494', '#a7b4c8', '#4a5a70', '#94a3b8', '#5f6b7c', '#c3ccd8'];
    function ruRow(z, assignments, genId) {
      const row = new THREE.Group();
      row.position.z = z;
      assignments.forEach((device, i) => {
        const geometry = new THREE.BoxGeometry(1.1, 0.5, 1.1);
        geometry.translate(0, 0.25, 0);
        const color = device === 'busy' ? INTERFERENCE : device === null ? neutral.grid : device === 0 ? palette[genId] : deviceShades[device];
        const block = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, transparent: true, opacity: device === null ? 0.3 : 1 }));
        block.position.x = (i - 3.5) * 1.25;
        row.add(block);
      });
      const anchor = new THREE.Object3D();
      anchor.position.set(-6, 0.3, 0);
      row.add(anchor);
      const label = labels.add(anchor, genName(genId), { className: 'big' });
      ruGroup.add(row);
      return { row, label };
    }
    // Device 0 is the highlighted device. Wi-Fi 6: one RU per device. Wi-Fi 7: device 0 gets three non-adjacent RUs around a busy one.
    const ruCompare = ruRow(-1.1, [0, 1, 2, 3, 4, 5, 6, null], compareGen);
    const ruWifi7 = ruRow(1.1, [0, 1, 0, 'busy', 0, 2, 3, null], 'wifi7');
    const ruNote = new THREE.Object3D();
    ruNote.position.set(4.2, 0.2, 2.6);
    ruGroup.add(ruNote);
    labels.add(ruNote, 'Highlighted: one device', { className: 'muted' });

    function setSlices(lit, genId) {
      slices.forEach((s, i) => {
        const on = lit(i);
        s.material.color.set(on ? palette[genId] : neutral.grid);
        s.material.opacity = on ? 0.95 : 0.25;
      });
    }

    function recolorCompare(genId) {
      const color = palette[genId];
      ruCompare.row.children.forEach((b, i) => { if (i === 0 && b.material) b.material.color.set(color); });
      labels.setText(ruCompare.label, genName(genId));
    }

    const views = {
      interferer: { groups: ['strip'], cam: [0, 6, 10] },
      'constellation-grow': { groups: ['constellations'], cam: [0, 10, 10] },
      puncture: { groups: ['strip'], cam: [0, 6, 10] },
      'ru-compare': { groups: ['ru'], cam: [0, 7.5, 9] },
      'clinical-outcome': { groups: ['strip'], cam: [0, 7, 11] }
    };
    const groups = { strip, constellations, ru: ruGroup };

    return {
      async setState(name, { animate = true, signal } = {}) {
        const view = views[name];
        for (const [key, g] of Object.entries(groups)) g.visible = view.groups.includes(key);
        const jobs = [animateTo([[camera.position, 'x', view.cam[0]], [camera.position, 'y', view.cam[1]], [camera.position, 'z', view.cam[2]]], { durationMs: 1000, animate, signal })];

        if (name === 'interferer') {
          setSlices((i) => i < 4, compareGen); // fall back to an 80 MHz channel below the interference
          labels.setText(stripLabel, `${genName(compareGen)}: narrower channel`);
        } else if (name === 'puncture' || name === 'clinical-outcome') {
          setSlices((i) => i !== BUSY, 'wifi7');
          labels.setText(stripLabel, `${genName('wifi7')}: busy slice punctured`);
        }
        jobs.push(animateTo(slices.map((s) => [s.scale, 'y', s.material.opacity > 0.5 ? 1 : 0.3]), { durationMs: 700, animate, signal }));

        const showQam = name === 'constellation-grow';
        qams.forEach(({ mesh, label }, i) => {
          label.element.style.opacity = showQam ? '1' : '0';
          jobs.push(animateTo([[mesh.scale, 'y', showQam ? 1 : 0.001]], { durationMs: 700, delayMs: showQam ? i * 500 : 0, animate, signal, ease: ctx.easing.easeOutBack }));
        });
        for (const r of [ruCompare, ruWifi7]) r.label.element.style.opacity = name === 'ru-compare' ? '1' : '0';
        await Promise.all(jobs);
        camera.lookAt(0, 0.5, 0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        recolorCompare(genId);
        ctx.requestRender();
      },
      update() {
        camera.lookAt(0, 0.5, 0);
      },
      isIdle() {
        return true;
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 66 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
