// Boots the explainer. Bundled as a classic IIFE script (research R1) so it runs from file://.
import * as prefs from './app/preferences.js';
import { tabs } from './app/content.js';
import * as router from './app/router.js';
import { initTabs, setActiveTab, setProgress, announce } from './app/tabs.js';
import * as story from './app/story.js';
import { initOverview } from './app/overview.js';
import { initControls, pause } from './app/controls.js';
import { initGlossary } from './app/glossary.js';
import { initComparison } from './app/comparison.js';
import { initFigures } from './app/figures.js';
import { initScenario } from './app/scenario.js';
import { initShortcuts } from './app/shortcuts.js';
import { initView } from './app/view.js';
import { initProvenance } from './app/provenance.js';
import { initReferences } from './app/references.js';
import { setMotion } from './stage/tween.js';
import { createStage, webglAvailable } from './stage/renderer.js';
import { createFallback } from './stage/fallback.js';
import { register } from './scenes/index.js';
import overviewScene from './scenes/overview.js';
import spectrumScene from './scenes/spectrum.js';
import mloScene from './scenes/mlo.js';
import qamScene from './scenes/qam-puncturing.js';
import securityScene from './scenes/security.js';
import twtScene from './scenes/twt.js';
import densityScene from './scenes/density.js';
import latencyScene from './scenes/latency.js';
import bandwidthScene from './scenes/bandwidth-poe.js';
import wifi8Scene from './scenes/wifi8.js';

for (const scene of [overviewScene, spectrumScene, mloScene, qamScene, securityScene, twtScene, densityScene, latencyScene, bandwidthScene, wifi8Scene]) register(scene);

const routeNotice = document.createElement('p');
routeNotice.className = 'notice';
routeNotice.hidden = true;
document.getElementById('story').before(routeNotice);

const THEME_LABEL = { system: 'System', light: 'Light', dark: 'Dark' };
const NEXT_THEME = { system: 'light', light: 'dark', dark: 'system' };

function initPreferenceToggles() {
  const themeButton = document.getElementById('theme-toggle');
  const motionButton = document.getElementById('motion-toggle');

  const renderToggles = () => {
    themeButton.textContent = `Theme: ${THEME_LABEL[prefs.get('theme')]}`;
    themeButton.setAttribute('aria-label', `Theme: ${THEME_LABEL[prefs.get('theme')]}. Change theme`);
    const on = prefs.effectiveMotion() === 'full';
    motionButton.textContent = `Motion: ${on ? 'On' : 'Off'}`;
    motionButton.setAttribute('aria-pressed', String(on));
    document.documentElement.dataset.motion = on ? 'full' : 'reduced';
  };

  themeButton.addEventListener('click', () => prefs.set('theme', NEXT_THEME[prefs.get('theme')]));
  motionButton.addEventListener('click', () => prefs.set('motion', prefs.effectiveMotion() === 'full' ? 'reduced' : 'full'));

  const applyMotion = () => {
    setMotion(prefs.effectiveMotion());
    if (prefs.effectiveMotion() === 'reduced') pause();
    story.remount();
  };
  prefs.onChange((key) => {
    if (key === 'theme') {
      prefs.applyTheme();
      story.remount();
    }
    if (key === 'motion') applyMotion();
    renderToggles();
    if (key === 'theme' || key === 'motion') {
      announce(key === 'theme' ? `Theme: ${THEME_LABEL[prefs.get('theme')]}` : `Motion ${prefs.effectiveMotion() === 'full' ? 'on' : 'off'}`);
    }
  });
  prefs.onSystemMotionChange(() => {
    if (prefs.get('motion') === 'system') {
      applyMotion();
      renderToggles();
    }
  });
  renderToggles();
}

function boot() {
  prefs.applyTheme();
  setMotion(prefs.effectiveMotion());

  const testMode = /[?&]test(?:[=&]|$)/.test(location.hash);
  const stageEl = document.getElementById('stage');
  const noticeEl = document.getElementById('stage-notice');
  const hasWebgl = webglAvailable();
  document.documentElement.dataset.webgl = hasWebgl ? 'yes' : 'no';
  let stage = null;
  if (hasWebgl) {
    try {
      stage = createStage(stageEl, {
        isDark: prefs.isDark,
        onContextLost: () => story.useFallback(createFallback(stageEl, noticeEl))
      });
    } catch {
      stage = null;
    }
  }
  story.setStage(stage, { test: testMode });
  if (!stage) story.useFallback(createFallback(stageEl, noticeEl));

  initView();
  initTabs();
  initOverview();
  initControls({ test: testMode });
  initGlossary();
  initComparison();
  initFigures();
  initScenario();
  initShortcuts();
  initProvenance();
  initReferences();
  initPreferenceToggles();

  story.on('beat', ({ tabId, beatIndex, beatCount }) => {
    setProgress(tabId, beatIndex, beatCount);
    if (router.getRoute()?.tabId === tabId && beatCount) router.replace({ beat: beatIndex + 1 });
  });

  let firstRoute = true;
  router.onRoute((route) => {
    routeNotice.hidden = !route.notFound;
    routeNotice.textContent = route.notFound ? `Section “${route.requestedTab}” was not found, so the Overview is shown instead.` : '';
    const tabChanged = story.snapshot().tabId !== route.tabId;
    document.documentElement.dataset.tab = route.tabId;
    setActiveTab(route.tabId);
    const beatIndex = route.beat ? route.beat - 1 : 0;
    story.showTab(route.tabId, beatIndex, { animate: !firstRoute && tabChanged, generation: route.params.get('gen') });
    if (tabChanged && !firstRoute) {
      const tab = tabs.find((t) => t.id === route.tabId);
      announce(`${tab.title}, tab ${tab.order} of ${tabs.length}`);
    }
    firstRoute = false;
  });

  router.init({ tabs: tabs.map((t) => t.id), fallback: 'overview' });
}

boot();
