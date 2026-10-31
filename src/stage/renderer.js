// Shared 3D stage: one WebGL renderer, one HTML label layer, one camera, and a render loop that
// runs only while something is moving (research R4, contracts/scene-module.md).
import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { kit } from './kit/index.js';
import { palette, neutral } from './palette.js';
import * as tweens from './tween.js';
import { animateTo, seeded } from './animate.js';

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

function disposeObject(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const materials = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const m of materials) {
      for (const value of Object.values(m)) if (value?.isTexture) value.dispose();
      m.dispose();
    }
  });
}

/**
 * @param {HTMLElement} container  The #stage element.
 * @param {{ onContextLost?: () => void, isDark?: () => boolean }} options
 */
export function createStage(container, { onContextLost = () => {}, isDark = () => false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral tone mapping keeps the generation colours true while softening highlights.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.classList.add('stage-canvas');
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.classList.add('stage-labels');
  container.appendChild(labelRenderer.domElement);

  const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 200);
  camera.position.set(0, 7, 14);
  camera.lookAt(0, 0, 0);

  let instance = null;
  let scene = null;
  let labels = [];
  let rafId = 0;
  let last = 0;
  let baseline = null;
  let hidden = document.visibilityState === 'hidden';
  let frameListener = null;
  let cueListener = null;

  // Frame inset (fraction of the width kept free on the right): the whole camera view is fitted, at
  // the same aspect, into the rest of the stage and centred there vertically. Off-centre projection
  // only, so a callout card on the right never covers the scene. Labels share the camera.
  const shift = { value: 0 };
  let applied = { value: NaN, w: 0, h: 0 };
  let viewW = 1;
  let viewH = 1;

  function applyShift() {
    if (applied.value === shift.value && applied.w === viewW && applied.h === viewH) return;
    if (shift.value) {
      const k = 1 - shift.value; // scale of the fitted picture
      const fullW = k * viewW;
      const fullH = k * viewH;
      // The fitted picture sits a little in from the left edge and centred vertically.
      const left = (viewW - fullW) * 0.08;
      camera.setViewOffset(fullW, fullH, -left, -(viewH - fullH) / 2, viewW, viewH);
    } else camera.clearViewOffset();
    applied = { value: shift.value, w: viewW, h: viewH };
  }

  function size() {
    viewW = Math.max(1, container.clientWidth);
    viewH = Math.max(1, container.clientHeight);
    renderer.setSize(viewW, viewH, false);
    labelRenderer.setSize(viewW, viewH);
    camera.aspect = viewW / viewH;
    camera.updateProjectionMatrix();
    instance?.resize?.(viewW, viewH);
    applied.value = NaN;
    renderOnce();
    unclutterPins();
  }

  // A held framing (the chapter opener's wide shot) overrides the scene's own camera every frame
  // until released; the next animated state then moves the camera on from there.
  let held = null;

  function renderOnce() {
    if (!scene) return;
    applyShift();
    if (held) {
      camera.position.set(...held.position);
      camera.lookAt(...held.target);
    }
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  /** Holds the camera on `shot` ({ position, target }); without one, on a pulled-back framing. */
  function holdShot(shot) {
    if (!shot) {
      const p = camera.position;
      shot = { position: [p.x * 1.3, p.y * 1.3, p.z * 1.3], target: [0, 0, 0] };
    }
    held = shot;
    renderOnce();
  }

  function releaseShot() {
    held = null;
  }

  /** The transition's move-out: the camera eases away from the scene. Resolves when done or aborted. */
  function dollyOut({ durationMs = 700, signal } = {}) {
    const p = camera.position;
    return animateTo([[p, 'x', p.x * 1.45], [p, 'y', p.y * 1.45], [p, 'z', p.z * 1.45]], { durationMs, signal });
  }

  /** Draws the frame just rendered into a 2D canvas (same task as the render, so no preserved buffer). */
  function captureFrame(target) {
    renderOnce();
    target.width = renderer.domElement.width;
    target.height = renderer.domElement.height;
    target.getContext('2d').drawImage(renderer.domElement, 0, 0);
  }

  /** Eases the frame shift to `target` (0 = centred); instant when `animate` is false. */
  function setShift(target, { animate = true } = {}) {
    if (shift.value === target) return;
    if (!animate) {
      shift.value = target;
      renderOnce();
      return;
    }
    animateTo([[shift, 'value', target]], { durationMs: 900 });
  }

  function frame(now) {
    rafId = 0;
    const dt = last ? Math.min(100, now - last) : 16;
    last = now;
    tweens.tickTweens(dt);
    instance?.update?.(dt / 1000);
    renderOnce();
    frameListener?.(dt);
    const busy = tweens.hasActiveTweens() || (instance && !instance.isIdle());
    // Pins are tidied once the camera and tweens rest; scenes that loop forever (moving packets)
    // still rest their labels, so a few checks a second suffice.
    if (!tweens.hasActiveTweens() && (!busy || now - lastUnclutter > 300)) {
      lastUnclutter = now;
      unclutterPins();
    }
    if (busy && !hidden) rafId = requestAnimationFrame(frame);
    else last = 0;
  }

  function wake() {
    if (!rafId && !hidden && scene) rafId = requestAnimationFrame(frame);
  }

  tweens.onTweenStart(wake);

  document.addEventListener('visibilitychange', () => {
    hidden = document.visibilityState === 'hidden';
    if (hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      last = 0;
    } else if (!hidden) wake();
  });

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    onContextLost();
  });

  new ResizeObserver(size).observe(container);

  const labelApi = {
    /** Adds an HTML label anchored to `object`. Text is set with textContent (never HTML). */
    add(object, text, { className = '', offset = [0, 0, 0] } = {}) {
      const el = document.createElement('div');
      el.className = `stage-label ${className}`.trim();
      // Scene labels are decorative (the scene description carries the meaning); hotspot markers in
      // the same layer are real buttons, so the hiding is per label, not on the layer.
      el.setAttribute('aria-hidden', 'true');
      el.textContent = text;
      const label = new CSS2DObject(el);
      label.position.set(...offset);
      object.add(label);
      labels.push(label);
      return label;
    },
    setText(label, text) {
      label.element.textContent = text;
    },
    remove(label) {
      label.parent?.remove(label);
      label.element.remove();
      labels = labels.filter((l) => l !== label);
    }
  };

  /**
   * Pins a shell-owned element (a hotspot marker) to a scene object through the label layer, so it
   * follows the object with transforms only (P11). Returns a function that unpins it.
   */
  function attach(object, element, offset = [0, 0, 0]) {
    const pin = new CSS2DObject(element);
    pin.position.set(...offset);
    object.add(pin);
    pins.push(element);
    wake();
    return () => {
      pin.parent?.remove(pin);
      element.remove();
      pins = pins.filter((p) => p !== element);
      wake();
    };
  }

  // A pin that lands on a scene label would hide its text, so once the picture settles each such pin
  // moves to the label's top-left corner, like a badge. CSS `translate` composes with the label
  // layer's own transform, so this stays a transform-only change (P11).
  let pins = [];
  let lastUnclutter = 0;
  const shown = (el) => el.isConnected && el.style.display !== 'none' && el.style.opacity !== '0';
  function unclutterPins() {
    if (!pins.length) return;
    const visible = labels.map((l) => l.element).filter((el) => shown(el) && el.textContent.trim());
    for (const pin of pins) pin.style.translate = '';
    const boxes = visible.map((el) => el.getBoundingClientRect());
    for (const pin of pins) {
      if (!shown(pin)) continue;
      const r = pin.getBoundingClientRect();
      const hit = boxes.find((b) => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top);
      if (!hit) continue;
      const dx = hit.left - (r.left + r.width / 2);
      const dy = hit.top - (r.top + r.height / 2);
      pin.style.translate = `${Math.round(dx)}px ${Math.round(dy)}px`;
    }
  }

  function addLights(target) {
    target.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.4));
    const key = new THREE.DirectionalLight(0xfff6ec, 1.5);
    key.position.set(6, 12, 8);
    target.add(key);
  }

  return {
    renderer,
    camera,
    /** Mounts a scene module and returns its instance (contracts/scene-module.md). */
    mount(sceneModule, { t = (k) => k, claim, generations = [] } = {}) {
      this.unmount();
      if (!baseline) baseline = { ...renderer.info.memory };
      scene = new THREE.Scene();
      addLights(scene);
      camera.position.set(0, 7, 14);
      camera.lookAt(0, 0, 0);
      const ctx = {
        three: THREE,
        scene,
        camera,
        labels: labelApi,
        kit,
        palette,
        neutral: isDark() ? neutral.dark : neutral.light,
        tween: tweens.tween,
        wait: tweens.wait,
        easing: tweens.easing,
        animateTo,
        seeded,
        generations,
        motion: tweens.getMotion(),
        t,
        claim,
        requestRender: wake,
        /** Signals a narrative moment, e.g. cue('caption') when a step's subject appears (research P3). */
        cue: (name) => cueListener?.(name)
      };
      instance = sceneModule.create(ctx);
      size();
      wake();
      return instance;
    },
    unmount() {
      if (!instance) return;
      held = null;
      tweens.cancelAllTweens();
      instance.dispose?.();
      for (const l of [...labels]) labelApi.remove(l);
      disposeObject(scene);
      scene.clear();
      instance = null;
      scene = null;
      renderer.renderLists.dispose();
      if (baseline) {
        const { geometries, textures } = renderer.info.memory;
        if (geometries > baseline.geometries || textures > baseline.textures) {
          console.warn(`Stage memory above baseline after unmount (geometries ${geometries}, textures ${textures}).`);
        }
      }
    },
    wake,
    attach,
    setShift,
    holdShot,
    releaseShot,
    dollyOut,
    captureFrame,
    renderOnce,
    isRunning: () => rafId !== 0,
    onFrame(fn) {
      frameListener = fn;
    },
    onCue(fn) {
      cueListener = fn;
    },
    info: () => renderer.info
  };
}
