// Boots the explainer. Bundled as a classic IIFE script (research R1) so it runs from file://.
import * as prefs from './app/preferences.js';
import { tabs } from './app/content.js';
import * as router from './app/router.js';
import { initTabs, setActiveTab, setProgress, announce } from './app/tabs.js';
import * as story from './app/story.js';
import { initOverview } from './app/overview.js';
import { setMotion } from './stage/tween.js';
import { createStage, webglAvailable } from './stage/renderer.js';
import { register } from './scenes/index.js';
import overviewScene from './scenes/overview.js';

register(overviewScene);

const routeNotice = document.createElement('p');
routeNotice.className = 'notice';
routeNotice.hidden = true;
document.getElementById('story').before(routeNotice);

function isTyping(target) {
  return target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="tablist"]');
}

function boot() {
  prefs.applyTheme();
  setMotion(prefs.effectiveMotion());

  const testMode = /[?&]test(?:[=&]|$)/.test(location.hash);
  const hasWebgl = webglAvailable();
  document.documentElement.dataset.webgl = hasWebgl ? 'yes' : 'no';
  const stage = hasWebgl ? createStage(document.getElementById('stage'), { isDark: prefs.isDark }) : null;
  story.setStage(stage, { test: testMode });

  initTabs();
  initOverview();

  story.on('beat', ({ tabId, beatIndex, beatCount }) => {
    setProgress(tabId, beatIndex, beatCount);
    if (router.getRoute()?.tabId === tabId && beatCount) router.replace({ beat: beatIndex + 1 });
  });

  let firstRoute = true;
  router.onRoute((route) => {
    routeNotice.hidden = !route.notFound;
    routeNotice.textContent = route.notFound ? `Section “${route.requestedTab}” was not found, so the Overview is shown instead.` : '';
    const tabChanged = story.snapshot().tabId !== route.tabId;
    setActiveTab(route.tabId);
    const beatIndex = route.beat ? route.beat - 1 : 0;
    story.showTab(route.tabId, beatIndex, { animate: !firstRoute && tabChanged, generation: route.params.get('gen') });
    if (tabChanged && !firstRoute) {
      const tab = tabs.find((t) => t.id === route.tabId);
      announce(`${tab.title}, tab ${tab.order} of ${tabs.length}`);
    }
    firstRoute = false;
  });

  // Beat stepping from the keyboard when focus is not in the tablist or a control that uses arrows.
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      story.next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      story.prev();
    }
  });

  router.init({ tabs: tabs.map((t) => t.id), fallback: 'overview' });
}

boot();
