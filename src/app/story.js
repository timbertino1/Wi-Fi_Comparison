// Beat state machine: which tab and beat are showing, the scene that animates them, and the text
// that goes with them. Other modules subscribe to tab/beat changes.
import { tabById, markupContext, generations, genById } from './content.js';
import { renderMarkup, renderInline, plainText } from './markup.js';
import { sceneFor } from '../scenes/index.js';
import { claim } from './content.js';
import { lineageLead } from './opener-text.js';

const BEAT_LABELS = {
  problem: 'The problem',
  what: 'What it is',
  how: 'How it works',
  improvement: 'How it improves',
  why: 'Why it matters in healthcare',
  intro: 'Introduction',
  context: 'Context',
  outlook: 'Looking ahead'
};

const storyEl = document.getElementById('story');
const descriptionEl = document.getElementById('scene-description');
const stageEl = document.getElementById('stage');
const deepEl = document.getElementById('deep');
const lineageEl = document.getElementById('lineage');
const bottomLineEl = document.getElementById('bottom-line');
const sectionsEl = document.createElement('div');
deepEl.append(sectionsEl);

const listeners = { tab: new Set(), beat: new Set(), settled: new Set() };
const state = { tab: null, beatIndex: 0, generation: null, instance: null, sceneName: null, transition: null, animated: false, phase: 'settled', captionShown: false, calloutShown: false, hotspots: [], hotspotOpen: null, intro: false };
let stage = null;
let fallback = null;
let testHook = false;

export function on(event, fn) {
  listeners[event].add(fn);
  return () => listeners[event].delete(fn);
}

function emit(event) {
  for (const fn of listeners[event]) fn(snapshot());
}

export function snapshot() {
  const tab = state.tab;
  return {
    tab,
    tabId: tab?.id ?? null,
    beatIndex: state.beatIndex,
    beat: tab?.beats?.[state.beatIndex] ?? null,
    beatCount: tab?.beats?.length ?? 0,
    generation: state.generation,
    instance: state.instance,
    animated: state.animated,
    intro: state.intro
  };
}

/** Records the talk sequencer's phase and caption visibility for the `?test` hook. */
export function setPhase(phase) {
  state.phase = phase;
  updateTestHook();
}

export function setCaptionShown(shown) {
  state.captionShown = shown;
  updateTestHook();
}

export function setCalloutShown(shown) {
  state.calloutShown = shown;
  updateTestHook();
}

/** Records the hotspot markers on the slide and the open card (by hotspot id) for the `?test` hook. */
export function setHotspots(ids) {
  state.hotspots = ids;
  updateTestHook();
}

export function setHotspotOpen(id) {
  state.hotspotOpen = id;
  updateTestHook();
}

/** Provides the 3D stage (null when WebGL is unavailable). */
export function setStage(value, { test = false } = {}) {
  stage = value;
  testHook = test;
  updateTestHook();
}

function updateTestHook() {
  if (!testHook) return;
  window.__stage = {
    tab: state.tab?.id ?? null,
    beat: state.beatIndex + 1,
    state: state.sceneName,
    generation: state.generation,
    phase: state.phase,
    animated: state.animated,
    captionShown: state.captionShown,
    calloutShown: state.calloutShown,
    intro: state.intro,
    hotspots: state.hotspots,
    hotspotOpen: state.hotspotOpen,
    get anchors() {
      return Object.keys(state.instance?.anchors?.() ?? {});
    },
    get running() {
      return stage?.isRunning?.() ?? false;
    },
    info: () => stage?.info?.()
  };
}

function showPlaceholder(text) {
  const existing = stageEl.querySelector('.stage-empty');
  const el = existing ?? document.createElement('p');
  el.className = 'stage-empty';
  el.textContent = text;
  if (!existing) stageEl.append(el);
}

function clearPlaceholder() {
  stageEl.querySelector('.stage-empty')?.remove();
}

/** Switches to still images (no WebGL, or the WebGL context was lost). */
export function useFallback(value) {
  fallback = value;
  stage = null;
  state.instance = null;
  if (state.tab) {
    mountScene(state.tab);
    applySceneState({ animate: false });
  }
}

/** Re-creates the current scene (after a motion or theme change) at the current beat. */
export function remount() {
  if (!state.tab) return;
  mountScene(state.tab);
  applySceneState({ animate: false });
}

function showStill(key) {
  const beat = state.tab.beats?.[state.beatIndex];
  fallback?.show(state.tab.id, key, plainText(beat?.sceneDescription ?? state.tab.summary));
}

