/**
 * Accessibility Widget - א.א. עבודות קידוחים ופיתוח
 * WCAG 2.0 AA Compliance
 * Self-contained accessibility module
 */
(function () {
  'use strict';

  // Detect base path (root vs blog subfolder)
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const scriptSrc = currentScript.getAttribute('src') || '';
  const isSubfolder = scriptSrc.indexOf('../') === 0;
  const basePath = isSubfolder ? '../' : '';

  // ---- State ----
  const STORAGE_KEY = 'acc_preferences';
  const defaultState = {
    fontSize: 0,
    highContrast: false,
    grayscale: false,
    highlightLinks: false,
    readableFont: false,
    stopAnimations: false,
    largeCursor: false,
    keyboardNav: false
  };

  let state = loadState();

  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return Object.assign({}, defaultState, JSON.parse(stored));
      }
    } catch (e) { /* ignore */ }
    return Object.assign({}, defaultState);
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  // ---- Build Widget HTML ----
  function buildWidget() {
    // Skip-to-content link
    const skipLink = document.createElement('a');
    skipLink.className = 'acc-skip-link';
    skipLink.href = '#main-content';
    skipLink.textContent = 'דלג לתוכן הראשי';
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add id to main content area if not exists
    const main = document.querySelector('main') || document.querySelector('.service-page-hero') || document.querySelector('section:first-of-type');
    if (main && !main.id) {
      main.id = 'main-content';
    }

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'acc-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.addEventListener('click', closePanel);

    // Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'acc-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'פתח הגדרות נגישות');
    toggleBtn.setAttribute('title', 'נגישות');
    toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="4" r="2"/><path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26C10.76 7.11 10 8.04 10 9.09V15c0 1.1.9 2 2 2h5v5h2v-5.5c0-1.1-.9-2-2-2h-3v-3.45c1.29 1.07 3.25 1.94 5 1.95zm-6.17 5c-.41 1.16-1.52 2-2.83 2-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V12.1c-2.28.46-4 2.48-4 4.9 0 2.76 2.24 5 5 5 2.42 0 4.44-1.72 4.9-4h-2.07z"/></svg>';
    toggleBtn.addEventListener('click', togglePanel);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'acc-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'הגדרות נגישות');
    panel.setAttribute('aria-modal', 'true');

    panel.innerHTML = `
      <div class="acc-panel-header">
        <h2 class="acc-panel-title">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="4" r="2"/><path d="M19 13v-2c-1.54.02-3.09-.75-4.07-1.83l-1.29-1.43c-.17-.19-.38-.34-.61-.45-.01 0-.01-.01-.02-.01H13c-.35-.2-.75-.3-1.19-.26C10.76 7.11 10 8.04 10 9.09V15c0 1.1.9 2 2 2h5v5h2v-5.5c0-1.1-.9-2-2-2h-3v-3.45c1.29 1.07 3.25 1.94 5 1.95zm-6.17 5c-.41 1.16-1.52 2-2.83 2-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83V12.1c-2.28.46-4 2.48-4 4.9 0 2.76 2.24 5 5 5 2.42 0 4.44-1.72 4.9-4h-2.07z"/></svg>
          הגדרות נגישות
        </h2>
        <button class="acc-close-btn" aria-label="סגור הגדרות נגישות">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="acc-panel-body">
        <!-- Font Size -->
        <div class="acc-font-controls">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><path d="M2 4v3h5v12h3V7h5V4H2z"/><path d="M14 10v2h3v7h3v-7h3v-2h-9z"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">גודל טקסט</span>
          </div>
          <div class="acc-font-btns">
            <button class="acc-font-btn" data-action="font-decrease" aria-label="הקטן טקסט">-</button>
            <span class="acc-font-level" id="accFontLevel">0</span>
            <button class="acc-font-btn" data-action="font-increase" aria-label="הגדל טקסט">+</button>
          </div>
        </div>

        <hr class="acc-separator">

        <!-- Toggle Options -->
        <button class="acc-option" data-feature="highContrast" aria-pressed="false">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 2a10 10 0 010 20V2z" fill="currentColor"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">ניגודיות גבוהה</span>
            <span class="acc-option-desc">רקע כהה וטקסט בהיר</span>
          </div>
        </button>

        <button class="acc-option" data-feature="grayscale" aria-pressed="false">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><rect x="3" y="3" width="9" height="18" fill="currentColor" opacity="0.4"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">גווני אפור</span>
            <span class="acc-option-desc">הסרת צבעים מהאתר</span>
          </div>
        </button>

        <button class="acc-option" data-feature="highlightLinks" aria-pressed="false">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">הדגשת קישורים</span>
            <span class="acc-option-desc">סימון וקו תחתון לכל הקישורים</span>
          </div>
        </button>

        <button class="acc-option" data-feature="readableFont" aria-pressed="false">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">גופן קריא</span>
            <span class="acc-option-desc">החלפה לגופן פשוט וקריא</span>
          </div>
        </button>

        <button class="acc-option" data-feature="stopAnimations" aria-pressed="false">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">עצירת אנימציות</span>
            <span class="acc-option-desc">השבתת כל התנועות באתר</span>
          </div>
        </button>

        <button class="acc-option" data-feature="largeCursor" aria-pressed="false">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><path d="M4 4l7 19 2.5-7.5L21 13z"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">סמן מוגדל</span>
            <span class="acc-option-desc">הגדלת סמן העכבר</span>
          </div>
        </button>

        <button class="acc-option" data-feature="keyboardNav" aria-pressed="false">
          <div class="acc-option-icon">
            <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="10" y2="8"/><line x1="14" y1="8" x2="14" y2="8"/><line x1="18" y1="8" x2="18" y2="8"/><line x1="6" y1="12" x2="6" y2="12"/><line x1="10" y1="12" x2="10" y2="12"/><line x1="14" y1="12" x2="14" y2="12"/><line x1="18" y1="12" x2="18" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>
          </div>
          <div class="acc-option-text">
            <span class="acc-option-label">ניווט מקלדת</span>
            <span class="acc-option-desc">הדגשת מיקוד אלמנטים</span>
          </div>
        </button>

        <hr class="acc-separator">

        <!-- Reset -->
        <button class="acc-reset-btn" aria-label="איפוס כל הגדרות הנגישות">
          <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 109-9"/><polyline points="3 3 3 9 9 9" fill="none"/></svg>
          איפוס הגדרות
        </button>

        <!-- Accessibility Statement Link -->
        <a href="${basePath}accessibility-statement.html" class="acc-statement-link">הצהרת נגישות</a>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(toggleBtn);
    document.body.appendChild(panel);

    // Bind close button
    panel.querySelector('.acc-close-btn').addEventListener('click', closePanel);

    // Bind feature toggles
    panel.querySelectorAll('.acc-option[data-feature]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var feature = this.getAttribute('data-feature');
        state[feature] = !state[feature];
        saveState();
        applyState();
        updateUI();
      });
    });

    // Bind font buttons
    panel.querySelector('[data-action="font-increase"]').addEventListener('click', function () {
      if (state.fontSize < 5) {
        state.fontSize++;
        saveState();
        applyState();
        updateUI();
      }
    });

    panel.querySelector('[data-action="font-decrease"]').addEventListener('click', function () {
      if (state.fontSize > 0) {
        state.fontSize--;
        saveState();
        applyState();
        updateUI();
      }
    });

    // Bind reset
    panel.querySelector('.acc-reset-btn').addEventListener('click', function () {
      state = Object.assign({}, defaultState);
      saveState();
      applyState();
      updateUI();
    });

    // Keyboard: Escape to close
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('acc-open')) {
        closePanel();
      }
    });

    // Store references
    window._accWidget = {
      panel: panel,
      overlay: overlay,
      toggleBtn: toggleBtn
    };
  }

  // ---- Panel Open/Close ----
  function togglePanel() {
    var w = window._accWidget;
    if (w.panel.classList.contains('acc-open')) {
      closePanel();
    } else {
      openPanel();
    }
  }

  function openPanel() {
    var w = window._accWidget;
    w.panel.classList.add('acc-open');
    w.overlay.classList.add('acc-visible');
    w.toggleBtn.setAttribute('aria-expanded', 'true');
    w.toggleBtn.setAttribute('aria-label', 'סגור הגדרות נגישות');
    // Trap focus in panel
    w.panel.querySelector('.acc-close-btn').focus();
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    var w = window._accWidget;
    w.panel.classList.remove('acc-open');
    w.overlay.classList.remove('acc-visible');
    w.toggleBtn.setAttribute('aria-expanded', 'false');
    w.toggleBtn.setAttribute('aria-label', 'פתח הגדרות נגישות');
    document.body.style.overflow = '';
    w.toggleBtn.focus();
  }

  // ---- Apply State to DOM ----
  function applyState() {
    var body = document.body;

    // Font size
    for (var i = 1; i <= 5; i++) {
      body.classList.remove('acc-font-' + i);
    }
    if (state.fontSize > 0) {
      body.classList.add('acc-font-' + state.fontSize);
    }

    // Toggle classes
    var classMap = {
      highContrast: 'acc-high-contrast',
      grayscale: 'acc-grayscale',
      highlightLinks: 'acc-highlight-links',
      readableFont: 'acc-readable-font',
      stopAnimations: 'acc-stop-animations',
      largeCursor: 'acc-large-cursor',
      keyboardNav: 'acc-keyboard-nav'
    };

    Object.keys(classMap).forEach(function (key) {
      if (state[key]) {
        body.classList.add(classMap[key]);
      } else {
        body.classList.remove(classMap[key]);
      }
    });
  }

  // ---- Update UI to reflect state ----
  function updateUI() {
    var w = window._accWidget;
    if (!w) return;

    // Update font level display
    var fontLevel = w.panel.querySelector('#accFontLevel');
    if (fontLevel) {
      fontLevel.textContent = state.fontSize;
    }

    // Update font buttons disabled state
    var incBtn = w.panel.querySelector('[data-action="font-increase"]');
    var decBtn = w.panel.querySelector('[data-action="font-decrease"]');
    if (incBtn) incBtn.disabled = state.fontSize >= 5;
    if (decBtn) decBtn.disabled = state.fontSize <= 0;

    // Update feature toggles
    w.panel.querySelectorAll('.acc-option[data-feature]').forEach(function (btn) {
      var feature = btn.getAttribute('data-feature');
      var isActive = state[feature];
      btn.classList.toggle('acc-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  // ---- Initialize ----
  function init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        buildWidget();
        applyState();
        updateUI();
      });
    } else {
      buildWidget();
      applyState();
      updateUI();
    }
  }

  init();
})();
