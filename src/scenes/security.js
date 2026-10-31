// Security as two doors on a ward: a shared-password keypad door (WPA2/WPA3-Personal) and a staff
// sign-in badge door (WPA2/WPA3-Enterprise), under the ward's access point. WPA2's weak points are
// shown first (a sign-in recorded and cracked away from the door; a device fooled by a fake access
// point), then how WPA3 closes each one, then the Wi-Fi 7 / 6 GHz rule of WPA3 sign-in, with a
// separate side door for older devices. The 192-bit option is left to the callout and tooltips.
// Everything moves on state changes; nothing animates per frame.
const OUTSIDER = '#c0392b';
const SEAL = '#d9a521';

export default {
  id: 'security',
  states: ['wpa2-risks', 'wpa3-personal', 'wpa3-enterprise', 'wpa3-only', 'clinical-outcome'],

  create(ctx) {
    const { three: THREE, scene, camera, kit, palette, neutral, labels, animateTo } = ctx;
    const genName = (id) => ctx.generations.find((g) => g.id === id)?.name ?? id;
    let compareGen = 'wifi5';
    let mode = 'wpa2-risks';
    const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...extra });
    const box = (w, h, d, color, extra) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, extra));

    function lock(color) {
      const group = new THREE.Group();
      const body = box(0.42, 0.34, 0.2, color, { metalness: 0.2 });
      group.add(body);
      const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 10, 24, Math.PI), mat('#c8d2df', { metalness: 0.6, roughness: 0.3 }));
      shackle.position.y = 0.17;
      group.add(shackle);
      return { group, body, shackle };
    }
    // --- The ward wall with two doors and the access point above them.
    const ward = new THREE.Group();
    scene.add(ward);
    const wall = box(15, 2.6, 0.2, neutral.wall);
    wall.position.set(0, 1.3, -1.1);
    ward.add(wall);
    function door(x, label) {
      const group = new THREE.Group();
      group.position.set(x, 0, -0.98);
      const frame = box(1.5, 2.1, 0.06, neutral.device);
      frame.position.y = 1.05;
      const panel = box(1.3, 1.95, 0.08, '#e9eef5');
      panel.position.set(0, 0.98, 0.03);
      group.add(frame, panel);
      ward.add(group);
      const sign = new THREE.Object3D();
      sign.position.set(0, 2.45, 0.2);
      group.add(sign);
      const signLabel = labels.add(sign, label, { className: 'big' });
      return { group, panel, sign, signLabel };
    }
    const personalDoor = door(-3, 'Shared password · Personal');
    const enterpriseDoor = door(3, 'Staff sign-in · Enterprise');
    const keypad = box(0.32, 0.44, 0.08, neutral.device);
    keypad.position.set(-1.9, 1.2, -0.9);
    const reader = box(0.32, 0.44, 0.08, neutral.device);
    reader.position.set(4.1, 1.2, -0.9);
    ward.add(keypad, reader);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 24), mat(SEAL, { metalness: 0.5 }));
    seal.rotation.x = Math.PI / 2;
    seal.position.set(4.1, 1.62, -0.84);
    ward.add(seal);
    const { group: ap } = kit.accessPoint({ color: '#f2f5f9', ledColor: palette.wifi7 });
    ap.position.set(0, 2.85, -0.55);
    ap.scale.setScalar(0.9);
    ward.add(ap);

    // --- Devices at each door, each with the key it gets for its session.
    const pump = kit.client('infusion-pump', { color: neutral.device });
    pump.scale.setScalar(0.8);
    pump.position.set(-3, 0, 1.1);
    const workstation = kit.client('workstation-cart', { color: neutral.device });
    workstation.scale.setScalar(0.8);
    workstation.position.set(3, 0, 1.1);
    ward.add(pump, workstation);
    const pumpKey = lock(palette.wifi7);
    pumpKey.group.position.set(-3, 1.75, 1.1);
    const stationKey = lock('#5b8def');
    stationKey.group.position.set(3, 1.75, 1.1);
    ward.add(pumpKey.group, stationKey.group);
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 6), mat(palette.wifi7, { transparent: true, opacity: 0.85 }));
    shield.rotation.x = Math.PI / 2;
    shield.position.set(1.6, 2.2, 0.3);
    ward.add(shield);

    // --- The outsider, the recording they take away, and the desk where they guess.
    const outsider = new THREE.Group();
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 12), mat(OUTSIDER));
    torso.position.y = 0.6;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(OUTSIDER));
    head.position.y = 1.32;
    outsider.add(torso, head);
    outsider.position.set(-5.3, 0, 1.6);
    ward.add(outsider);
    const desk = box(1.3, 0.08, 0.7, neutral.device);
    desk.position.set(-5.3, 0.75, 3.3);
    ward.add(desk);
    const recording = box(0.34, 0.24, 0.24, SEAL, { emissive: SEAL, emissiveIntensity: 0.25 });
    ward.add(recording);
    const atKeypad = new THREE.Vector3(-1.9, 1.2, -0.7);
    const atDesk = new THREE.Vector3(-5.3, 0.95, 3.3);
    const deskLock = lock(neutral.device);
    deskLock.group.position.set(-5.3, 1.5, 3.3);
    ward.add(deskLock.group);

    // --- The fake access point that a WPA2-Enterprise device can be fooled by.
    const fake = new THREE.Group();
    const { group: fakeAp } = kit.accessPoint({ color: '#f6d6d2', ledColor: OUTSIDER });
    fakeAp.scale.setScalar(0.7);
    fakeAp.position.y = 1.9;
    const post = box(0.08, 1.9, 0.08, OUTSIDER);
    post.position.y = 0.95;
    fake.add(post, fakeAp);
    fake.position.set(1.1, 0, 2.3);
    ward.add(fake);
    const { mesh: fakeLink } = kit.linkBeam(new THREE.Vector3(2.8, 1.3, 1.2), new THREE.Vector3(1.1, 1.9, 2.3), { color: OUTSIDER, arch: 0.4 });
    const { mesh: realLink } = kit.linkBeam(new THREE.Vector3(3, 1.3, 1.1), new THREE.Vector3(0.2, 2.7, -0.5), { color: palette.wifi7, arch: 0.6 });
    ward.add(fakeLink, realLink);

    // --- The side door for older devices, and an older device sent to it.
    const sideDoor = door(6.4, 'Older devices · one migration option');
    sideDoor.group.scale.setScalar(0.8);
    // Its sign rides above the wall, clear of the staff door's sign beside it.
    sideDoor.sign.position.y = 4;
    const oldDevice = kit.client('phone', { color: neutral.device });
    oldDevice.scale.setScalar(0.9);
    ward.add(oldDevice);
    const oldAtMain = new THREE.Vector3(1.6, 0, 1.8);
    const oldAtSide = new THREE.Vector3(6.4, 0, 0.9);

    // --- Labels, shown per state.
    const tag = (object, text, offset, className = 'muted') => {
      const l = labels.add(object, text, { className, offset });
      l.element.style.opacity = '0';
      return l;
    };
    const lOutsider = tag(outsider, 'Outsider', [0, 1.75, 0]);
    // The desk's labels sit below it, in front, so they clear the outsider's label and the slide edge.
    const lCracked = tag(deskLock.group, 'Recorded sign-in, cracked at a desk', [1, -1.25, 0.4]);
    const lSealed = tag(deskLock.group, 'Recording is useless: nothing to test', [1, -1.25, 0.4]);
    const lLive = tag(keypad, 'Every guess must be live, at the door', [1.1, -0.75, 0.3]);
    const lFake = tag(fake, 'Fake access point', [0, 2.6, 0]);
    const lCert = tag(seal, 'Device checks the certificate', [1.4, 0.05, 0.3]);
    const lShield = tag(shield, 'Control messages protected', [0, 0.75, 0]);
    const lKeys = tag(pumpKey.group, 'Each device gets its own key', [0, 0.45, 0]);
    const lOnly = tag(ap, 'Wi-Fi 7 · 6 GHz: WPA3 sign-in', [0, 0.65, 0], 'big');
    const lOlder = tag(ap, '', [0, 1.3, 0]);
    const lRetire = tag(sideDoor.sign, 'Retire as devices are replaced', [0, -1.9, 0]);
    const olderText = () => `${genName(compareGen)}: WPA2 or WPA3 accepted`;
    labels.setText(lOlder, olderText());

    const shownOn = new Map([
      [lOutsider, ['wpa2-risks', 'wpa3-personal']],
      [lCracked, ['wpa2-risks']],
      [lSealed, ['wpa3-personal']],
      [lLive, ['wpa3-personal']],
      [lFake, ['wpa2-risks']],
      [lCert, ['wpa3-enterprise']],
      [lShield, ['wpa3-enterprise']],
      [lKeys, ['wpa3-personal']],
      [lOnly, ['wpa3-only']],
      [lOlder, ['wpa3-only']],
      [lRetire, ['clinical-outcome']]
    ]);

    const cameras = {
      'wpa2-risks': { pos: [0, 5.2, 11.5], look: [0, 1.1, 0.6] },
      'wpa3-personal': { pos: [-3.2, 4.4, 9], look: [-3.4, 1.1, 1] },
      'wpa3-enterprise': { pos: [3.4, 4.4, 9], look: [3.6, 1.2, 0.6] },
      'wpa3-only': { pos: [2, 5.2, 11.5], look: [2, 1.1, 0.4] }, // the side door's sign clears the callout
      'clinical-outcome': { pos: [0.8, 5.2, 11.5], look: [0.8, 1.1, 0.4] }
    };
    const anchorSets = {
      'wpa2-risks': { ap, 'personal-door': personalDoor.sign, 'enterprise-door': enterpriseDoor.sign, outsider, 'fake-ap': fakeAp },
      'wpa3-personal': { ap, 'personal-door': personalDoor.sign, outsider, keypad },
      'wpa3-enterprise': { ap, 'enterprise-door': enterpriseDoor.sign, reader },
      'wpa3-only': { ap, 'side-door': sideDoor.sign },
      'clinical-outcome': { ap, 'side-door': sideDoor.sign, 'personal-door': personalDoor.sign, 'enterprise-door': enterpriseDoor.sign }
    };
    const lookTarget = { x: 0, y: 1, z: 0 };
    const look = new THREE.Vector3();
    const recPos = recording.position;

    return {
      async setState(name, { animate = true, signal } = {}) {
        mode = name;
        const cam = cameras[name];
        const jobs = [animateTo([
          [camera.position, 'x', cam.pos[0]], [camera.position, 'y', cam.pos[1]], [camera.position, 'z', cam.pos[2]],
          [lookTarget, 'x', cam.look[0]], [lookTarget, 'y', cam.look[1]], [lookTarget, 'z', cam.look[2]]
        ], { durationMs: 1300, animate, signal })];

        const risks = name === 'wpa2-risks';
        const personal = name === 'wpa3-personal';
        const enterprise = name === 'wpa3-enterprise';
        const only = name === 'wpa3-only';
        const outcome = name === 'clinical-outcome';

        // Personal door: the recording travels to the desk; WPA2 cracks it, WPA3 leaves it sealed.
        outsider.visible = risks || personal;
        desk.visible = deskLock.group.visible = recording.visible = risks || personal;
        if (risks || personal) {
          recPos.copy(atKeypad);
          jobs.push(animateTo([[recPos, 'x', atDesk.x], [recPos, 'y', atDesk.y], [recPos, 'z', atDesk.z]], { durationMs: 1600, delayMs: 500, animate, signal }));
        }
        recording.material.color.set(personal ? neutral.device : SEAL);
        recording.material.emissiveIntensity = personal ? 0 : 0.25;
        deskLock.body.material.color.set(risks ? OUTSIDER : neutral.device);
        jobs.push(animateTo([[deskLock.shackle.position, 'y', risks ? 0.42 : 0.17]], { durationMs: 600, delayMs: 1900, animate, signal }));

        // Enterprise door: WPA2 devices can be fooled by the fake; WPA3 checks the certificate.
        fake.visible = risks; // with WPA3-Enterprise the fake no longer works, so it leaves the picture
        fakeLink.visible = risks;
        realLink.visible = !risks;
        seal.visible = enterprise || only || outcome;
        shield.visible = enterprise || outcome;

        // A close-up on one door leaves the other at the slide edge or under the callout: its sign
        // steps back.
        personalDoor.signLabel.element.style.opacity = enterprise ? '0' : '1';
        enterpriseDoor.signLabel.element.style.opacity = personal ? '0' : '1';

        // Each device's own key appears once its door is WPA3.
        pumpKey.group.visible = !risks;
        stationKey.group.visible = enterprise || only || outcome;

        // Wi-Fi 7 / 6 GHz: WPA3 sign-in; an older device is turned to the side door.
        sideDoor.group.visible = only || outcome;
        oldDevice.visible = only || outcome;
        oldDevice.position.copy(only && animate ? oldAtMain : oldAtSide);
        if (only) jobs.push(animateTo([[oldDevice.position, 'x', oldAtSide.x], [oldDevice.position, 'z', oldAtSide.z]], { durationMs: 1400, delayMs: 700, animate, signal }));
        labels.setText(lOlder, olderText());

        for (const [l, states] of shownOn) l.element.style.opacity = states.includes(name) ? '1' : '0';
        await Promise.all(jobs);
        this.update(0);
        ctx.requestRender();
      },
      setGeneration(genId) {
        if (genId === 'wifi7') return;
        compareGen = genId;
        labels.setText(lOlder, olderText());
        ctx.requestRender();
      },
      update() {
        look.set(lookTarget.x, lookTarget.y, lookTarget.z);
        camera.lookAt(look);
      },
      isIdle() {
        return true;
      },
      anchors() {
        return anchorSets[mode];
      },
      shots: { wide: { position: [0.6, 6.5, 14], target: [0.6, 1, 0.4] } },
      resize(width, height) {
        camera.fov = width / height < 1 ? 64 : 44;
        camera.updateProjectionMatrix();
      },
      dispose() {}
    };
  }
};
