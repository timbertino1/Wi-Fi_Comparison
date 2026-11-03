// Multi-Link Operation: one link that clogs versus a connection with several links, where traffic moves
// to a free link without reconnecting, plus the four multi-link modes defined in 802.11be. The Wi-Fi 7
// rig shows STR across 5 and 6 GHz (presenter request, 2026-11-03): the badge sends on 6 GHz while it
// receives on 5 GHz, until an upload fills 5 GHz and the incoming voice moves to 6 GHz as well.
const BANDS = [
  { id: '6', label: '6 GHz', arch: 1.6, bend: -3.2, at: 0.4 },
  { id: '5', label: '5 GHz', arch: 1.6, bend: 0, at: 0.5 },
  { id: '2.4', label: '2.4 GHz', arch: 1.6, bend: 3.2, at: 0.6 }
];
const VOICE = 6;
const BULK = 4;
// The live band move (links-aggregate): seconds until the upload reaches 5 GHz, and until the call moves.
const UPLOAD_AT = 2.5;
const MOVE_AT = 4.5;

export default {
  id: 'mlo',
  states: ['single-link-congested', 'what-is-mlo', 'links-aggregate', 'gen-compare', 'clinical-outcome', 'modes-compare'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    const compareGen = 'wifi6e';

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
        anchor.position.copy(curve.getPoint(band.at)); // staggered so the three labels do not stack
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
        // Name the traffic: the grey blocks are an imaging upload, the small packets a voice call.
        const uploadAnchor = new THREE.Object3D();
        uploadAnchor.position.copy(curve.getPoint(0.3));
        uploadAnchor.position.y -= 0.5;
        group.add(uploadAnchor);
        const uploadLabel = labels.add(uploadAnchor, 'Imaging upload', { className: 'muted' });
        const voiceAnchor = new THREE.Object3D();
        group.add(voiceAnchor);
        const voiceLabel = labels.add(voiceAnchor, 'Voice call', { className: 'muted' });
        // The badge's own side of the call, travelling back to the access point (STR sends on one link
        // while receiving on another).
        const out = Array.from({ length: VOICE }, (_, i) => {
          const p = kit.packet({ color: palette[genId], size: 0.16 });
          p.userData.t = i / VOICE;
          p.visible = false;
          group.add(p);
          return p;
        });
        const outAnchor = new THREE.Object3D();
        outAnchor.position.copy(curve.getPoint(0.65));
        outAnchor.position.y += 0.45;
        group.add(outAnchor);
        const outLabel = labels.add(outAnchor, 'Voice out', { className: 'muted' });
        uploadLabel.element.style.opacity = voiceLabel.element.style.opacity = outLabel.element.style.opacity = '0';
        return { band, curve, mesh, voice, out, bulk, busy: false, active: true, sending: false, label, uploadLabel, voiceAnchor, voiceLabel, outLabel };
      });

      const title = labels.add(ap, genName(genId), { className: 'big', offset: [0, 0.9, 0] });
      const modeAnchor = new THREE.Object3D();
      modeAnchor.position.set(4.2, -0.9, 0);
      group.add(modeAnchor);
      const modeLabel = labels.add(modeAnchor, 'STR: sends on 6 GHz while receiving on 5 GHz', { className: 'muted' });
      modeLabel.element.style.opacity = '0';
      return { group, ap, badge, flows, title, genId, modeLabel };
    }

    const single = makeRig(['5'], compareGen);
    const multi = makeRig(['6', '5', '2.4'], 'wifi7');

    function recolor(rig, genId) {
      const color = new THREE.Color(palette[genId]);
      rig.genId = genId;
      rig.badge.material.color.copy(color);
      for (const f of rig.flows) {
        f.mesh.material.color.copy(color);
        for (const p of [...f.voice, ...f.out]) {
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
    // What each mode does, as behaviour rather than radio count.
    const MODE_NOTES = { STR: 'Both links at once', NSTR: 'Links in step', EMLSR: 'Listens on both, one at a time', EMLMR: 'Streams shift between links' };
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
      labels.add(device, MODE_NOTES[name], { className: 'muted', offset: [0, -0.05, 0.4] });
      return { panel, beams, name };
    });

    const groups = { single: single.group, multi: multi.group, modes };
    let mode = 'single-link-congested';
    let time = 0;
    let moveT = Infinity; // time into the live band move; Infinity shows its end

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

    // The long form names the upload; the small side-by-side keeps the short one.
    const busyText = (f, show) => (show ? `${f.band.label} · busy: imaging upload` : `${f.band.label} · busy`);
    /** Shows the traffic labels on a link: the upload while it is busy, the call where it travels. */
    function labelTraffic(f, { voice, waiting, show, text }) {
      f.uploadLabel.element.style.opacity = show && f.busy ? '1' : '0';
      f.voiceLabel.element.style.opacity = show && voice ? '1' : '0';
      labels.setText(f.voiceLabel, text ?? (waiting ? 'Voice call · waiting' : 'Voice call'));
      // A waiting call queues near the access point; a flowing one is labelled near the badge.
      f.voiceAnchor.position.copy(f.curve.getPoint(waiting ? 0.12 : 0.85));
      f.voiceAnchor.position.y += 0.45;
    }

    function setBusy(name) {
      // The side-by-side comparison is small, and the traffic was named in the steps before it.
      const show = name !== 'gen-compare';
      const old = single.flows[0];
      old.busy = name === 'single-link-congested' || name === 'gen-compare';
      labels.setText(old.label, old.busy ? busyText(old, show) : old.band.label);
      labelTraffic(old, { voice: true, waiting: old.busy, show });
      // In STR the badge sends its side of the call on 6 GHz while it receives the other side on 5 GHz.
      // The band move plays live: the upload fills 5 GHz, then the incoming voice moves to 6 GHz too.
      const live = name === 'links-aggregate';
      const congested = live ? moveT >= UPLOAD_AT : ['gen-compare', 'clinical-outcome'].includes(name);
      const moved = live ? moveT >= MOVE_AT : congested;
      for (const f of multi.flows) {
        const wasActive = f.active;
        f.busy = f.band.id === '5' && congested;
        f.active = f.band.id === (moved ? '6' : '5'); // receiving
        f.sending = f.band.id === '6';
        // Incoming voice that moves mid-step enters its new link at the access point, not along it.
        if (f.active && !wasActive && live && Number.isFinite(moveT)) f.voice.forEach((v, i) => { v.userData.t = -i / VOICE; });
        const used = f.active || f.sending;
        f.mesh.material.opacity = used || f.busy ? 0.85 : 0.3;
        // Say what each link is doing, so a dim link reads as connected, not off.
        labels.setText(f.label, f.busy ? busyText(f, show) : used ? f.band.label : `${f.band.label} · ready`);
        const both = f.active && f.sending;
        const text = f.busy && f.active ? 'Voice in · waiting' : both ? (live ? 'Voice both ways · moved from 5 GHz' : 'Voice both ways') : 'Voice in';
        labelTraffic(f, { voice: f.active, waiting: f.busy && f.active, show, text });
        f.outLabel.element.style.opacity = show && f.sending && !both ? '1' : '0';
      }
      multi.modeLabel.element.style.opacity = show && !moved ? '1' : '0';
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
          if (f.busy && f.active) {
            // Voice packets pile up behind the bulk upload near the access point.
            const cap = 0.22 - i * 0.03;
            p.userData.t = Math.min(cap, p.userData.t + dt * 0.05);
            if (p.userData.t >= 0.999) p.userData.t = 0;
          } else if (!f.active) {
            p.visible = false; // in Wi-Fi 7 the voice traffic moves to the free link
            return;
          } else {
            p.userData.t += dt * 0.42;
            if (p.userData.t < 0) {
              p.visible = false; // not yet sent on the new link
              return;
            }
            p.userData.t %= 1;
          }
          p.visible = true;
          p.position.copy(f.curve.getPoint(Math.max(0, p.userData.t)));
        });
        for (const p of f.out) {
          p.visible = f.sending;
          if (!f.sending) continue;
          p.userData.t = (p.userData.t + dt * 0.42) % 1;
          p.position.copy(f.curve.getPoint(1 - p.userData.t)); // badge to access point
        }
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

    // Close-ups aim a little higher, so the access point's title sits clear of the caption.
    const lookY = () => (mode === 'modes-compare' ? 2.4 : mode === 'gen-compare' ? 1.4 : 1.9);

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        // Full motion plays the band move live; a still or a settled step shows where it ends.
        moveT = name === 'links-aggregate' && animate && motionFull ? 0 : Infinity;
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
        camera.lookAt(0, lookY(), 0);
        ctx.requestRender();
      },
      update(dt) {
        camera.lookAt(0, lookY(), 0);
        if (!motionFull) return;
        time += dt;
        if (mode === 'links-aggregate' && moveT < MOVE_AT) {
          const before = moveT;
          moveT += dt;
          if ((before < UPLOAD_AT) !== (moveT < UPLOAD_AT) || moveT >= MOVE_AT) setBusy(mode);
          if (moveT >= MOVE_AT) ctx.cue('caption'); // the caption names the move as it happens
        }
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