function mountScene(tab) {
  state.instance = null;
  state.sceneName = null;
  if (!stage) {
    if (fallback && tab.sceneId) clearPlaceholder();
    else {
      fallback?.hide();
      showPlaceholder(tab.kind === 'references' ? 'Sources, claims and glossary' : 'Animation unavailable');
    }
    return;
  }
  stage.unmount();
  const module = tab.sceneId ? sceneFor(tab.sceneId) : null;
  if (!module) {
    showPlaceholder(tab.kind === 'references' ? 'Sources, claims and glossary' : 'Animation in preparation');
    return;
  }
  clearPlaceholder();
  state.instance = stage.mount(module, { t: (key) => key, claim, generations });
}

function renderText() {
  const tab = state.tab;
  const beat = tab.beats?.[state.beatIndex];
  const parts = [];
  if (beat) parts.push(`<p class="beat-kicker">${[beat.type, ...(beat.covers ?? [])].map((t) => BEAT_LABELS[t] ?? '').join(' · ')}</p>`);
  parts.push(`<h2 id="tab-heading">${renderInline(tab.title, markupContext)}</h2>`);
  if (beat) {
    parts.push(`<h3>${renderInline(beat.heading, markupContext)}</h3>`);
    parts.push(renderMarkup(beat.body, markupContext));
  } else {
    parts.push(renderMarkup(tab.summary, markupContext));
  }
  storyEl.innerHTML = parts.join(''); // safe: renderMarkup
  const description = beat?.sceneDescription ?? tab.summary;
  descriptionEl.textContent = plainText(description);
  renderBottomLine(beat);
}

/** Leadership layer: the beat's Bottom line (shown in both views, emphasised in Leadership view). */
/** A Cisco platform note for the step (feature 003 FR-017): a named feature and one cited sentence. */
function renderCisco(beat) {
  if (!beat?.cisco) return;
  const box = document.createElement('aside');
  box.className = 'cisco-note';
  box.setAttribute('aria-label', 'On Cisco networks');
  const label = document.createElement('strong');
  label.className = 'bottom-line-label';
  label.textContent = `On Cisco networks: ${plainText(beat.cisco.feature)}`;
  const text = document.createElement('p');
  text.innerHTML = renderInline(beat.cisco.text, markupContext); // safe: renderMarkup
  box.append(label, text);
  bottomLineEl.append(box);
}

function renderBottomLine(beat) {
  bottomLineEl.replaceChildren();
  renderCisco(beat);
  if (!beat?.bottomLine) return;
  const box = document.createElement('aside');
  box.className = 'bottom-line';
  box.setAttribute('aria-label', 'Bottom line');
  const label = document.createElement('strong');
  label.className = 'bottom-line-label';
  label.textContent = 'Bottom line';
  const text = document.createElement('p');
  text.innerHTML = renderInline(beat.bottomLine, markupContext); // safe: renderMarkup
  box.append(label, text);
  bottomLineEl.append(box);
}

/** What each generation added since Wi-Fi 6 (feature 003 FR-005), one cited line per generation. */
function renderSinceWifi6(tab) {
  const box = document.createElement('div');
  box.className = 'lineage since-wifi6';
  const heading = document.createElement('strong');
  heading.textContent = 'Since Wi-Fi 6';
  const list = document.createElement('ul');
  for (const id of ['wifi6', 'wifi6e', 'wifi7']) {
    if (!tab.sinceWifi6[id]) continue;
    const li = document.createElement('li');
    li.dataset.gen = id;
    const name = document.createElement('strong');
    name.textContent = `${genById.get(id)?.name ?? id}: `;
    const text = document.createElement('span');
    text.innerHTML = renderInline(tab.sinceWifi6[id], markupContext); // safe: renderMarkup
    li.append(name, text);
    list.append(li);
  }
  box.append(heading, list);
  lineageEl.append(box);
}

/** Lineage callout for features that existed before Wi-Fi 7 (Principle IV). */
function renderLineage(tab) {
  lineageEl.replaceChildren();
  if (tab.sinceWifi6) return renderSinceWifi6(tab);
  const leadText = lineageLead(tab, genById);
  if (!leadText) return;
  const p = document.createElement('div');
  p.className = 'lineage';
  const lead = document.createElement('strong');
  lead.textContent = leadText;
  const rest = document.createElement('span');
  rest.innerHTML = 'What Wi-Fi 7 adds: ' + renderInline(tab.wifi7Adds, markupContext); // safe: renderMarkup
  p.append(lead, rest);
  lineageEl.append(p);
}

