# Contract: Scene Module (additions for feature 002)

Feature 001's [scene-module contract](../../001-wifi7-healthcare-explainer/contracts/scene-module.md)
still applies in full. Feature 002 adds the members below. All additions are backwards compatible:
a scene that has not been migrated still works, but fails the 002 scene-contract test.

## Context additions

| Member | Description |
|--------|-------------|
| `ctx.cue(name)` | Signals a narrative moment. `cue('caption')` releases the current step's caption if its `captionAtMs` has not yet elapsed (research P3). Calls under reduced motion or in settled states are ignored. |

## SceneInstance additions

| Method / property | Required | Behavior |
|-------------------|----------|----------|
| `anchors()` | ✅ | Returns `{ [name]: THREE.Object3D }` for the objects hotspots may attach to **in the current state**. MUST include `ap` (the access point used as the chapter-transition anchor). Names are stable kebab-case strings; content refers to them. Objects that are hidden in the current state MUST be omitted. |
| `shots` | ✅ | `{ wide: { position: [x,y,z], target: [x,y,z] } }` — a framing that shows the whole scene with the `ap` anchor clearly visible; used as the start of the chapter "in" phase and the end of the "out" phase (research P4). |
| `setState(name, opts)` | ✅ (existing) | Unchanged, but MUST tolerate being called immediately after `create()` with the camera at `shots.wide`, animating from there to the state's own framing. |

## Rules (additions)

- The `ap` anchor MUST be present in every state of every chapter in the clicker path, and MUST be
  on screen in `shots.wide` and in the first and last states of the chapter (FR-012).
- Scenes MUST NOT create hotspot DOM or copy; they only publish anchors. The shell owns markers,
  cards and their text (from content).
- Anchors are read every frame for marker placement; `anchors()` MUST be cheap (return a cached
  object, update it on state change) and allocation-free in steady state.
- Per research P11, scenes MUST NOT add per-frame DOM styling; scene labels keep to the shared
  `.stage-label` styles.

## Test hooks (`?test`)

`window.__stage` gains:

| Member | Description |
|--------|-------------|
| `anchors` | Array of anchor names for the current state |
| `phase` | Sequencer state name (`settled`, `animating`, `chapter-out`, `crossfade`, `chapter-in`) |
| `captionShown` | `true` once the current caption is visible |
