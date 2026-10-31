// 6 GHz spectrum and 320 MHz channels, told as a highway: each band is a road leaving the access
// point, its width drawn to frequency scale; channels are lanes and devices are vehicles. Channel
// counts and widths come from claims (never literals). The 2.4 and 5 GHz edges set road widths for
// scale only; they are not presented as figures.
const ROAD_LENGTH = 15;
const ROAD_X0 = -6.5; // where the roads leave the access point
const MHZ = 0.0046; // scene units per MHz across a road
const GAP = 0.7; // space between roads

export default {
  id: 'spectrum',
  states: ['crowded-legacy', 'band-6ghz', 'channels-fill', 'gen-compare', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, seeded, claim } = ctx;
    const rand = seeded(11);
    const bandStart = claim('us-6ghz-band-start').value;
    const bandEnd = claim('us-6ghz-band-end').value;
    const width6 = bandEnd - bandStart;
    const motionFull = ctx.motion === 'full';
    let compareGen = 'wifi6e';
    let mode = 'crowded-legacy';

    // --- Roads, front (2.4 GHz) to back (6 GHz), each as wide as its band.
    const highway = new THREE.Group();
    scene.add(highway);
    const roadDefs = [
      { id: 'band-24', label: '2.4 GHz', mhz: 2484 - 2400, lane: 20 },
      { id: 'band-5', label: '5 GHz', mhz: 5895 - 5150, lane: 40 },
      { id: 'band-6', label: '6 GHz', mhz: width6, lane: null }
    ];
    let z = 3.2;
    const roads = roadDefs.map((d) => {
      const w = d.mhz * MHZ;
      const zc = z - w / 2;
      z -= w + GAP;
      const group = new THREE.Group(); // the road's surface and labels, shown or hidden together
      highway.add(group);
      const surface = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_LENGTH, 0.05, w),
        new THREE.MeshStandardMaterial({ color: d.id === 'band-6' ? palette.wifi7 : neutral.grid, transparent: true, opacity: d.id === 'band-6' ? 0.14 : 0.55, roughness: 0.9 })
      );
      surface.position.set(ROAD_X0 + ROAD_LENGTH / 2, 0, zc);
      group.add(surface);
      const labelAnchor = new THREE.Object3D();
      labelAnchor.position.set(ROAD_X0 + 0.9, 0.25, zc);
      group.add(labelAnchor);
      labels.add(labelAnchor, d.label, { className: 'big' });
      const anchor = new THREE.Object3D(); // hotspot anchor: the middle of the road
      anchor.position.set(ROAD_X0 + ROAD_LENGTH * 0.42, 0.3, zc);
      group.add(anchor);
      return { ...d, w, zc, surface, anchor, group };
    });
    const [road24, road5, road6] = roads;

    // The access point the roads leave from (also the chapter-transition anchor).
    const { group: hubAp } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    hubAp.position.set(ROAD_X0 - 1.2, 0.6, (road24.zc + road6.zc) / 2);
    highway.add(hubAp);

    // Lane dividers over a stretch of a road, one lane per `laneMHz` of its band.
    function dividers(road, laneMHz, x0, length) {
      const lanes = Math.floor(road.mhz / laneMHz);
      const laneWidth = laneMHz * MHZ;
      return kit.laneDividers({ lanes, laneWidth, top: road.zc + (lanes * laneWidth) / 2, x0, length });
    }

    // --- Traffic: one instanced fleet per road and vehicle kind; positions advance in update().
    function fleet({ count, color, length, height, laneWidth, laneZ, speed, x0, xLen, jam = 0 }) {
      const f = kit.fleet({ count, color, length, height, width: laneWidth * 0.72, x0, xLen, speed, rand, laneOf: laneZ, jam });
      highway.add(f.mesh);
      return f;
    }

    // Old bands: every lane busy; grey legacy trucks crawl and hold everyone else up.
    const lanes24 = dividers(road24, road24.lane, ROAD_X0, ROAD_LENGTH);
    const lanes5 = dividers(road5, road5.lane, ROAD_X0, ROAD_LENGTH);
    highway.add(lanes24.mesh, lanes5.mesh);
    const laneZ = (l) => (i) => l.laneZ(i % l.lanes);
    const oldTraffic = [
      fleet({ count: 18, color: palette.wifi6, length: 0.42, height: 0.16, laneWidth: lanes24.laneWidth, laneZ: laneZ(lanes24), speed: 0.35, x0: ROAD_X0, xLen: ROAD_LENGTH, jam: 0.5 }),
      fleet({ count: 6, color: neutral.device, length: 0.9, height: 0.26, laneWidth: lanes24.laneWidth, laneZ: laneZ(lanes24), speed: 0.22, x0: ROAD_X0, xLen: ROAD_LENGTH }),
      fleet({ count: 70, color: palette.wifi6, length: 0.42, height: 0.16, laneWidth: lanes5.laneWidth, laneZ: laneZ(lanes5), speed: 0.4, x0: ROAD_X0, xLen: ROAD_LENGTH, jam: 0.5 }),
      fleet({ count: 22, color: neutral.device, length: 0.9, height: 0.26, laneWidth: lanes5.laneWidth, laneZ: laneZ(lanes5), speed: 0.24, x0: ROAD_X0, xLen: ROAD_LENGTH })
    ];
    const legacyTruck = new THREE.Object3D(); // hotspot anchor that rides with one legacy truck
    highway.add(legacyTruck);

    // 6 GHz, step 3: the road split along its length into four stretches of 20, 80, 160 and 320 MHz.
    const fillGroup = new THREE.Group();
    fillGroup.visible = false;
    highway.add(fillGroup);
    const stretch = ROAD_LENGTH / 4;
    const fill = [20, 80, 160, 320].map((mhz, s) => {
      const x0 = ROAD_X0 + s * stretch;
      const d = dividers(road6, mhz, x0 + 0.08, stretch - 0.16);
      fillGroup.add(d.mesh);
      const count = claim(`us-6ghz-channels-${mhz}`).value;
      const anchor = new THREE.Object3D();
      anchor.position.set(x0 + stretch / 2, 0.5, road6.zc - road6.w / 2 - 0.45);
      fillGroup.add(anchor);
      const label = labels.add(anchor, `${count} × ${mhz} MHz`, { className: 'muted' });
      const cars = Math.min(d.lanes, mhz === 20 ? 30 : d.lanes * 2);
      const f = fleet({ count: cars, color: mhz === 320 ? palette.wifi7 : palette.wifi6e, length: mhz === 20 ? 0.3 : 0.55, height: 0.14 + (mhz / 320) * 0.14, laneWidth: d.laneWidth, laneZ: laneZ(d), speed: 1.4, x0, xLen: stretch });
      fillGroup.add(f.mesh);
      return { mhz, label, fleet: f, d };
    });
    const lane320 = new THREE.Object3D(); // hotspot anchor: one of the widest lanes
    lane320.position.set(ROAD_X0 + 3.5 * stretch, 0.35, fill[3].d.top - fill[3].d.laneWidth * 1.5);
    highway.add(lane320);

    // 6 GHz, step 4: the comparison generation's widest lanes beside Wi-Fi 7's, half the road each.
    const compareGroup = new THREE.Group();
    compareGroup.visible = false;
    highway.add(compareGroup);
    const heWidth = claim('he-max-width').value;
    const ehtWidth = claim('eht-max-width').value;
    const half = ROAD_LENGTH / 2;
    const cmpLanes = dividers(road6, heWidth, ROAD_X0 + 0.1, half - 0.2);
    const ehtLanes = dividers(road6, ehtWidth, ROAD_X0 + half + 0.1, half - 0.2);
    compareGroup.add(cmpLanes.mesh, ehtLanes.mesh);
    const cmpFleet = fleet({ count: cmpLanes.lanes * 2, color: palette[compareGen], length: 0.7, height: 0.22, laneWidth: cmpLanes.laneWidth, laneZ: laneZ(cmpLanes), speed: 1.1, x0: ROAD_X0, xLen: half });
    const ehtFleet = fleet({ count: ehtLanes.lanes * 2, color: palette.wifi7, length: 0.7, height: 0.3, laneWidth: ehtLanes.laneWidth, laneZ: laneZ(ehtLanes), speed: 1.1, x0: ROAD_X0 + half, xLen: half });
    compareGroup.add(cmpFleet.mesh, ehtFleet.mesh);
    const closed = new THREE.Mesh(new THREE.BoxGeometry(half - 0.2, 0.07, road6.w), new THREE.MeshStandardMaterial({ color: neutral.device, transparent: true, opacity: 0.55 }));
    closed.position.set(ROAD_X0 + half / 2, 0.03, road6.zc);
    compareGroup.add(closed);
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    const cmpAnchor = new THREE.Object3D();
    cmpAnchor.position.set(ROAD_X0 + half / 2, 0.6, road6.zc - road6.w / 2 - 0.45);
    const ehtAnchor = new THREE.Object3D();
    ehtAnchor.position.set(ROAD_X0 + half * 1.5, 0.6, road6.zc - road6.w / 2 - 0.45);
    compareGroup.add(cmpAnchor, ehtAnchor);
    const cmpLabel = labels.add(cmpAnchor, '', { className: 'big' });
    labels.add(ehtAnchor, `${genName('wifi7')}: ${ehtWidth} MHz`, { className: 'big' });
    function recolorCompare(genId) {
      const can6 = genId === 'wifi6e';
      cmpFleet.mesh.material.color.set(palette[genId]);
      cmpFleet.mesh.visible = can6;
      cmpLanes.mesh.visible = can6;
      closed.visible = !can6;
      labels.setText(cmpLabel, can6 ? `${genName(genId)}: ${heWidth} MHz` : `${genName(genId)}: cannot use 6 GHz`);
    }
    recolorCompare(compareGen);


    // --- Coverage through walls (illustrative), unchanged from the first version of this chapter.
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
    illustrative.position.set(0, 0.3, 2.6); // low between the walls, clear of the caption
    coverage.add(illustrative);
    labels.add(illustrative, 'Illustrative', { className: 'muted' });

    // --- Cameras per state, and anchors per state (cached; hidden objects omitted).
    const mid6 = ROAD_X0 + ROAD_LENGTH / 2;
    const cameras = {
      'crowded-legacy': { pos: [0.4, 7.2, 11.5], look: [0.6, 0, road5.zc + 0.6] },
      'band-6ghz': { pos: [0.6, 13, 10.5], look: [0.6, 0, (road24.zc + road6.zc) / 2] },
      'channels-fill': { pos: [mid6, 9.5, road6.zc + 9.5], look: [mid6, 0, road6.zc] },
      'gen-compare': { pos: [mid6, 8.5, road6.zc + 8.5], look: [mid6, 0, road6.zc] },
      'clinical-outcome': { pos: [0, 11, 7.5], look: [0, 0, 0] }
    };
    const anchorSets = {
      'crowded-legacy': { ap: hubAp, 'band-24': road24.anchor, 'band-5': road5.anchor, 'band-6': road6.anchor, 'legacy-truck': legacyTruck },
      'band-6ghz': { ap: hubAp, 'band-24': road24.anchor, 'band-5': road5.anchor, 'band-6': road6.anchor },
      'channels-fill': { ap: hubAp, 'band-6': road6.anchor, 'lane-320': lane320 },
      'gen-compare': { ap: hubAp, 'band-6': road6.anchor, 'lane-320': lane320 },
      'clinical-outcome': { ap }
    };
    const look = new THREE.Vector3();
    const lookTarget = { x: 0, y: 0, z: 0 };
    const truck = oldTraffic[3];

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const cam = cameras[name];
        const jobs = [animateTo([
          [camera.position, 'x', cam.pos[0]], [camera.position, 'y', cam.pos[1]], [camera.position, 'z', cam.pos[2]],
          [lookTarget, 'x', cam.look[0]], [lookTarget, 'y', cam.look[1]], [lookTarget, 'z', cam.look[2]]
        ], { durationMs: 1300, animate, signal })];

        const onCoverage = name === 'clinical-outcome';
        highway.visible = !onCoverage;
        coverage.visible = onCoverage;
        // The 6 GHz road is unlit while the old bands are jammed, then opens.
        jobs.push(animateTo([[road6.surface.material, 'opacity', name === 'crowded-legacy' ? 0.14 : 0.5]], { durationMs: 900, animate, signal }));
        jobs.push(animateTo([[road24.surface.material, 'opacity', name === 'crowded-legacy' ? 0.55 : 0.35], [road5.surface.material, 'opacity', name === 'crowded-legacy' ? 0.55 : 0.35]], { durationMs: 900, animate, signal }));
        // Steps 3–4 are about the 6 GHz road alone; the old roads leave the picture.
        const oldRoads = name === 'crowded-legacy' || name === 'band-6ghz';
        for (const f of oldTraffic) f.mesh.visible = oldRoads;
        lanes24.mesh.visible = lanes5.mesh.visible = road24.group.visible = road5.group.visible = oldRoads;
        fillGroup.visible = name === 'channels-fill';
        for (const s of fill) s.label.element.style.opacity = name === 'channels-fill' ? '1' : '0';
        compareGroup.visible = name === 'gen-compare';
        if (name === 'gen-compare') recolorCompare(compareGen);
        jobs.push(animateTo(rings.flatMap((r) => [[r.scale, 'x', onCoverage ? 1 : 0.001], [r.scale, 'y', onCoverage ? 1 : 0.001]]), { durationMs: 1200, animate, signal }));
        await Promise.all(jobs);
        this.update(0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        recolorCompare(genId);
        ctx.requestRender();
      },
      update(dt) {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
        if (motionFull && dt > 0) {
          if (mode === 'crowded-legacy' || mode === 'band-6ghz') for (const f of oldTraffic) f.advance(dt);
          if (mode === 'channels-fill') for (const s of fill) s.fleet.advance(dt);
          if (mode === 'gen-compare') for (const f of [cmpFleet, ehtFleet]) f.advance(dt);
        }
        const c = truck.cars[0];
        legacyTruck.position.set(truck.x0 + c.x, 0.5, c.z);
      },
      isIdle() {
        return !motionFull || mode === 'clinical-outcome';
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [0.6, 13, 10.5], target: [0.6, 0, (road24.zc + road6.zc) / 2] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
