// Multi-Link Operation: one link that clogs versus several links that share the load, plus the four
// multi-link modes defined in 802.11be.
const BANDS = [
  { id: '6', label: '6 GHz', arch: 1.6, bend: -3.2 },
  { id: '5', label: '5 GHz', arch: 1.6, bend: 0 },
  { id: '2.4', label: '2.4 GHz', arch: 1.6, bend: 3.2 }
];
const VOICE = 6;
const BULK = 4;

export default {
  id: 'mlo',
  states: ['single-link-congested', 'what-is-mlo', 'links-aggregate', 'gen-compare', 'clinical-outcome', 'modes-compare'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi6e';

    const bulkMaterial = new THREE.MeshStandardMaterial({ color: neutral.device, roughness: 0.7 });

    /** A rig: access point, badge and one or more links with packets. */
    function makeRig(bandIds, genId) {
      const group = new THREE.Group();
      scene.add(group);
      const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette[genId] });
      ap.position.set(-4.2, 2.6, 0);
      ap.scale.setScalar(1.5);
      group.add(ap);
      const badge = kit.client('voice-badge', { color: palette[genId] });
      badge.scale.setScalar(2.2);
      badge.position.set(4.2, 0, 0);
      group.add(badge);

      const flows = BANDS.filter((b) => bandIds.includes(b.id)).map((band) => {
        const from = new THREE.Vector3(-4.2, 2.45, 0);
        const to = new THREE.Vector3(4.2, 1.1, 0);
        const { mesh, curve } = kit.linkBeam(from, to, { color: palette[genId], arch: band.arch, bend: band.bend, radius: 0.06 });
        mesh.material.opacity = 0.85;
        group.add(mesh);
        const anchor = new THREE.Object3D();
        anchor.position.copy(curve.getPoint(0.5));
        anchor.position.y += 0.35;
        group.add(anchor);
        const label = labels.add(anchor, band.label, { className: 'muted' });
        const voice = Array.from({ length: VOICE }, (_, i) => {
          const p = kit.packet({ color: palette[genId], size: 0.16 });
          p.userData.t = i / VOICE;
          group.add(p);
          return p;
        });
        const bulk = Array.from({ length: BULK }, (_, i) => {
          const p = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.32, 0.32), bulkMaterial);
          p.userData.t = i / BULK;
          p.visible = false;
          group.add(p);
          return p;
        });
        return { band, curve, mesh, voice, bulk, busy: false, label };
      });

      const title = labels.add(ap, genName(genId), { className: 'big', offset: [0, 0.9, 0] });
      return { group, ap, badge, flows, title, genId };
    }

    const single = makeRig(['5'], compareGen);
    const multi = makeRig(['6', '5', '2.4'], 'wifi7');

    function recolor(rig, genId) {
      const color = new THREE.Color(palette[genId]);
      rig.genId = genId;
      rig.badge.material.color.copy(color);
      for (const f of rig.flows) {
        f.mesh.material.color.copy(color);
        for (const p of f.voice) {
          p.material.color.copy(color);
          p.material.emissive.copy(color);
        }
      }
      labels.setText(rig.title, genName(genId));
    }
    recolor(single, compareGen);

    // --- Multi-link modes: four small panels.
    const modes = new THREE.Group();
    scene.add(modes);
    const MODE_NAMES = ['STR', 'NSTR', 'EMLSR', 'EMLMR'];
    const modePanels = MODE_NAMES.map((name, i) => {
      const panel = new THREE.Group();
      panel.position.x = (i - 1.5) * 3.4;
      modes.add(panel);
      const ap = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.18, 0.9), new THREE.MeshStandardMaterial({ color: '#f2f5f9' }));
      ap.position.set(0, 3, 0);
      const device = kit.client('phone', { color: palette.wifi7 });
      device.scale.setScalar(1.6);
      panel.add(ap, device);
      const beams = [-0.5, 0.5].map((dx) => {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 2.1, 10),
          new THREE.MeshBasicMaterial({ color: palette.wifi7, transparent: true, opacity: 0.25 })
        );
        beam.position.set(dx, 1.9, 0);
        beam.rotation.z = dx * 0.22;
        panel.add(beam);
        return beam;
      });
      labels.add(ap, name, { className: 'big', offset: [0, 0.6, 0] });
      return { panel, beams, name };
    });

    const groups = { single: single.group, multi: multi.group, modes };
    let mode = 'single-link-congested';
    let time = 0;

    function placeRigs(name) {
      // Positions/scales for each state: [x, scale, visible] per group.
      const layouts = {
        'single-link-congested': { single: [0, 1, true], multi: [0, 1, false], modes: [0, 1, false] },
        'what-is-mlo': { single: [0, 1, false], multi: [0, 1, true], modes: [0, 1, false] },
        'links-aggregate': { single: [0, 1, false], multi: [0, 1, true], modes: [0, 1, false] },
        'gen-compare': { single: [-5.2, 0.62, true], multi: [5.2, 0.62, true], modes: [0, 1, false] },
        'clinical-outcome': { single: [0, 1, false], multi: [0, 1, true], modes: [0, 1, false] },
        'modes-compare': { single: [0, 1, false], multi: [0, 1, false], modes: [0, 1, true] }
      };
      return layouts[name];
    }

    function setBusy(name) {
      single.flows[0].busy = name === 'single-link-congested' || name === 'gen-compare';
      for (const f of multi.flows) f.busy = f.band.id === '5' && ['links-aggregate', 'gen-compare', 'clinical-outcome'].includes(name);
    }

    function layoutPackets(rig, dt) {
      for (const f of rig.flows) {
        for (const p of f.bulk) {
          p.visible = f.busy;
          if (!f.busy) continue;
          p.userData.t = (p.userData.t + dt * 0.12) % 1;
          p.position.copy(f.curve.getPoint(p.userData.t));
        }
        f.voice.forEach((p, i) => {
          if (f.busy && rig === single) {
            // Voice packets pile up behind the bulk upload near the access point.
            const cap = 0.22 - i * 0.03;
            p.userData.t = Math.min(cap, p.userData.t + dt * 0.05);
            if (p.userData.t >= 0.999) p.userData.t = 0;
          } else if (f.busy) {
            p.visible = false; // in Wi-Fi 7 the voice traffic moves to the other links
            return;
          } else {
            p.userData.t = (p.userData.t + dt * 0.42) % 1;
          }
          p.visible = true;
          p.position.copy(f.curve.getPoint(Math.max(0, p.userData.t)));
        });
      }
    }

    function layoutModes(t) {
      // Activity patterns: bright = transmitting/receiving, dim = idle or listening.
      const phase = Math.floor(t / 1.4) % 2;
      const patterns = {
        STR: [1, 1],
        NSTR: phase ? [1, 0.2] : [0.2, 1],
        EMLSR: phase ? [1, 0.35] : [0.35, 1],
        EMLMR: phase ? [1, 0.7] : [0.7, 1]
      };
      for (const { beams, name } of modePanels) {
        const [a, b] = patterns[name];
        beams[0].material.opacity = a * 0.9;
        beams[1].material.opacity = b * 0.9;
      }
    }

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const layout = placeRigs(name);
        setBusy(name);
        const jobs = [];
        for (const [key, [x, s, visible]] of Object.entries(layout)) {
          const g = groups[key];
          if (visible) g.visible = true;
          jobs.push(animateTo([[g.position, 'x', x], [g.scale, 'x', visible ? s : 0.001], [g.scale, 'y', visible ? s : 0.001], [g.scale, 'z', visible ? s : 0.001]], { durationMs: 900, animate, signal }));
        }
        const cam = name === 'modes-compare' ? [0, 4.5, 13.5] : name === 'gen-compare' ? [0, 10, 16] : [0, 7, 11];
        jobs.push(animateTo([[camera.position, 'x', cam[0]], [camera.position, 'y', cam[1]], [camera.position, 'z', cam[2]]], { durationMs: 1000, animate, signal }));
        const done = await Promise.all(jobs);
        if (done.every(Boolean)) for (const [key, [, , visible]] of Object.entries(layout)) groups[key].visible = visible;
        layoutPackets(single, 0);
        layoutPackets(multi, 0);
        layoutModes(0);
        camera.lookAt(0, 1.4, 0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7' || !palette[genId]) return;
        compareGen = genId;
        recolor(single, genId);
        ctx.requestRender();
      },
      update(dt) {
        camera.lookAt(0, 1.4, 0);
        if (!motionFull) return;
        time += dt;
        if (mode === 'clinical-outcome') multi.flows[1].busy = Math.floor(time / 4) % 2 === 0;
        layoutPackets(single, dt);
        layoutPackets(multi, dt);
        layoutModes(time);
      },
      isIdle() {
        return !motionFull;
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 62 : 42;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
