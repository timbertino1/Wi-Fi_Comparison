// Still-image fallback for browsers without WebGL, or after the WebGL context is lost (FR-028).
// Images are rendered from the real scenes at build time by scripts/snapshots.mjs.

export function createFallback(stageEl, noticeEl) {
  const img = document.createElement('img');
  img.className = 'stage-fallback';
  img.decoding = 'async';
  img.alt = '';

  noticeEl.textContent = '3D view isn’t available in this browser — showing still images instead.';
  noticeEl.hidden = false;
  stageEl.querySelector('canvas')?.remove();
  stageEl.querySelector('.stage-labels')?.remove();

  return {
    /** Shows the still for a tab at a beat (1-based) or a deep section id. */
    show(tabId, key, description) {
      stageEl.querySelector('.stage-empty')?.remove();
      if (!img.isConnected) stageEl.append(img);
      // The single-file build inlines the stills; the multi-file site loads them from fallback/.
      const file = `fallback/${tabId}/${key}.jpg`;
      img.src = globalThis.__FALLBACK_IMAGES__?.[file] ?? file;
      img.alt = description ?? '';
    },
    hide() {
      img.remove();
    }
  };
}
