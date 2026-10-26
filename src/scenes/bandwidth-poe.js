// Bandwidth, peak rates and PoE: the wired chain behind each access point, peak PHY rates drawn to
// linear scale from claims, and PoE classes at the switch port.
const PEAKS = [
  { gen: 'wifi4', claim: 'wifi4-peak-phy' },
  { gen: 'wifi5', claim: 'wifi5-peak-phy' },
  { gen: 'wifi6', claim: 'wifi6-peak-phy' },
  { gen: 'wifi7', claim: 'wifi7-peak-phy' }
];
const POE = ['poe-type1-pse', 'poe-type2-pse', 'poe-type3-pse', 'poe-type4-pse'];

export default {
  id: 'bandwidth-poe',
  states: ['old-closet', 'peak-rates', 'wired-chain', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, claim } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    const fmt = (c) => `${c.value} ${c.unit}`;
    let compareGen = 'wifi6';

    /** A switch → cable → access point chain with a power gauge. */
    function chain(genId, x) {
      const group = new THREE.Group();
      group.position.x = x;
      scene.add(group);
      const sw = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.2), new THREE.MeshStandardMaterial({ color: neutral.device }));
      sw.position.set(-2.5, 0.25, 0);
      const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette[genId] });
      ap.position.set(2.5, 3, 0);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.4, 0.4, 0), new THREE.Vector3(0.6, 0.6, 0), new THREE.Vector3(2.5, 1.6, 0), new THREE.Vector3(2.5, 2.85, 0)]);
      const cableMaterial = new THREE.MeshStandardMaterial({ color: palette[genId], transparent: true, opacity: 0.85 });
      const cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.07, 10, false), cableMaterial);
      const cableWide = new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.22, 16, false), cableMaterial);
      const gaugeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.4, 0.5), new THREE.MeshStandardMaterial({ color: neutral.grid, transparent: true, opacity: 0.35 }));
      gaugeFrame.position.set(-4.2, 1.2, 0);
      const fillGeometry = new THREE.BoxGeometry(0.42, 1, 0.42);
      fillGeometry.translate(0, 0.5, 0);
      const gauge = new THREE.Mesh(fillGeometry, new THREE.MeshStandardMaterial({ color: palette[genId] }));
      gauge.position.set(-4.2, 0, 0);
      gauge.scale.y = 1.2;
      group.add(sw, ap, cable, cableWide, gaugeFrame, gauge);
      labels.add(sw, 'Switch', { className: 'muted', offset: [0, 0.6, 0] });
      labels.add(gaugeFrame, 'PoE budget', { className: 'muted', offset: [0, 1.5, 0] });
      const cableLabel = labels.add(cable, '', { className: 'muted', offset: [0.6, 1.1, 0] });
      const title = labels.add(ap, genName(genId), { className: 'big', offset: [0, 0.8, 0] });
      const packets = Array.from({ length: 6 }, (_, i) => {
        const p = kit.packet({ color: palette[genId], size: 0.16 });
        p.userData.t = i / 6;
        group.add(p);
        return p;
      });
      return { group, cable, cableWide, cableMaterial, gauge, curve, packets, cableLabel, title, genId, wide: false };
    }

    const main = chain('wifi7', 0);
    const old = chain(compareGen, -5.5);
    old.group.visible = false;

    // --- Peak-rate towers (linear scale).
    const towers = new THREE.Group();
    scene.add(towers);
    const maxRate = claim('wifi7-peak-phy').value * 1000;
    const peakBars = PEAKS.map(({ gen, claim: id }, i) => {
      const c = claim(id);
      const mbps = c.unit === 'Gbps' ? c.value * 1000 : c.value;
      const height = Math.max(0.05, (mbps / maxRate) * 5.5);
      const geometry = new THREE.CylinderGeometry(0.55, 0.55, 1, 32);
      geometry.translate(0, 0.5, 0);
      const theoretical = gen === 'wifi7';
      const bar = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: palette[gen], transparent: theoretical, opacity: theoretical ? 0.45 : 1 }));
      bar.position.x = (i - 1.5) * 2.2;
      bar.scale.y = 0.001;
      bar.userData.h = height;
      towers.add(bar);
      const anchor = new THREE.Object3D();
      anchor.position.set(bar.position.x, i < 3 ? 0.9 + i * 0.8 : height + 0.5, 0);
      towers.add(anchor);
      const label = labels.add(anchor, `${genName(gen)}: ${fmt(c)}${theoretical ? ' (theoretical)' : ''}`, { className: 'big' });
      label.element.style.opacity = '0';
      return { bar, label };
    });
    const towerNote = new THREE.Object3D();
    towerNote.position.set(0, -0.5, 1.6);
    towers.add(towerNote);
    const towerLabel = labels.add(towerNote, 'Theoretical peak PHY rates, linear scale', { className: 'muted' });

    // --- PoE classes.
    const poe = new THREE.Group();
    poe.position.set(-8.6, 0, -2.5);
    scene.add(poe);
    const poeBars = POE.map((id, i) => {
      const c = claim(id);
      const height = (c.value / 90) * 3;
      const geometry = new THREE.BoxGeometry(0.55, 1, 0.55);
      geometry.translate(0, 0.5, 0);
      const bar = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: i >= 2 ? palette.wifi7 : neutral.device }));
      bar.position.x = i * 0.85;
      bar.scale.y = 0.001;
      bar.userData.h = height;
      poe.add(bar);
      const anchor = new THREE.Object3D();
      anchor.position.set(bar.position.x, height + 0.3, 0);
      poe.add(anchor);
      const label = labels.add(anchor, fmt(c), { className: 'muted' });
      label.element.style.opacity = '0';
      return { bar, label };
    });

    // --- Floor of access points for the outcome.
    const floor = new THREE.Group();
    scene.add(floor);
    floor.visible = false;
    const closet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.2), new THREE.MeshStandardMaterial({ color: neutral.device }));
    closet.position.set(-6, 0.6, 0);
    floor.add(closet);
    labels.add(closet, 'Wiring closet', { className: 'muted', offset: [0, 1, 0] });
    [[-2, -2], [1.5, 2], [4.5, -1.5], [6.5, 2.2]].forEach(([x, z]) => {
      const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
      ap.position.set(x, 2.4, z);
      floor.add(ap);
      const { mesh } = kit.linkBeam(new THREE.Vector3(-6, 1.1, 0), new THREE.Vector3(x, 2.3, z), { color: palette.wifi7, arch: 0.2, radius: 0.08 });
      floor.add(mesh);
    });

    const multigig = claim('multigig-2-5-5');
    const tenGig = claim('multigig-10');
    const oneGig = claim('gigabit-1');

    function setCable(c, wide, text) {
      c.wide = wide;
      c.cable.visible = !wide;
      c.cableWide.visible = wide;
      labels.setText(c.cableLabel, text);
    }

    let mode = 'old-closet';
    let time = 0;

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const chainVisible = name === 'old-closet' || name === 'wired-chain' || name === 'gen-compare';
        main.group.visible = chainVisible;
        old.group.visible = name === 'gen-compare';
        towers.visible = name === 'peak-rates';
        towerLabel.element.style.opacity = name === 'peak-rates' ? '1' : '0';
        poe.visible = name === 'wired-chain';
        floor.visible = name === 'clinical-outcome';

        const multiText = `${String(multigig.value).split('/')[0].trim()}–${tenGig.value} ${tenGig.unit}`;
        if (name === 'old-closet') setCable(main, false, `${oneGig.value} ${oneGig.unit}`);
        else setCable(main, true, multiText);
        setCable(old, false, `${oneGig.value} ${oneGig.unit}`);
        main.group.position.x = name === 'gen-compare' ? 4.5 : name === 'wired-chain' ? 1.5 : 0;
        old.group.position.x = -4.5;
        labels.setText(main.title, genName('wifi7'));

        const jobs = [
          animateTo([[main.gauge.scale, 'y', name === 'old-closet' ? 2.3 : 1.4]], { durationMs: 800, animate, signal }),
          animateTo([[old.gauge.scale, 'y', 0.9]], { durationMs: 800, animate, signal }),
          animateTo(peakBars.map(({ bar }) => [bar.scale, 'y', name === 'peak-rates' ? bar.userData.h : 0.001]), { durationMs: 1200, animate, signal }),
          animateTo(poeBars.map(({ bar }) => [bar.scale, 'y', name === 'wired-chain' ? bar.userData.h : 0.001]), { durationMs: 1000, animate, signal })
        ];
        for (const { label } of peakBars) label.element.style.opacity = name === 'peak-rates' ? '1' : '0';
        for (const { label } of poeBars) label.element.style.opacity = name === 'wired-chain' ? '1' : '0';
        const cam = name === 'peak-rates' ? [0, 5, 13] : name === 'gen-compare' ? [0, 6.5, 16] : name === 'clinical-outcome' ? [0, 9, 11] : [0, 5.5, 13.5];
        jobs.push(animateTo([[camera.position, 'x', cam[0]], [camera.position, 'y', cam[1]], [camera.position, 'z', cam[2]]], { durationMs: 1000, animate, signal }));
        await Promise.all(jobs);
        camera.lookAt(0, 1.6, 0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        old.cableMaterial.color.set(palette[genId]);
        old.gauge.material.color.set(palette[genId]);
        labels.setText(old.title, genName(genId));
        ctx.requestRender();
      },
      update(dt) {
        camera.lookAt(0, 1.6, 0);
        if (!motionFull) return;
        time += dt;
        for (const c of [main, old]) {
          if (!c.group.visible) continue;
          const wide = c.wide;
          c.packets.forEach((p, i) => {
            // Narrow cables bunch packets near the switch; wide ones keep them flowing.
            const t = wide ? (time * 0.3 + i / c.packets.length) % 1 : Math.min(0.25, ((time * 0.3 + i / c.packets.length) % 1) * 0.3);
            p.position.copy(c.curve.getPoint(t));
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
