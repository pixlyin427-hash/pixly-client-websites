import { initReveals, initCounters, initScrollFx, initTilt, initBgShift } from './motion';
import { initUI } from './ui';
import { initHeader } from './header';
import { initSearch } from './search';
import { initForms } from './forms';
import { initNotices } from './notices';
import { initCalendars } from './calendar';
import { initGallery, initClassSelector, initChecklist, initRails, initHoverReveal, initStickySwap, initAchievements, initAssistant } from './interactions';

const safe = (fn: () => void) => { try { fn(); } catch (err) { console.error('[stkv]', err); } };

[initHeader, initSearch, initUI, initReveals, initCounters, initScrollFx, initTilt, initBgShift,
  initForms, initNotices, initCalendars, initGallery, initClassSelector, initChecklist,
  initRails, initHoverReveal, initStickySwap, initAchievements, initAssistant].forEach((f) => safe(() => f()));
