// Client density: a crowded emergency department and channel timelines showing contention (one
// device at a time), OFDMA (several per transmission) and Wi-Fi 7 multi-link.
const CROWD = 260;
const SLOTS = 9;
const SLOT_W = 0.9;

export default {
  id: 'density',
  states: ['crowd-contention', 'crowd-airtime', 'ofdma-slices', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, seeded } = ctx;
    const motionFull = ctx.motion === 'full';
    const rand = seeded(23);
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi5';

    // --- Floor with treatment bays and a crowd of devices (one instanced mesh, one draw call).
    const floor = new THREE.Group();
    scene.add(floor);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 7), new THREE.MeshStandardMaterial({ color: neutral.floor }));
    slab.position.y = -0.05;
    floor.add(slab);
    const bayMaterial = new THREE.MeshStandardMaterial({ color: neutral.wall, transparent: true, opacity: 0.6 });
    for (let i = 0; i < 6; i++) {
      for (const side of [-1, 1]) {
        const bay = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 2), bayMaterial);
        bay.position.set(-5.4 + i * 2.15, 0.02, side * 2.2);
        floor.add(bay);
      }
    }
    const crowd = kit.clientCrowd('dot', CROWD, { color: neutral.device });
    const m = new THREE.Matrix4();
    for (let i = 0; i < CROWD; i++) {
      m.makeTranslation(-6.6 + rand() * 13.2, 0, -3.2 + rand() * 6.4);
      crowd.setMatrixAt(i, m);
    }
    floor.add(crowd);
    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(0, 2.2, 0);
    floor.add(ap);

    // --- Channel timelines above the floor.
    const timelines = new THREE.Group();
    timelines.position.set(0, 3.6, -1.5);
    scene.add(timelines);
    const deviceShades = ['#7a8494', '#a7b4c8', '#5f6b7c', '#94a3b8', '#c3ccd8'];

    /** kind: 'single' (one device per slot, gaps between) or 'ofdma' (split into `ru` slices). */
    function channelTimeline({ kind, ru = 4, depth = 1.2, genId, z = 0 }) {
      const group = new THREE.Group();
      group.position.z = z;
      const blocks = [];
      const gaps = [];
      for (let s = 0; s < SLOTS; s++) {
        const x = (s - (SLOTS - 1) / 2) * SLOT_W;
        if (kind === 'single') {
          const block = new THREE.Mesh(new THREE.BoxGeometry(SLOT_W * 0.6, 0.3, depth), new THREE.MeshStandardMaterial({ color: palette[genId] }));
          block.position.set(x - SLOT_W * 0.15, 0, 0);
          const gap = new THREE.Mesh(new THREE.BoxGeometry(SLOT_W * 0.3, 0.05, depth), new THREE.MeshStandardMaterial({ color: '#c0392b', transparent: true, opacity: 0.6 }));
          gap.position.set(x + SLOT_W * 0.33, 0, 0);
          group.add(block, gap);
          blocks.push(block);
          gaps.push(gap);
        } else {
          for (let r = 0; r < ru; r++) {
            const slice = new THREE.Mesh(new THREE.BoxGeometry(SLOT_W * 0.92, 0.3, depth / ru - 0.04), new THREE.MeshStandardMaterial({ color: r === 0 ? palette[genId] : deviceShades[(r + s) % deviceShades.length] }));
            slice.position.set(x, 0, -depth / 2 + (r + 0.5) * (depth / ru));
            group.add(slice);
            blocks.push(slice);
          }
        }
      }
      const anchor = new THREE.Object3D();
      anchor.position.set(-(SLOTS / 2) * SLOT_W - 1.2, 0, 0);
      group.add(anchor);
      const label = labels.add(anchor, genName(genId), { className: 'big' });
      timelines.add(group);
      return { group, blocks, gaps, label };
    }

    const contention = channelTimeline({ kind: 'single', genId: compareGen });
    const ofdma = channelTimeline({ kind: 'ofdma', ru: 4, genId: 'wifi6' });
    const linkA = channelTimeline({ kind: 'ofdma', ru: 6, depth: 1.6, genId: 'wifi7', z: -0.95 });
    const linkB = channelTimeline({ kind: 'ofdma', ru: 6, depth: 1.6, genId: 'wifi7', z: 0.95 });
    labels.setText(linkB.label, `${genName('wifi7')} (second link)`);
    const airtimeAnchor = new THREE.Object3D();
    airtimeAnchor.position.set(0, 0.8, 0);
    timelines.add(airtimeAnchor);
    const airtimeLabel = labels.add(airtimeAnchor, 'Shaded: airtime lost to waiting', { className: 'muted' });

    const all = [contention, ofdma, linkA, linkB];
    let mode = 'crowd-contention';
    let time = 0;
    const lit = new THREE.Color(palette.wifi7);
    const idle = new THREE.Color(neutral.device);
    let servedPerTick = 1;
    let lastTick = -1;

    function show(list) {
      for (const t of all) {
        const on = list.includes(t);
        t.group.visible = on;
        t.label.element.style.opacity = on ? '1' : '0';
      }
    }

    function layout(name) {
      if (name === 'crowd-contention' || name === 'crowd-airtime') {
        show([contention]);
        contention.group.position.z = 0;
        servedPerTick = 1;
      } else if (name === 'ofdma-slices') {
        show([ofdma]);
        ofdma.group.position.z = 0;
        servedPerTick = 4;
      } else if (name === 'gen-compare') {
        const left = compareGen === 'wifi6' ? ofdma : contention;
        show([left, linkA, linkB]);
        left.group.position.z = -3;
        servedPerTick = 12;
      } else {
        show([linkA, linkB]);
        servedPerTick = 12;
      }
      airtimeLabel.element.style.opacity = name === 'crowd-airtime' ? '1' : '0';
      for (const g of contention.gaps) g.material.opacity = name === 'crowd-airtime' ? 0.95 : 0.45;
    }

    function lightCrowd(seed) {
      for (let i = 0; i < CROWD; i++) crowd.setColorAt(i, idle);
      for (let k = 0; k < servedPerTick; k++) crowd.setColorAt((seed * 37 + k * 53) % CROWD, lit);
      crowd.instanceColor.needsUpdate = true;
    }

    function recolor() {
      for (const b of contention.blocks) b.material.color.set(palette[compareGen]);
      labels.setText(contention.label, genName(compareGen));
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        layout(name);
        lightCrowd(0);
        const cam = name === 'gen-compare' ? [0, 10, 9] : [0, 8.5, 10.5];
        await animateTo([[camera.position, 'x', cam[0]], [camera.position, 'y', cam[1]], [camera.position, 'z', cam[2]]], { durationMs: 1000, animate, signal });
        camera.lookAt(0, 1.6, 0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        recolor();
        layout(mode);
        ctx.requestRender();
      },
      update(dt) {
        camera.lookAt(0, 1.6, 0);
        if (!motionFull) return;
        time += dt;
        const tick = Math.floor(time * 3);
        if (tick === lastTick) return;
        lastTick = tick;
        lightCrowd(tick);
        // Pulse the active slot in each visible timeline.
        for (const t of all) {
          if (!t.group.visible) continue;
          const per = t.blocks.length / SLOTS;
          t.blocks.forEach((b, i) => {
            b.scale.y = Math.floor(i / per) === tick % SLOTS ? 1.8 : 1;
          });
        }
      },
      isIdle() {
        return !motionFull;
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 66 : 46;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
