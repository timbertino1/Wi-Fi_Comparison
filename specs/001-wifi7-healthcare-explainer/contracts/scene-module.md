# Contract: Scene Module

Every animated tab has one module in `src/scenes/<sceneId>.js` that exports a factory. The app
shell owns the renderer, camera framing defaults, loop, labels layer, and controls; scenes own only
their objects and per-beat behavior.

## Export

```js
export default {
  id: 'mlo',                       // matches FeatureTab.sceneId
  states: ['single-link-congested', 'what-is-mlo', 'links-aggregate',
           'gen-compare', 'clinical-outcome', 'modes-compare'],
  create(ctx) { /* returns a SceneInstance */ }
};
```

`states` MUST list every `sceneState` and `DeepSection.sceneState` used by the tab's content; the
content validator checks this.

## Context passed to `create(ctx)`

| Member | Description |
|--------|-------------|
| `ctx.three` | The bundled three.js namespace |
| `ctx.scene` | A fresh `THREE.Scene` owned by this instance |
| `ctx.camera` | Shared perspective camera; scene may tween it via `ctx.tween` |
| `ctx.labels` | Helper to add/remove HTML labels anchored to 3D objects |
| `ctx.kit` | Shared parts: `accessPoint()`, `client(type)`, `band(id)`, `channelBlock()`, `packet()`, `constellation(order)`, `timeline()` |
| `ctx.palette` | Generation colors keyed by Generation id |
| `ctx.tween` | Tween helper; returns promises; honors reduced motion |
| `ctx.motion` | `'full'` or `'reduced'` |
| `ctx.t(key)` | Label strings from content (scenes MUST NOT hard-code user-visible copy) |

## SceneInstance

| Method | Required | Behavior |
|--------|----------|----------|
| `setState(name, { generation, animate })` | ✅ | Move to the named state for the given generation. With `animate: false` (reduced motion, snapshots, deep links) jump straight to the end state. Returns a promise that resolves when it settles. Calling it again mid-transition MUST cancel the previous one cleanly. |
| `setGeneration(genId)` | ✅ | Switch the comparison generation within the current state |
| `update(dtSeconds)` | ✅ | Per-frame tick; must be cheap; no allocations in steady state |
| `isIdle()` | ✅ | `true` when no transition or ambient motion is running (the shell stops the loop) |
| `resize(width, height)` | optional | Adjust framing for aspect ratio (portrait phone vs. widescreen) |
| `dispose()` | ✅ | Release all geometries, materials, textures, labels, and listeners. After this, renderer memory stats must return to the pre-`create` baseline |

## Rules

- Each state MUST show a real mechanism (Principle V). "Side by side" states render both the
  comparison generation and Wi-Fi 7, colored with `ctx.palette`.
- Visible text comes from content via `ctx.t()` or labels; numbers shown in-scene MUST equal the
  tab's KeyFigures.
- Budget per scene: ≤ 150 draw calls, ≤ 200k triangles; use `InstancedMesh` for > 50 identical
  objects.
- No network or file loads at runtime; textures, if any, are generated procedurally or bundled as
  data URIs.
- Deterministic end states (no randomness without a fixed seed) so fallback snapshots are stable.
- **Import-safe**: importing the module MUST NOT touch `window`, `document`, or WebGL; all such
  work happens inside `create()`. The content validator imports modules in Node to read `states`.
- No `eval`, `new Function`, string-based `setTimeout`, or `innerHTML` (CSP, research R12).
- Scenes ignore the audience view; Leadership and Technical views share identical animation.