/** Reading sections for the tab (the References page). A section with a scene state shows it when opened. */
function renderSections(tab) {
  sectionsEl.replaceChildren();
  for (const section of tab.sections ?? []) {
    const details = document.createElement('details');
    details.className = 'deep-section card';
    details.dataset.section = section.id;
    // Text sections start open; a section that drives the animation starts closed, so opening it
    // is what switches the scene.
    if (section.sceneState) details.dataset.scene = section.sceneState;
    details.open = !section.sceneState;
    const summary = document.createElement('summary');
    summary.textContent = section.heading;
    const body = document.createElement('div');
    body.className = 'deep-body';
    body.innerHTML = renderMarkup(section.body, markupContext); // safe: renderMarkup
    details.append(summary, body);
    details.addEventListener('toggle', () => {
      if (!section.sceneState || !details.matches('[data-user-toggle]')) return;
      details.removeAttribute('data-user-toggle');
      if (details.open) showSceneState(section.sceneState);
      else restoreSceneState();
    });
    summary.addEventListener('click', () => details.setAttribute('data-user-toggle', ''));
    sectionsEl.append(details);
  }
}

async function applySceneState({ animate }) {
  const beat = state.tab.beats?.[state.beatIndex];
  if (!beat?.sceneState) return;
  if (!state.instance) {
    if (fallback && state.tab.sceneId) {
      state.sceneName = beat.sceneState;
      updateTestHook();
      showStill(state.beatIndex + 1);
    }
    return;
  }
  state.transition?.abort();
  const controller = new AbortController();
  state.transition = controller;
  state.sceneName = beat.sceneState;
  state.phase = animate ? 'animating' : 'settled';
  updateTestHook();
  await state.instance.setState(beat.sceneState, { generation: state.generation, animate, signal: controller.signal });
  if (state.transition === controller) {
    // On a chapter opener the first step is set up but framed on the scene's wide shot.
    if (state.intro) stage?.holdShot(state.instance.shots?.wide);
    setPhase('settled');
    emit('settled');
  }
}

/**
 * Shows a tab at a beat. `animate: false` jumps straight to the end state (deep links). `intro`
 * shows the chapter opener instead: the first step's state, settled, on the scene's wide shot.
 */
export function showTab(tabId, beatIndex = 0, { animate = false, intro = false } = {}) {
  const tab = tabById.get(tabId);
  const changed = state.tab?.id !== tabId;
  state.tab = tab;
  state.intro = intro;
  if (!intro) stage?.releaseShot();
  state.beatIndex = intro ? 0 : clampBeat(beatIndex);
  state.animated = intro ? false : animate;
  if (intro) animate = false;
  state.generation = tab.defaultCompare ?? null;
  if (changed) {
    mountScene(tab);
    renderSections(tab);
    renderLineage(tab);
  }
  renderText();
  if (changed) emit('tab');
  emit('beat');
  updateTestHook();
  return applySceneState({ animate });
}

function clampBeat(i) {
  const count = state.tab?.beats?.length ?? 0;
  if (!count) return 0;
  return Math.min(Math.max(0, i), count - 1);
}

/** Back from a chapter's first step: shows its opener (first step settled, wide shot). */
export function enterIntro() {
  if (!state.tab) return Promise.resolve();
  state.intro = true;
  state.beatIndex = 0;
  state.animated = false;
  renderText();
  emit('beat');
  updateTestHook();
  return applySceneState({ animate: false });
}

/** Next from a chapter opener: plays the first step, moving in from the wide shot. */
export function leaveIntro() {
  if (!state.tab || !state.intro) return Promise.resolve();
  state.intro = false;
  stage?.releaseShot();
  state.beatIndex = 0;
  state.animated = true;
  renderText();
  emit('beat');
  updateTestHook();
  return applySceneState({ animate: true });
}

export function goTo(index, { animate = true, replay = false } = {}) {
  if (!state.tab) return Promise.resolve();
  if (state.intro) {
    state.intro = false;
    stage?.releaseShot();
  }
  const next = clampBeat(index);
  if (next === state.beatIndex && state.sceneName && !replay) return Promise.resolve();
  state.beatIndex = next;
  state.animated = animate;
  renderText();
  emit('beat');
  updateTestHook();
  return applySceneState({ animate });
}

export function next(opts) {
  return goTo(state.beatIndex + 1, opts);
}

export function prev(opts) {
  return goTo(state.beatIndex - 1, opts);
}

export function isFirstBeat() {
  return state.beatIndex === 0;
}

export function isLastBeat() {
  const count = state.tab?.beats?.length ?? 0;
  return !count || state.beatIndex === count - 1;
}

/** Re-applies the current beat's scene state (e.g., after a deep section closes). */
export function restoreSceneState() {
  return applySceneState({ animate: true });
}

/** Moves the scene to an arbitrary named state (deep sections). */
export function showSceneState(name) {
  if (!state.instance) {
    const section = state.tab.sections?.find((x) => x.sceneState === name);
    if (fallback && section) {
      state.sceneName = name;
      updateTestHook();
      showStill(section.id);
    }
    return Promise.resolve();
  }
  state.transition?.abort();
  const controller = new AbortController();
  state.transition = controller;
  state.sceneName = name;
  updateTestHook();
  return state.instance.setState(name, { generation: state.generation, animate: true, signal: controller.signal });
}
