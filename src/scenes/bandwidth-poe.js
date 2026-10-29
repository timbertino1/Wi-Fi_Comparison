// Bandwidth and PoE as a sprinkler system. Each access point is a sprinkler head on the ceiling,
// fed from the wiring closet by one pipe that carries both the water (data, the uplink) and the
// pressure (power, PoE). On an old 1 Gb/s port the pipe is thin and the spray weak; with a power
// budget below what the access point needs, some nozzles (radios) stay dry. Multi-gigabit ports and
// higher PoE classes open every nozzle. Peak rates are a "rated maximum" ghost spray. Figures shown
// come from claims; spray sizes are illustrative.
const POE = ['poe-type1-pse', 'poe-type2-pse', 'poe-type3-pse', 'poe-type4-pse'];
const PEAKS = { wifi4: 'wifi4-peak-phy', wifi5: 'wifi5-peak-phy', wifi6: 'wifi6-peak-phy', wifi7: 'wifi7-peak-phy' };
const GAUGE_H = 1.6;
const NEEDS = 0.62; // power the Wi-Fi 7 access point needs, as a fraction of the gauge (illustrative)
const DROPS = 10;
const RED = '#c0392b';

export default {
  id: 'bandwidth-poe',
  states: ['old-closet', 'peak-rates', 'wired-chain', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, claim } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    const fmt = (c) => `${c.value} ${c.unit}`;
    let compareGen = 'wifi6';
    let mode = 'old-closet';
    let time = 0;
    const WATER = '#4fb3e8';
    const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
    const box = (w, h, d, color, extra) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));
    const tag = (object, text, offset, className = 'muted') => {
      const l = labels.add(object, text, { className, offset });
      l.element.style.opacity = '0';
      return l;
    };
    const dropGeometry = new THREE.SphereGeometry(0.05, 6, 4);
    const tmp = new THREE.Matrix4();

    /** A sprinkler head (access point) with its nozzles, spray cones and falling drops. */
    function head(group, x, nozzles, ledColor) {
      const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor });
      ap.position.set(x, 3.4, 0);
      group.add(ap);
      const ring = nozzles === 1 ? [[0, 0]] : Array.from({ length: nozzles }, (_, i) => {
        const a = (i / nozzles) * Math.PI * 2 + Math.PI / 4;
        return [Math.cos(a) * 0.32, Math.sin(a) * 0.32];
      });
      const sprays = ring.map(([dx, dz]) => {
        const nozzle = box(0.1, 0.12, 0.1, neutral.device);
        nozzle.position.set(x + dx, 3.22, dz);
        const geometry = new THREE.ConeGeometry(0.55, 2.8, 20, 1, true);
        geometry.translate(0, -1.4, 0);
        const cone = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: WATER, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
        cone.position.set(x + dx, 3.16, dz);
        const ghostGeometry = new THREE.ConeGeometry(0.55, 2.8, 20, 1, true);
        ghostGeometry.translate(0, -1.4, 0);
        const ghost = new THREE.Mesh(ghostGeometry, new THREE.MeshBasicMaterial({ color: WATER, wireframe: true, transparent: true, opacity: 0.35 }));
        ghost.position.copy(cone.position);
        ghost.visible = false;
        const dry = box(0.12, 0.04, 0.12, RED, { emissive: RED, emissiveIntensity: 0.5 });
        dry.position.set(x + dx, 3.13, dz);
        group.add(nozzle, cone, ghost, dry);
        return { nozzle, cone, ghost, dry, strength: 1, x: x + dx, z: dz };
      });
      const drops = new THREE.InstancedMesh(dropGeometry, new THREE.MeshStandardMaterial({ color: WATER }), sprays.length * DROPS);
      group.add(drops);
      return { ap, sprays, drops };
    }

    /** One closet with a power gauge, and pipes up to one or more heads. */
    function supply({ heads, nozzles, ledColor }) {
      const group = new THREE.Group();
      scene.add(group);
      const floor = box(heads.at(-1) + 5.5, 0.04, 3, neutral.grid);
      floor.position.set((heads.at(-1) - 3) / 2, -0.02, 0);
      const closet = box(1.4, 2.2, 0.9, neutral.device);
      closet.position.set(-3, 1.1, 0);
      group.add(floor, closet);
      labels.add(closet, 'Wiring closet · switch', { className: 'muted', offset: [0, 1.5, 0] });
      const frame = box(0.34, GAUGE_H + 0.08, 0.06, '#d5dce6');
      frame.position.set(-3.35, 0.25 + GAUGE_H / 2, 0.5);
      const fillGeometry = new THREE.BoxGeometry(0.26, 1, 0.08);
      fillGeometry.translate(0, 0.5, 0);
      const fill = new THREE.Mesh(fillGeometry, mat('#e6b422', { emissive: '#e6b422', emissiveIntensity: 0.3 }));
      fill.position.set(-3.35, 0.25, 0.52);
      const need = box(0.5, 0.04, 0.1, RED);
      need.position.set(-3.35, 0.25 + NEEDS * GAUGE_H, 0.56);
      group.add(frame, fill, need);
      const gaugeAnchor = new THREE.Object3D();
      gaugeAnchor.position.set(-3.35, 0.25, 0.55);
      group.add(gaugeAnchor);
      const pipes = heads.map((hx) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.6, 2.2, 0), new THREE.Vector3(-2, 3.3, 0), new THREE.Vector3(hx - 0.8, 3.45, 0), new THREE.Vector3(hx, 3.5, 0)
        ]);
        const pipeMat = mat('#9aa6b8', { metalness: 0.3 });
        const thin = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.05, 8, false), pipeMat);
        const wide = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.17, 14, false), pipeMat);
        group.add(thin, wide);
        const packets = Array.from({ length: 8 }, (_, i) => {
          const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), mat(WATER, { emissive: WATER, emissiveIntensity: 0.3 }));
          p.userData.t = i / 8;
          group.add(p);
          return p;
        });
        const anchor = new THREE.Object3D();
        anchor.position.copy(curve.getPoint(0.45));
        group.add(anchor);
        return { curve, thin, wide, packets, anchor, head: head(group, hx, nozzles, ledColor) };
      });
      return { group, fill, need, gaugeAnchor, pipes, level: 0.3 };
    }

    const main = supply({ heads: [2.4, 5.4, 8.4], nozzles: 4, ledColor: palette.wifi7 });
    const older = supply({ heads: [2.4], nozzles: 2, ledColor: palette[compareGen] });

    // --- Labels.
    const oneGig = claim('gigabit-1');
    const multigig = claim('multigig-2-5-5');
    const tenGig = claim('multigig-10');
    const multiText = `${String(multigig.value).split('/')[0].trim()}–${tenGig.value} ${tenGig.unit}`;
    const first = main.pipes[0];
    const lPipe = tag(first.anchor, '', [-1.2, 0.45, 0]);
    const lPower = tag(main.gaugeAnchor, '', [-1.25, GAUGE_H / 2, 0]);
    const lHead = tag(first.head.ap, 'Wi-Fi 7 access point', [0, 0.65, 0], 'big');
    const lRated = tag(first.head.ap, '', [0, -3.4, 1.2], 'big');
    const lActual = tag(first.head.ap, 'Real devices get far less', [2.1, -1.4, 0]);
    const lOldRated = tag(first.head.ap, '', [0, -3.95, 1.2]);
    const lFloor = tag(main.pipes[1].head.ap, 'Every access point at full flow', [0, 0.65, 0], 'big');
    const lOlderTitle = tag(older.pipes[0].head.ap, '', [0, 0.65, 0], 'big');
    const lOlderPipe = tag(older.pipes[0].anchor, `${fmt(oneGig)} port: enough for its time`, [-1.2, 0.45, 0]);
    const ticks = POE.map((id) => {
      const c = claim(id);
      const anchor = new THREE.Object3D();
      anchor.position.set(-3.35, 0.25 + (c.value / 90) * GAUGE_H, 0.55);
      main.group.add(anchor);
      return tag(anchor, fmt(c), [0.55, 0, 0]);
    });
    const peak7 = claim(PEAKS.wifi7);
    const ratedText = () => `${genName(compareGen)} rated maximum: ${fmt(claim(PEAKS[compareGen]))}`;

    // Per state: pipe width, power level, spray strength per nozzle, and what is shown.
    function config(name) {
      if (name === 'old-closet') return { wide: false, level: 0.36, spray: [0.45, 0.45, 0, 0], heads: 1 };
      if (name === 'peak-rates') return { wide: true, level: 0.85, spray: [0.75, 0.75, 0.75, 0.75], heads: 1, ghost: true };
      if (name === 'clinical-outcome') return { wide: true, level: 0.85, spray: [1, 1, 1, 1], heads: 3 };
      return { wide: true, level: 0.85, spray: [1, 1, 1, 1], heads: 1 };
    }
    const layout = {
      'old-closet': { main: 0, older: null, cam: [0.6, 3.4, 9], look: [0.4, 2, 0] },
      'peak-rates': { main: 0, older: null, cam: [1.4, 3, 8.5], look: [1.6, 1.9, 0] },
      'wired-chain': { main: 0, older: null, cam: [0.4, 3.4, 9], look: [0.2, 2, 0] },
      'gen-compare': { main: 3.5, older: -5, cam: [0, 4.4, 14], look: [0, 2, 0] },
      'clinical-outcome': { main: -2.4, older: null, cam: [0.6, 4.8, 13], look: [0.6, 2, 0] }
    };
    const lookTarget = { x: 0.4, y: 2, z: 0 };
    const look = new THREE.Vector3();
    const anchorSets = {
      'old-closet': { ap: first.head.ap, pipe: first.anchor, power: main.gaugeAnchor },
      'peak-rates': { ap: first.head.ap },
      'wired-chain': { ap: first.head.ap, pipe: first.anchor, power: main.gaugeAnchor },
      'gen-compare': { ap: first.head.ap, pipe: older.pipes[0].anchor },
      'clinical-outcome': { ap: main.pipes[1].head.ap }
    };

    function applySpray(s, strength, ghost) {
      s.strength = strength;
      s.cone.visible = strength > 0;
      s.cone.scale.set(Math.max(0.001, strength), Math.max(0.001, 0.4 + 0.6 * strength), Math.max(0.001, strength));
      s.dry.visible = strength === 0;
      s.ghost.visible = !!ghost;
      if (ghost) s.ghost.scale.set(2.1, 1, 2.1);
    }

    function drawDrops(h) {
      let i = 0;
      for (const s of h.sprays) {
        for (let d = 0; d < DROPS; d++, i++) {
          if (s.strength === 0) {
            tmp.makeScale(0, 0, 0);
          } else {
            const f = (time * (0.5 + s.strength) + d / DROPS) % 1;
            const fall = f * 2.8 * (0.4 + 0.6 * s.strength);
            const a = d * 2.4;
            const r = f * 0.5 * s.strength;
            tmp.makeTranslation(s.x + Math.cos(a) * r, 3.1 - fall, s.z + Math.sin(a) * r);
          }
          h.drops.setMatrixAt(i, tmp);
        }
      }
      h.drops.instanceMatrix.needsUpdate = true;
    }
    function drawPackets(p, wide) {
      p.packets.forEach((pk, i) => {
        // A thin pipe bunches packets near the closet; a wide one keeps them flowing.
        const t = wide ? (time * 0.35 + i / p.packets.length) % 1 : Math.min(0.3, ((time * 0.35 + i / p.packets.length) % 1) * 0.35);
        pk.position.copy(p.curve.getPoint(t));
      });
    }
    function drawAll() {
      for (const s of [main, older]) {
        if (!s.group.visible) continue;
        for (const p of s.pipes) {
          if (!p.thin.visible && !p.wide.visible) continue;
          drawPackets(p, p.wide.visible);
          drawDrops(p.head);
        }
      }
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const c = config(name);
        const l = layout[name];
        main.group.visible = l.main !== null;
        older.group.visible = l.older !== null;
        if (l.main !== null) main.group.position.x = l.main;
        if (l.older !== null) older.group.position.x = l.older;
        for (const [i, p] of main.pipes.entries()) {
          const on = i < c.heads;
          p.thin.visible = on && !c.wide;
          p.wide.visible = on && c.wide;
          for (const pk of p.packets) pk.visible = on;
          p.head.ap.visible = on;
          p.head.drops.visible = on;
          for (const [n, s] of p.head.sprays.entries()) {
            applySpray(s, on ? c.spray[n] : 0, c.ghost && i === 0);
            s.nozzle.visible = on;
            if (!on) s.dry.visible = false;
          }
        }
        // The older generation's access point needs less power, so all its nozzles run on 1 Gb/s.
        const op = older.pipes[0];
        op.thin.visible = true;
        op.wide.visible = false;
        for (const s of op.head.sprays) applySpray(s, 0.6, false);
        older.need.position.y = 0.25 + 0.32 * GAUGE_H;

        labels.setText(lPipe, c.wide ? `Multi-gigabit port: ${multiText}` : `Old ${fmt(oneGig)} port: thin pipe`);
        labels.setText(lPower, c.level < NEEDS ? 'Power below what it needs: some radios off' : 'Enough power for every radio (PoE)');
        labels.setText(lRated, `Rated maximum: ${fmt(peak7)} (theoretical)`);
        labels.setText(lOldRated, ratedText());
        labels.setText(lOlderTitle, genName(compareGen));
        const on = (label, states) => {
          label.element.style.opacity = states.includes(name) ? '1' : '0';
        };
        on(lPipe, ['old-closet', 'wired-chain', 'gen-compare']);
        on(lPower, ['old-closet', 'wired-chain']);
        on(lHead, ['old-closet', 'wired-chain', 'gen-compare', 'peak-rates']);
        on(lRated, ['peak-rates']);
        on(lActual, ['peak-rates']);
        on(lOldRated, ['peak-rates']);
        on(lFloor, ['clinical-outcome']);
        on(lOlderTitle, ['gen-compare']);
        on(lOlderPipe, ['gen-compare']);
        for (const t of ticks) on(t, ['wired-chain']);

        drawAll();
        await Promise.all([
          animateTo([[main.fill.scale, 'y', c.level * GAUGE_H], [older.fill.scale, 'y', 0.5 * GAUGE_H]], { durationMs: 900, animate, signal }),
          animateTo([
            [camera.position, 'x', l.cam[0]], [camera.position, 'y', l.cam[1]], [camera.position, 'z', l.cam[2]],
            [lookTarget, 'x', l.look[0]], [lookTarget, 'y', l.look[1]], [lookTarget, 'z', l.look[2]]
          ], { durationMs: 1100, animate, signal })
        ]);
        this.update(0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        labels.setText(lOlderTitle, genName(genId));
        labels.setText(lOldRated, ratedText());
        ctx.requestRender();
      },
      update(dt) {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
        if (!motionFull || !dt) return;
        time += dt;
        drawAll();
      },
      isIdle() {
        return !motionFull;
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [0.6, 5, 14], target: [0.6, 2, 0] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
