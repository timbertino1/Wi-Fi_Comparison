// Data rates since Wi-Fi 6, told on the highway of the spectrum chapter: a road runs from the
// access point to an imaging cart, trucks carry an imaging study and small cars carry calls and
// messages. Wi-Fi 7 is faster for three reasons, each a change to the road: it gets wider (320 MHz
// channels), the trucks carry fuller loads (4096-QAM) and a second road opens (multi-link).
// Widths and peak rates come from claims (never literals); road sizes are drawn for scale only.
const ROAD_LENGTH = 14;
const ROAD_X0 = -6.5;
const LANE = 0.7; // one lane per 80 MHz, drawn for scale only
const Z_FRONT = 2.2;
const Z_BACK = -1.9;

export default {
  id: 'rates',
  states: ['rates-demand', 'rates-reasons', 'gen-compare'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo, seeded, claim } = ctx;
    const rand = seeded(23);
    const motionFull = ctx.motion === 'full';
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    const heWidth = claim('he-max-width').value;
    const ehtWidth = claim('eht-max-width').value;
    const peak = (id) => Number(claim(id).value.toFixed(1));
    let compareGen = 'wifi6e';
    let mode = 'rates-demand';

    const world = new THREE.Group();
    scene.add(world);

    // --- Roads: the front one is the earlier generation's width; it widens for Wi-Fi 7.
    function road(zc, mhz, color) {
      const group = new THREE.Group();
      world.add(group);
      const lanes = mhz / 80;
      const w = lanes * LANE;
      const surface = new THREE.Mesh(
        new THREE.BoxGeometry(ROAD_LENGTH, 0.05, w),
        new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.4, roughness: 0.9 })
      );
      surface.position.set(ROAD_X0 + ROAD_LENGTH / 2, 0, zc);
      const d = kit.laneDividers({ lanes, laneWidth: LANE, top: zc + w / 2, x0: ROAD_X0, length: ROAD_LENGTH });
      group.add(surface, d.mesh);
      const cart = kit.client('imaging-cart', { color: neutral.device });
      cart.position.set(ROAD_X0 + ROAD_LENGTH + 0.8, 0, zc);
      cart.scale.setScalar(1.3);
      group.add(cart);
      const mid = new THREE.Object3D();
      mid.position.set(ROAD_X0 + ROAD_LENGTH * 0.4, 0.3, zc);
      group.add(mid);
      return { group, surface, lanes: d, w, zc, cart, mid };
    }
    const narrow = road(Z_FRONT, heWidth, neutral.grid);
    const wide = road(Z_FRONT, ehtWidth, palette.wifi7);
    const second = road(Z_BACK, ehtWidth, palette.wifi7);
    const cmpRoad = road(Z_FRONT, heWidth, neutral.grid);
    const ehtRoad = road(Z_BACK, ehtWidth, palette.wifi7);

    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(ROAD_X0 - 1.4, 0.7, (Z_FRONT + Z_BACK) / 2);
    world.add(ap);

    // --- Traffic: imaging trucks and small cars for calls and messages.
    const laneOf = (r) => (i) => r.lanes.laneZ(i % r.lanes.lanes);
    function fleet(r, { count, color, length, height, speed, jam = 0 }) {
      const f = kit.fleet({ count, color, length, height, width: LANE * 0.72, x0: ROAD_X0, xLen: ROAD_LENGTH, speed, rand, laneOf: laneOf(r), jam });
      r.group.add(f.mesh);
      return f;
    }
    const truck = { length: 1.5, height: 0.28 };
    const full = { length: 1.5, height: 0.28 * 1.2 }; // loads drawn 1.2× taller, as bits per subcarrier rise from 10 to 12
    const fleets = {
      'rates-demand': [
        fleet(narrow, { count: 5, color: palette.wifi6, ...truck, speed: 0.32, jam: 0.3 }),
        fleet(narrow, { count: 12, color: neutral.device, length: 0.35, height: 0.14, speed: 0.3, jam: 0.6 })
      ],
      'rates-reasons': [
        fleet(wide, { count: 10, color: palette.wifi7, ...full, speed: 0.95 }),
        fleet(wide, { count: 10, color: neutral.device, length: 0.35, height: 0.14, speed: 1.0 }),
        fleet(second, { count: 8, color: palette.wifi7, ...full, speed: 0.95 })
      ],
      'gen-compare': [
        fleet(cmpRoad, { count: 5, color: palette[compareGen], ...truck, speed: 0.5 }),
        fleet(ehtRoad, { count: 10, color: palette.wifi7, ...full, speed: 1.15 })
      ]
    };
    const roadsFor = {
      'rates-demand': [narrow],
      'rates-reasons': [wide, second],
      'gen-compare': [cmpRoad, ehtRoad]
    };
    const allRoads = [narrow, wide, second, cmpRoad, ehtRoad];

    // --- Labels.
    const at = (x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); world.add(o); return o; };
    const reasonAnchors = {
      wider: at(ROAD_X0 + 2.2, 0.9, Z_FRONT + wide.w / 2 + 0.3),
      fuller: at(ROAD_X0 + ROAD_LENGTH * 0.55, 1.0, Z_FRONT),
      more: at(ROAD_X0 + 2.2, 0.9, Z_BACK - second.w / 2 - 0.2)
    };
    const reasonLabels = [
      labels.add(reasonAnchors.wider, `Wider road: ${ehtWidth} MHz`, { className: 'big' }),
      labels.add(reasonAnchors.fuller, 'Fuller trucks: 4096-QAM', { className: 'big' }),
      labels.add(reasonAnchors.more, 'More roads at once: multi-link', { className: 'big' })
    ];
    const demandLabel = labels.add(at(ROAD_X0 + ROAD_LENGTH * 0.5, 0.9, Z_FRONT - narrow.w / 2 - 0.3), 'Imaging study in transit', { className: 'big' });
    const cmpAnchor = at(ROAD_X0 + 2.6, 0.9, Z_FRONT + cmpRoad.w / 2 + 0.3);
    const ehtAnchor = at(ROAD_X0 + 2.6, 0.9, Z_BACK - ehtRoad.w / 2 - 0.2);
    const cmpLabel = labels.add(cmpAnchor, '', { className: 'big' });
    labels.add(ehtAnchor, `${genName('wifi7')}: up to ${peak('wifi7-peak-phy')} Gbps per link`, { className: 'big' });
    const theoretical = labels.add(at(ROAD_X0 + ROAD_LENGTH * 0.62, 0.3, (Z_FRONT + Z_BACK) / 2), 'Theoretical peaks, not floor speeds', { className: 'muted' });
    const groupLabels = { 'rates-demand': [demandLabel], 'rates-reasons': reasonLabels, 'gen-compare': [cmpLabel, theoretical] };
    const allLabels = Object.values(groupLabels).flat();
    // The Wi-Fi 7 peak label belongs to the comparison road's group so it hides with it.
    ehtRoad.group.add(ehtAnchor);

    function recolorCompare(genId) {
      fleets['gen-compare'][0].mesh.material.color.set(palette[genId]);
      // Wi-Fi 6E added spectrum, not a higher peak, so both earlier generations share one figure.
      labels.setText(cmpLabel, `${genName(genId)}: up to ${peak('wifi6-peak-phy')} Gbps`);
    }
    recolorCompare(compareGen);

    // A hotspot anchor that rides with the first imaging truck on the wide road.
    const truckAnchor = new THREE.Object3D();
    world.add(truckAnchor);

    const mid = ROAD_X0 + ROAD_LENGTH / 2;
    const cameras = {
      'rates-demand': { pos: [mid + 1, 7.5, Z_FRONT + 11], look: [mid + 1, 0, Z_FRONT - 0.6] },
      'rates-reasons': { pos: [mid, 9.5, 10.5], look: [mid, 0, 0] },
      'gen-compare': { pos: [mid, 9.5, 10.5], look: [mid, 0, 0] }
    };
    const anchorSets = {
      'rates-demand': { ap, cart: narrow.cart, road: narrow.mid },
      'rates-reasons': { ap, cart: wide.cart, road: wide.mid, trucks: truckAnchor },
      'gen-compare': { ap, cart: ehtRoad.cart, 'peak-wifi7': ehtAnchor }
    };
    const look = new THREE.Vector3();
    const lookTarget = { x: mid, y: 0, z: 0 };

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const cam = cameras[name];
        const job = animateTo([
          [camera.position, 'x', cam.pos[0]], [camera.position, 'y', cam.pos[1]], [camera.position, 'z', cam.pos[2]],
          [lookTarget, 'x', cam.look[0]], [lookTarget, 'y', cam.look[1]], [lookTarget, 'z', cam.look[2]]
        ], { durationMs: 1300, animate, signal });
        for (const r of allRoads) r.group.visible = roadsFor[name].includes(r);
        for (const l of allLabels) l.element.style.opacity = groupLabels[name].includes(l) ? '1' : '0';
        if (name === 'gen-compare') recolorCompare(compareGen);
        await job;
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
        if (motionFull && dt > 0) for (const f of fleets[mode]) f.advance(dt);
        const lead = fleets['rates-reasons'][0];
        const c = lead.cars[0];
        truckAnchor.position.set(lead.x0 + c.x, 0.6, c.z);
      },
      isIdle() {
        return !motionFull;
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [mid, 11, 12], target: [mid, 0, 0] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
