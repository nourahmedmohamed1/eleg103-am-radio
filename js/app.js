/**
 * AM Radio Project — Main Application Controller
 * =================================================
 * Orchestrates milestone navigation, content rendering,
 * Three.js scene switching, carousel updates, and KaTeX math.
 * Depends on: MILESTONES (data.js), SceneManager (three-scene.js),
 *             Carousel (carousel.js), katex (CDN).
 */

/* global MILESTONES, SceneManager, Carousel, katex */

(function () {
  'use strict';

  let activeMilestone = -1;
  const $ = id => document.getElementById(id);

  /* ──────────────────────────────────────────────
   *  INITIALISATION
   * ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    buildSidebarTabs();
    initMediaTabs();
    initSidebarToggle();
    initCadToolbar();
    Carousel.initLightbox();

    // Init Circuit CAD Drawer
    CircuitDrawer.init();

    // Render first milestone
    switchMilestone(0);
  });

  /* ──────────────────────────────────────────────
   *  CIRCUIT CAD TOOLBAR
   * ────────────────────────────────────────────── */
  function initCadToolbar() {
    // Tool buttons (select, wire, components)
    document.querySelectorAll('.cad-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        CircuitDrawer.setTool(btn.dataset.tool);
      });
    });

    // Action buttons
    const bindBtn = (id, fn) => {
      const el = $(id);
      if (el) el.addEventListener('click', fn);
    };

    bindBtn('btn-load-preset', () => CircuitDrawer.loadMilestonePreset(activeMilestone));
    bindBtn('btn-cad-flow', () => CircuitDrawer.toggleSignalFlow());
    bindBtn('btn-cad-undo', () => CircuitDrawer.undo());
    bindBtn('btn-cad-rotate', () => CircuitDrawer.rotateSelected());
    bindBtn('btn-cad-clear', () => CircuitDrawer.clearCanvas());
    bindBtn('btn-cad-export', () => CircuitDrawer.exportImage());
  }

  /* ──────────────────────────────────────────────
   *  SIDEBAR TABS
   * ────────────────────────────────────────────── */
  function buildSidebarTabs() {
    const ul = $('milestone-tabs');
    MILESTONES.forEach((ms, i) => {
      const li = document.createElement('li');
      li.className = 'milestone-tab' + (i === 0 ? ' active' : '');
      li.dataset.index = i;
      li.innerHTML = `
        <span class="tab-icon">${ms.icon}</span>
        <div class="tab-info">
          <span class="tab-number">Milestone ${ms.number}</span>
          <span class="tab-title">${ms.title}</span>
        </div>
      `;
      li.addEventListener('click', () => switchMilestone(i));
      ul.appendChild(li);
    });
  }

  /* ──────────────────────────────────────────────
   *  SWITCH MILESTONE
   * ────────────────────────────────────────────── */
  function switchMilestone(index) {
    if (index === activeMilestone) return;
    activeMilestone = index;
    const ms = MILESTONES[index];

    // Update CSS accent
    const accent = ms.accentColor || '#00F2FE';
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--accent-glow', accent + '40');

    // Update sidebar active
    document.querySelectorAll('.milestone-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === index);
    });

    // Close sidebar on mobile
    $('sidebar').classList.remove('open');

    // Animate content transition
    const main = $('main-content');
    main.classList.remove('content-enter');
    void main.offsetWidth; // reflow
    main.classList.add('content-enter');

    // Update header
    $('ms-number').textContent = `Milestone ${ms.number}`;
    $('ms-title').textContent = ms.title;
    $('ms-subtitle').textContent = ms.subtitle;

    // Load Circuit CAD schematic preset for milestone
    try {
      CircuitDrawer.loadMilestonePreset(index);
    } catch (e) {
      console.error('CircuitDrawer.loadMilestonePreset error:', e);
    }

    // Render video
    try {
      renderVideo(ms);
    } catch (e) {
      console.error('renderVideo error:', e);
    }

    // Render carousel
    try {
      Carousel.render(index);
    } catch (e) {
      console.error('Carousel.render error:', e);
    }

    // Render documentation cards
    try { renderOverview(ms); } catch (e) { console.error('renderOverview error:', e); }
    try { renderComponents(ms); } catch (e) { console.error('renderComponents error:', e); }
    try { renderMath(ms); } catch (e) { console.error('renderMath error:', e); }
    try { renderData(ms); } catch (e) { console.error('renderData error:', e); }
    try { renderChallenges(ms); } catch (e) { console.error('renderChallenges error:', e); }
  }

  /* ──────────────────────────────────────────────
   *  MEDIA TABS (Video / Gallery toggle)
   * ────────────────────────────────────────────── */
  function initMediaTabs() {
    const btns = document.querySelectorAll('.media-tab-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const panelId = btn.dataset.panel;
        document.querySelectorAll('.media-panel').forEach(p => {
          p.classList.toggle('active', p.id === panelId);
        });
      });
    });
  }

  /* ──────────────────────────────────────────────
   *  SIDEBAR TOGGLE (mobile)
   * ────────────────────────────────────────────── */
  function initSidebarToggle() {
    $('sidebar-toggle').addEventListener('click', () => {
      $('sidebar').classList.toggle('open');
    });

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', e => {
      const sidebar = $('sidebar');
      const toggle = $('sidebar-toggle');
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  /* ──────────────────────────────────────────────
   *  CONTENT RENDERERS
   * ────────────────────────────────────────────── */

  /** Render video player or placeholder */
  function renderVideo(ms) {
    const container = $('video-wrapper-inner');
    const video = ms.media.videos[0];
    if (!video || !video.src || video.type === 'placeholder') {
      container.innerHTML = `
        <div class="video-wrapper">
          <div class="video-placeholder">
            <div class="play-icon">▶</div>
            <p><strong>${video?.title || 'Lab Demo Video'}</strong></p>
            <p class="text-muted" style="font-size:0.75rem;">
              Add your video path in <code>js/data.js</code><br>
              Supports MP4 files or YouTube embeds
            </p>
          </div>
        </div>`;
    } else if (video.src.includes('youtube') || video.src.includes('youtu.be')) {
      // YouTube embed
      const videoId = video.src.match(/(?:v=|youtu\.be\/)([\w-]+)/)?.[1] || '';
      container.innerHTML = `
        <div class="video-wrapper">
          <iframe
            width="100%" height="100%"
            src="https://www.youtube-nocookie.com/embed/${videoId}"
            title="${video.title}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            style="border-radius:var(--radius-sm);">
          </iframe>
        </div>`;
    } else {
      // Local MP4
      container.innerHTML = `
        <div class="video-wrapper">
          <video controls preload="metadata" ${video.poster ? `poster="${video.poster}"` : ''}>
            <source src="${video.src}" type="video/mp4">
            Your browser does not support HTML5 video.
          </video>
        </div>`;
    }
  }

  /** Render overview & objectives */
  function renderOverview(ms) {
    $('overview-body').innerHTML = `
      <p class="overview-summary">${ms.overview.summary}</p>
      <h4 style="font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--accent);margin-bottom:12px;">
        Learning Objectives
      </h4>
      <ul class="objectives-list">
        ${ms.overview.objectives.map(o => `<li>${o}</li>`).join('')}
      </ul>
    `;
  }

  /** Render schematic description & component table */
  function renderComponents(ms) {
    const s = ms.schematic;
    $('components-body').innerHTML = `
      <div class="schematic-description">${s.description}</div>
      <div class="data-table-wrapper">
        <table class="data-table" id="components-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Component</th>
              <th>Value</th>
              <th>Specifications</th>
              <th>Package</th>
            </tr>
          </thead>
          <tbody>
            ${s.components.map(c => `
              <tr>
                <td style="color:var(--accent);font-weight:600;">${c.ref}</td>
                <td style="font-family:'Inter',sans-serif;color:var(--text-primary);">${c.name}</td>
                <td>${c.value}</td>
                <td style="font-family:'Inter',sans-serif;font-size:0.78rem;">${c.specs}</td>
                <td>${c.package}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Render math formulas with KaTeX */
  function renderMath(ms) {
    $('math-body').innerHTML = `
      <div class="formula-grid">
        ${ms.formulas.map(f => `
          <div class="formula-card">
            <h4>${f.title}</h4>
            <div class="formula-display" data-latex="${encodeURIComponent(f.latex)}"></div>
            <p class="formula-description">${f.description}</p>
          </div>
        `).join('')}
      </div>
    `;

    // Render each formula via KaTeX
    document.querySelectorAll('.formula-display[data-latex]').forEach(el => {
      const latex = decodeURIComponent(el.dataset.latex);
      try {
        katex.render(latex, el, {
          displayMode: true,
          throwOnError: false,
          output: 'html'
        });
      } catch (err) {
        el.innerHTML = `<code style="color:var(--accent-red);">${latex}</code>`;
        console.warn('KaTeX render error:', err);
      }
    });
  }

  /** Render data comparison table */
  function renderData(ms) {
    const dt = ms.dataTable;
    $('data-body').innerHTML = `
      <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:16px;color:var(--text-primary);">
        ${dt.title}
      </h4>
      <div class="data-table-wrapper">
        <table class="data-table" id="data-comparison-table">
          <thead>
            <tr>${dt.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${dt.rows.map((row, ri) => `
              <tr>${row.map((cell, ci) => {
                let style = '';
                // Highlight error/quality columns with color coding
                const header = dt.headers[ci].toLowerCase();
                if (header.includes('error') || header.includes('%')) {
                  const val = parseFloat(cell);
                  if (!isNaN(val)) {
                    if (val <= 2) style = 'color:var(--accent-green);';
                    else if (val <= 4) style = 'color:var(--accent-amber);';
                    else style = 'color:var(--accent-red);';
                  }
                }
                if (header.includes('quality') && cell.includes('★')) {
                  const stars = (cell.match(/★/g) || []).length;
                  if (stars >= 4) style = 'color:var(--accent-green);';
                  else if (stars >= 3) style = 'color:var(--accent-amber);';
                  else style = 'color:var(--accent-red);';
                }
                return `<td style="${style}">${cell}</td>`;
              }).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /** Render challenges & troubleshooting */
  function renderChallenges(ms) {
    $('challenges-body').innerHTML = `
      <div class="challenges-grid">
        ${ms.challenges.map((ch, i) => `
          <div class="challenge-item" style="animation-delay:${i * 0.1}s">
            <div class="challenge-header">
              <span class="badge">Issue</span>
              <h4>${ch.issue}</h4>
            </div>
            <p class="challenge-description">${ch.description}</p>
            <div class="challenge-solution">
              <span class="sol-icon">✅</span>
              <p><strong>Solution:</strong> ${ch.solution}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

})();
