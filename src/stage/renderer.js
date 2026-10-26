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

  function size() {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    instance?.resize?.(w, h);
    renderOnce();
  }

  function renderOnce() {
    if (!scene) return;
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
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

  function addLights(target) {
    target.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6));
    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(6, 12, 8);
    target.add(sun);
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
        requestRender: wake
      };
      instance = sceneModule.create(ctx);
      size();
      wake();
      return instance;
    },
    unmount() {
      if (!instance) return;
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
    renderOnce,
    isRunning: () => rafId !== 0,
    onFrame(fn) {
      frameListener = fn;
    },
    info: () => renderer.info
  };
}
