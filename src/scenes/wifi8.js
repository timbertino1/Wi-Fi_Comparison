// What's next: the generation timeline continuing to Wi-Fi 8, drawn as a dashed outline because
// IEEE 802.11bn is still in development. No figures are shown.
const GENS = ['wifi6', 'wifi6e', 'wifi7'];

export default {
  id: 'wifi8',
  states: ['roadmap', 'reliability', 'outlook'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const motionFull = ctx.motion === 'full';
    const gen = (id) => ctx.generations.find((g) => g.id === id);

    // --- Timeline of pillars ending in a dashed Wi-Fi 8 outline.
    const timeline = new THREE.Group();
    scene.add(timeline);
    const pillars = GENS.map((id, i) => {
      const height = 1.6 + i * 0.6;
      const geometry = new THREE.CylinderGeometry(0.45, 0.45, height, 32);
      geometry.translate(0, height / 2, 0);
      const pillar = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: palette[id], roughness: 0.45 }));
      pillar.position.x = (i - 1.5) * 2.2;
      timeline.add(pillar);
      labels.add(pillar, gen(id)?.name ?? id, { className: 'big', offset: [0, height + 0.4, 0] });
      return pillar;
    });
    const w8Height = 1.6 + 3 * 0.6;
    const outlineGeometry = new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.45, 0.45, w8Height, 16, 4).translate(0, w8Height / 2, 0));
    const outline = new THREE.LineSegments(outlineGeometry, new THREE.LineDashedMaterial({ color: palette.wifi8, dashSize: 0.18, gapSize: 0.12 }));
    outline.computeLineDistances();
    outline.position.x = 1.5 * 2.2;
    outline.scale.y = 0.001;
    timeline.add(outline);
    const w8Label = labels.add(outline, `${gen('wifi8')?.name ?? 'Wi-Fi 8'} · in development`, { className: 'big', offset: [0, w8Height + 0.4, 0] });
    w8Label.element.style.opacity = '0';

    // --- Reliability illustration: one link through interference bursts.
    const reliability = new THREE.Group();
    scene.add(reliability);
    reliability.visible = false;
    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(-4.5, 2.4, 0);
    const device = kit.client('telemetry-monitor', { color: neutral.device });
    device.position.set(4.5, 0, 0);
    device.scale.setScalar(1.4);
    reliability.add(ap, device);
    const link7 = kit.linkBeam(new THREE.Vector3(-4.5, 2.25, -0.6), new THREE.Vector3(4.5, 1.2, -0.6), { color: palette.wifi7, arch: 1.2 });
    const link8Curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.5, 2.25, 0.8), new THREE.Vector3(0, 2.9, 0.8), new THREE.Vector3(4.5, 1.2, 0.8));
    const link8 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(link8Curve.getPoints(60)), new THREE.LineDashedMaterial({ color: palette.wifi8, dashSize: 0.2, gapSize: 0.12 }));
    link8.computeLineDistances();
    reliability.add(link7.mesh, link8);
    labels.add(link7.mesh, gen('wifi7')?.name ?? 'Wi-Fi 7', { className: 'muted', offset: [0, 2.1, -0.6] });
    const goalAnchor = new THREE.Object3D();
    goalAnchor.position.set(0, 3.4, 0.8);
    reliability.add(goalAnchor);
    labels.add(goalAnchor, `${gen('wifi8')?.name ?? 'Wi-Fi 8'} goal (illustrative)`, { className: 'muted' });
    const bursts = [-2, 0.5, 2.6].map((x) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), new THREE.MeshBasicMaterial({ color: '#c0392b', transparent: true, opacity: 0.25 }));
      b.position.set(x, 2.3, 0);
      reliability.add(b);
      return b;
    });

    let mode = 'roadmap';
    let time = 0;

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        timeline.visible = name !== 'reliability';
        reliability.visible = name === 'reliability';
        w8Label.element.style.opacity = name === 'reliability' ? '0' : '1';
        const cam = name === 'reliability' ? [0, 5, 12] : [0, 4.5, 12];
        await Promise.all([
          animateTo([[outline.scale, 'y', name === 'reliability' ? 0.001 : 1]], { durationMs: 1100, animate, signal, ease: ctx.easing.easeOutBack }),
          animateTo([[camera.position, 'x', cam[0]], [camera.position, 'y', cam[1]], [camera.position, 'z', cam[2]]], { durationMs: 900, animate, signal })
        ]);
        link7.mesh.material.opacity = 0.9;
        camera.lookAt(0, 1.6, 0);
        ctx.requestRender();
      },
      setGeneration() {},
      update(dt) {
        camera.lookAt(0, 1.6, 0);
        if (!motionFull) return;
        time += dt;
        if (mode === 'reliability') {
          // Interference pulses; the Wi-Fi 7 link flickers while the dashed goal link holds steady.
          bursts.forEach((b, i) => {
            const pulse = (Math.sin(time * 2 + i * 2) + 1) / 2;
            b.material.opacity = 0.1 + pulse * 0.35;
          });
          link7.mesh.material.opacity = 0.55 + 0.4 * Math.abs(Math.sin(time * 3.1));
        } else if (mode === 'outlook') {
          outline.material.opacity = 0.6 + 0.4 * Math.abs(Math.sin(time * 1.5));
          outline.material.transparent = true;
          pillars.at(-1).scale.y = 1;
        }
      },
      isIdle() {
        return !(motionFull && (mode === 'reliability' || mode === 'outlook'));
      },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
