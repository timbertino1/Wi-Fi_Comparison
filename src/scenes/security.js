// WPA2 handshake capture and offline guessing versus WPA3-SAE, per-session keys, and the Wi-Fi 7 /
// 6 GHz security gate.
const OBSERVER = '#c0392b';

export default {
  id: 'security',
  states: ['wpa2-capture', 'sae-exchange', 'session-keys', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi5';

    function lock(color) {
      const group = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.22), new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 }));
      group.add(body);
      const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 10, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#c8d2df', metalness: 0.6, roughness: 0.3 }));
      shackle.position.y = 0.2;
      group.add(shackle);
      return { group, body, shackle };
    }

    // --- Main stage: access point, device, observer.
    const main = new THREE.Group();
    scene.add(main);
    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(-4, 2.2, 0);
    ap.scale.setScalar(1.3);
    main.add(ap);
    const device = kit.client('infusion-pump', { color: neutral.device });
    device.position.set(-1, 0, 0);
    main.add(device);
    const { mesh: link } = kit.linkBeam(new THREE.Vector3(-4, 2.05, 0), new THREE.Vector3(-1, 1.3, 0), { color: palette.wifi7, arch: 0.6 });
    main.add(link);

    const observer = kit.client('laptop', { color: OBSERVER });
    observer.position.set(3.4, 0, 1.8);
    observer.scale.setScalar(1.4);
    main.add(observer);
    labels.add(observer, 'Eavesdropper', { className: 'muted', offset: [0, 1.1, 0] });

    const recording = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 14), new THREE.MeshStandardMaterial({ color: '#f5b041', emissive: '#f5b041', emissiveIntensity: 0.4 }));
    recording.position.set(-2.5, 1.9, 0);
    main.add(recording);
    const sealed = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial({ color: '#5f6b7c', roughness: 0.5 }));
    sealed.visible = false;
    main.add(sealed);

    const guessLock = lock('#8796ad');
    guessLock.group.position.set(3.4, 1.9, 1.8);
    main.add(guessLock.group);
    const guessLabel = labels.add(guessLock.group, '', { className: 'muted', offset: [0, 0.7, 0] });

    // Per-session locks for several devices.
    const sessions = new THREE.Group();
    main.add(sessions);
    const sessionColors = [palette.wifi7, '#5f6b7c', '#94a3b8'];
    const sessionDevices = ['voice-badge', 'infusion-pump', 'telemetry-monitor'].map((type, i) => {
      const d = kit.client(type, { color: neutral.device });
      d.position.set(-1.2 + i * 1.6, 0, -2.2);
      const l = lock(sessionColors[i]);
      l.group.position.set(d.position.x, 2.1, d.position.z);
      l.group.scale.setScalar(0.8);
      sessions.add(d, l.group);
      return { d, l };
    });

    // --- Gates for the generation comparison.
    const gates = new THREE.Group();
    scene.add(gates);
    function gate(x, genId) {
      const g = new THREE.Group();
      g.position.x = x;
      const material = new THREE.MeshStandardMaterial({ color: palette[genId], roughness: 0.5 });
      for (const dx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 0.25), material);
        post.position.set(dx, 1.2, 0);
        g.add(post);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.25, 0.25), material);
      beam.position.y = 2.4;
      g.add(beam);
      const label = labels.add(beam, '', { className: 'big', offset: [0, 0.5, 0] });
      gates.add(g);
      return { g, material, label };
    }
    const gateCompare = gate(-3.6, compareGen);
    const gateWifi7 = gate(3.6, 'wifi7');
    function traveller(x, z, text, color) {
      const d = kit.client('phone', { color });
      d.position.set(x, 0, z);
      d.scale.setScalar(1.6);
      labels.add(d, text, { className: 'muted', offset: [0, 1.3, 0] });
      gates.add(d);
      return d;
    }
    // Earlier generation: WPA2 and WPA3 devices both pass. Wi-Fi 7 / 6 GHz: WPA3 passes, WPA2 stopped.
    const wpa2Old = traveller(-4.2, -1.2, 'WPA2', neutral.device);
    const wpa3Old = traveller(-3.0, -1.2, 'WPA3', palette.wifi7);
    const wpa3New = traveller(3.6, -1.2, 'WPA3', palette.wifi7);
    const wpa2New = traveller(3.6, 2.2, 'WPA2', neutral.device);
    const stop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: OBSERVER }));
    stop.position.set(3.6, 0.9, 1.1);
    gates.add(stop);

    function setGateLabels() {
      labels.setText(gateCompare.label, genName(compareGen));
      labels.setText(gateWifi7.label, `${genName('wifi7')} · 6 GHz`);
      gateCompare.material.color.set(palette[compareGen]);
    }
    setGateLabels();

    let mode = 'wpa2-capture';
    let time = 0;

    const views = {
      'wpa2-capture': { main: true, cam: [0.3, 4.8, 9] },
      'sae-exchange': { main: true, cam: [0.3, 4.8, 9] },
      'session-keys': { main: true, cam: [0, 6.5, 10] },
      'gen-compare': { main: false, cam: [0, 10, 8] },
      'clinical-outcome': { main: true, cam: [0, 6.5, 10] }
    };

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const view = views[name];
        main.visible = view.main;
        gates.visible = !view.main;
        const jobs = [animateTo([[camera.position, 'x', view.cam[0]], [camera.position, 'y', view.cam[1]], [camera.position, 'z', view.cam[2]]], { durationMs: 1000, animate, signal })];

        const captured = name === 'wpa2-capture' || name === 'sae-exchange' || name === 'session-keys';
        recording.visible = name === 'wpa2-capture';
        sealed.visible = name === 'sae-exchange' || name === 'session-keys';
        sessions.visible = name === 'session-keys' || name === 'clinical-outcome';
        observer.visible = name !== 'clinical-outcome' || animate;
        guessLock.group.visible = captured;
        labels.setText(guessLabel, name === 'wpa2-capture' ? 'Offline guessing: cracked' : 'Offline guessing: nothing to test');

        if (name === 'wpa2-capture') {
          recording.position.set(-2.5, 1.9, 0);
          jobs.push(animateTo([[recording.position, 'x', 3.4], [recording.position, 'y', 1.2], [recording.position, 'z', 1.8]], { durationMs: 1600, animate, signal }));
        }
        if (sealed.visible) sealed.position.set(3.4, 1.0, 1.8);
        // Lock opens after cracking under WPA2; stays shut under WPA3.
        jobs.push(animateTo([[guessLock.shackle.position, 'y', name === 'wpa2-capture' ? 0.42 : 0.2], [guessLock.shackle.rotation, 'y', name === 'wpa2-capture' ? 1.2 : 0]], { durationMs: 900, delayMs: name === 'wpa2-capture' ? 1500 : 0, animate, signal }));
        if (name === 'clinical-outcome') {
          for (const { d, l } of sessionDevices) {
            d.position.z = 0.8;
            l.group.position.z = 0.8;
          }
          jobs.push(animateTo([[observer.scale, 'x', 0.001], [observer.scale, 'y', 0.001], [observer.scale, 'z', 0.001]], { durationMs: 1000, animate, signal }));
        } else {
          for (const { d, l } of sessionDevices) {
            d.position.z = -2.2;
            l.group.position.z = -2.2;
          }
          observer.scale.setScalar(1.4);
        }
        if (name === 'gen-compare') {
          setGateLabels();
          wpa2Old.position.z = -1.2;
          wpa3Old.position.z = -1.2;
          wpa3New.position.z = -1.2;
          jobs.push(animateTo([[wpa2Old.position, 'z', -3], [wpa3Old.position, 'z', -3], [wpa3New.position, 'z', -3], [wpa2New.position, 'z', 2.2]], { durationMs: 1400, animate, signal }));
        }
        await Promise.all(jobs);
        observer.visible = name !== 'clinical-outcome';
        camera.lookAt(0, 1, 0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        setGateLabels();
        ctx.requestRender();
      },
      update(dt) {
        camera.lookAt(0, 1, 0);
        if (!motionFull) return;
        time += dt;
        // The guessing lock spins while it is being attacked.
        if (mode === 'wpa2-capture' || mode === 'sae-exchange') guessLock.body.rotation.y = Math.sin(time * 12) * 0.25;
        for (const [i, { l }] of sessionDevices.entries()) l.group.rotation.y = Math.sin(time * 1.5 + i) * 0.4;
      },
      isIdle() {
        return !motionFull;
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
