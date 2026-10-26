// 6 GHz spectrum and 320 MHz channels. Band positions are drawn to frequency scale; channel counts
// and widths come from claims (never literals).
export default {
  id: 'spectrum',
  states: ['crowded-legacy', 'band-6ghz', 'channels-fill', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, seeded, claim } = ctx;
    const rand = seeded(11);
    const scale = kit.frequencyScale({ fromMHz: 2300, toMHz: 7225, width: 16 });
    const bandStart = claim('us-6ghz-band-start').value;
    const bandEnd = claim('us-6ghz-band-end').value;
    const firstEdge = claim('6ghz-ch1-lower-edge').value;
    let compareGen = 'wifi6e';

    // --- Bands (2.4 and 5 GHz edges are drawn for scale only; they are not presented as figures).
    const bandsGroup = new THREE.Group();
    scene.add(bandsGroup);
    const bandDefs = [
      { label: '2.4 GHz', start: 2400, end: 2484 },
      { label: '5 GHz', start: 5150, end: 5895 },
      { label: '6 GHz', start: bandStart, end: bandEnd }
    ];
    const bandMeshes = bandDefs.map((b) => {
      const mesh = kit.band({ startMHz: b.start, endMHz: b.end, scale, color: b.label === '6 GHz' ? palette.wifi7 : neutral.grid, depth: 5, opacity: 0.25 });
      bandsGroup.add(mesh);
      const anchor = new THREE.Object3D();
      anchor.position.set(mesh.position.x, 0, 3);
      bandsGroup.add(anchor);
      labels.add(anchor, b.label, { className: 'big' });
      return mesh;
    });

    // Crowded legacy channels in 2.4 and 5 GHz: tall overlapping blocks.
    const legacy = new THREE.Group();
    bandsGroup.add(legacy);
    const legacyBlocks = [];
    for (const [start, end, width, count] of [[2401, 2484, 20, 9], [5170, 5895, 40, 16]]) {
      for (let i = 0; i < count; i++) {
        const s = start + rand() * (end - start - width);
        const old = rand() < 0.55;
        const block = kit.channelBlock({ startMHz: s, widthMHz: width, scale, color: old ? neutral.device : palette.wifi6, height: 0.6 + rand() * 1.6, depth: 0.5 });
        block.position.z = -1.8 + rand() * 3.6;
        block.userData.h = block.scale.y;
        legacy.add(block);
        legacyBlocks.push(block);
      }
    }

    // 6 GHz channel rows: 20, 80, 160, 320 MHz.
    const rowsGroup = new THREE.Group();
    bandsGroup.add(rowsGroup);
    const rowDefs = [20, 80, 160, 320].map((width, r) => ({ width, count: claim(`us-6ghz-channels-${width}`).value, z: -1.8 + r * 1.2 }));
    const rows = rowDefs.map(({ width, count, z }) => {
      const blocks = Array.from({ length: count }, (_, i) => {
        const block = kit.channelBlock({ startMHz: firstEdge + i * width, widthMHz: width, scale, color: width === 320 ? palette.wifi7 : palette.wifi6e, height: 0.35, depth: 0.8 });
        block.position.z = z;
        block.scale.y = 0.001;
        rowsGroup.add(block);
        return block;
      });
      const anchor = new THREE.Object3D();
      anchor.position.set(scale.x(bandEnd) + 1.3, 0.3, z);
      rowsGroup.add(anchor);
      const label = labels.add(anchor, `${count} × ${width} MHz`, { className: 'muted' });
      label.element.style.opacity = '0';
      return { width, blocks, label };
    });

    // Generation comparison rows: widest channel per generation.
    const compareGroup = new THREE.Group();
    bandsGroup.add(compareGroup);
    const heWidth = claim('he-max-width').value;
    const ehtWidth = claim('eht-max-width').value;
    function compareRow(width, count, genId, z) {
      const group = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const block = kit.channelBlock({ startMHz: firstEdge + i * width, widthMHz: width, scale, color: palette[genId], height: 0.5, depth: 1.1 });
        group.add(block);
      }
      group.position.z = z;
      const anchor = new THREE.Object3D();
      anchor.position.set(scale.x(bandEnd) + 1.4, 0.4, 0);
      group.add(anchor);
      const genName = ctx.generations.find((g) => g.id === genId)?.name ?? genId;
      const label = labels.add(anchor, `${genName}: ${width} MHz`, { className: 'big' });
      compareGroup.add(group);
      return { group, label };
    }
    const rowCompare = compareRow(heWidth, claim('us-6ghz-channels-160').value, compareGen, -0.9);
    const rowWifi7 = compareRow(ehtWidth, claim('us-6ghz-channels-320').value, 'wifi7', 0.9);
    compareGroup.visible = false;

    // --- Coverage through walls (illustrative).
    const coverage = new THREE.Group();
    scene.add(coverage);
    coverage.visible = false;
    const room = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 8), new THREE.MeshStandardMaterial({ color: neutral.wall }));
    for (const x of [-4, 4]) {
      const wall = room.clone();
      wall.position.set(x, 0.6, 0);
      coverage.add(wall);
    }
    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(-6.5, 0.8, 0);
    coverage.add(ap);
    const rings = [
      { label: '2.4 GHz', radius: 11, color: neutral.grid },
      { label: '5 GHz', radius: 8.5, color: neutral.device },
      { label: '6 GHz', radius: 6.2, color: palette.wifi7 }
    ].map(({ label, radius, color }) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.08, radius, 96, 1, -Math.PI / 2.6, Math.PI / 1.3), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(ap.position);
      ring.position.y = 0.05;
      ring.scale.setScalar(0.001);
      coverage.add(ring);
      const anchor = new THREE.Object3D();
      anchor.position.set(ap.position.x + radius, 0.3, 0);
      coverage.add(anchor);
      labels.add(anchor, label, { className: 'muted' });
      return ring;
    });
    const illustrative = new THREE.Object3D();
    illustrative.position.set(0, 2.2, -3.5);
    coverage.add(illustrative);
    labels.add(illustrative, 'Illustrative', { className: 'muted' });

    function recolorCompare(genId) {
      for (const b of rowCompare.group.children) if (b.material) b.material.color.set(palette[genId]);
      const genName = ctx.generations.find((g) => g.id === genId)?.name ?? genId;
      if (genId === 'wifi5' || genId === 'wifi6') {
        rowCompare.group.visible = false;
        labels.setText(rowCompare.label, `${genName}: cannot use 6 GHz`);
        rowCompare.label.element.style.opacity = '1';
      } else {
        rowCompare.group.visible = true;
        labels.setText(rowCompare.label, `${genName}: ${heWidth} MHz`);
      }
    }
    recolorCompare(compareGen);

    const cameras = {
      'crowded-legacy': { pos: [0, 9, 16], look: [0, 0.3, 0] },
      'band-6ghz': { pos: [scale.x(6525), 6.5, 8.5], look: [scale.x(6525), 0.3, 0] },
      'channels-fill': { pos: [scale.x(6525) + 0.6, 7.5, 9], look: [scale.x(6525) + 0.6, 0.2, 0] },
      'gen-compare': { pos: [scale.x(6525) + 0.6, 6.5, 8], look: [scale.x(6525) + 0.6, 0.2, 0] },
      'clinical-outcome': { pos: [0, 11, 7.5], look: [0, 0, 0] }
    };
    const look = new THREE.Vector3();

    return {
      async setState(name, { animate = true, signal } = {}) {
        const cam = cameras[name];
        const jobs = [];
        const lookTarget = { x: look.x, y: look.y, z: look.z };
        jobs.push(animateTo([
          [camera.position, 'x', cam.pos[0]], [camera.position, 'y', cam.pos[1]], [camera.position, 'z', cam.pos[2]],
          [lookTarget, 'x', cam.look[0]], [lookTarget, 'y', cam.look[1]], [lookTarget, 'z', cam.look[2]]
        ], { durationMs: 1300, animate, signal }));
        const tick = () => { look.set(lookTarget.x, lookTarget.y, lookTarget.z); camera.lookAt(look); };
        this._tick = tick;

        const onCoverage = name === 'clinical-outcome';
        bandsGroup.visible = !onCoverage;
        coverage.visible = onCoverage;
        legacy.visible = name === 'crowded-legacy' || name === 'band-6ghz';
        jobs.push(animateTo(legacyBlocks.map((b) => [b.scale, 'y', name === 'crowded-legacy' ? b.userData.h : 0.25]), { durationMs: 800, animate, signal }));
        jobs.push(animateTo([[bandMeshes[2].material, 'opacity', name === 'crowded-legacy' ? 0.12 : 0.35]], { durationMs: 800, animate, signal }));

        const showRows = name === 'channels-fill';
        rowsGroup.visible = showRows || !animate ? showRows : rowsGroup.visible;
        rows.forEach((row, r) => {
          row.label.element.style.opacity = showRows ? '1' : '0';
          jobs.push(animateTo(row.blocks.map((b) => [b.scale, 'y', showRows ? 0.35 : 0.001]), { durationMs: 700, delayMs: showRows ? r * 450 : 0, animate, signal }));
        });
        compareGroup.visible = name === 'gen-compare';
        for (const row of [rowCompare, rowWifi7]) row.label.element.style.opacity = name === 'gen-compare' ? '1' : '0';
        if (name === 'gen-compare') recolorCompare(compareGen);

        jobs.push(animateTo(rings.map((r, i) => [r.scale, 'x', onCoverage ? 1 : 0.001]).concat(rings.map((r) => [r.scale, 'y', onCoverage ? 1 : 0.001])), { durationMs: 1200, animate, signal }));
        await Promise.all(jobs);
        rowsGroup.visible = showRows;
        tick();
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        recolorCompare(genId);
        ctx.requestRender();
      },
      update() {
        this._tick?.();
      },
      isIdle() {
        return true;
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
