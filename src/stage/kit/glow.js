import * as THREE from 'three';

/** A soft radial-gradient texture for glow sprites (a small canvas, so nothing is fetched). */
function glowTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A camera-facing soft halo, e.g. around an LED. Additive, so it reads on light and dark stages. */
export function glow({ color = '#0f9a8a', size = 0.6, opacity = 0.7 } = {}) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
  sprite.scale.setScalar(size);
  return sprite;
}
