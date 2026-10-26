// Beat state machine: which tab and beat are showing, the scene that animates them, and the text
// that goes with them. Other modules subscribe to tab/beat/generation changes.
import { tabById, markupContext, generations, genById } from './content.js';
import { renderMarkup, renderInline, plainText } from './markup.js';
import { sceneFor } from '../scenes/index.js';
import { claim } from './content.js';

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
const deepBeatEl = document.createElement('div');
const sectionsEl = document.createElement('div');
deepEl.append(deepBeatEl, sectionsEl);

const listeners = { tab: new Set(), beat: new Set(), generation: new Set() };
const state = { tab: null, beatIndex: 0, generation: null, instance: null, sceneName: null, transition: null };
let stage = null;
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
    instance: state.instance
  };
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
    running: stage?.isRunning?.() ?? false,
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

function mountScene(tab) {
  state.instance = null;
  state.sceneName = null;
  if (!stage) return;
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
  if (beat) parts.push(`<p class="beat-kicker">${BEAT_LABELS[beat.type] ?? ''}</p>`);
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
  renderDeepDive(beat);
}

/** Lineage callout for features that existed before Wi-Fi 7 (Principle IV). */
function renderLineage(tab) {
  lineageEl.replaceChildren();
  if (tab.kind !== 'feature' || !tab.introducedIn || tab.introducedIn === 'wifi7') return;
  const g = genById.get(tab.introducedIn);
  const p = document.createElement('div');
  p.className = 'lineage';
  const lead = document.createElement('strong');
  lead.textContent = `First introduced in ${g.name} (${g.ieee}). `;
  const rest = document.createElement('span');
  rest.innerHTML = 'What Wi-Fi 7 adds: ' + renderInline(tab.wifi7Adds, markupContext); // safe: renderMarkup
  p.append(lead, rest);
  lineageEl.append(p);
}

/** Technical layer for the current beat: an "Under the hood" disclosure. */
function renderDeepDive(beat) {
  const wasOpen = deepBeatEl.querySelector('details')?.open;
  deepBeatEl.replaceChildren();
  if (!beat?.deepDive) return;
  const details = document.createElement('details');
  details.className = 'deep-dive card';
  details.open = !!wasOpen || document.documentElement.dataset.view === 'technical';
  const summary = document.createElement('summary');
  summary.textContent = 'Under the hood';
  const body = document.createElement('div');
  body.className = 'deep-body';
  body.innerHTML = renderMarkup(beat.deepDive, markupContext); // safe: renderMarkup
  details.append(summary, body);
  deepBeatEl.append(details);
}

/** Deeper sections for the tab (e.g., MLO modes). Opening one shows its scene state. */
function renderSections(tab) {
  sectionsEl.replaceChildren();
  for (const section of tab.sections ?? []) {
    const details = document.createElement('details');
    details.className = 'deep-section card';
    details.dataset.section = section.id;
    details.open = document.documentElement.dataset.view === 'technical';
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
  if (!state.instance || !beat?.sceneState) return;
  state.transition?.abort();
  const controller = new AbortController();
  state.transition = controller;
  state.sceneName = beat.sceneState;
  updateTestHook();
  await state.instance.setState(beat.sceneState, { generation: state.generation, animate, signal: controller.signal });
}

/** Shows a tab at a beat. `animate: false` jumps straight to the end state (deep links). */
export function showTab(tabId, beatIndex = 0, { animate = false, generation = null } = {}) {
  const tab = tabById.get(tabId);
  const changed = state.tab?.id !== tabId;
  state.tab = tab;
  state.beatIndex = clampBeat(beatIndex);
  state.generation = (generation && tab.compareGenerations.includes(generation) ? generation : null) ?? tab.defaultCompare ?? null;
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

export function goTo(index, { animate = true } = {}) {
  if (!state.tab) return Promise.resolve();
  const next = clampBeat(index);
  if (next === state.beatIndex && state.sceneName) return Promise.resolve();
  state.beatIndex = next;
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

export function setGeneration(genId) {
  if (!state.tab?.compareGenerations.includes(genId) || genId === state.generation) return;
  state.generation = genId;
  state.instance?.setGeneration?.(genId);
  emit('generation');
  updateTestHook();
}

/** Re-applies the current beat's scene state (e.g., after a deep section closes). */
export function restoreSceneState() {
  return applySceneState({ animate: true });
}

/** Moves the scene to an arbitrary named state (deep sections). */
export function showSceneState(name) {
  if (!state.instance) return Promise.resolve();
  state.transition?.abort();
  const controller = new AbortController();
  state.transition = controller;
  state.sceneName = name;
  updateTestHook();
  return state.instance.setState(name, { generation: state.generation, animate: true, signal: controller.signal });
}
