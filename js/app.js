/* ============================================================
   ELEG103 Medium-Wave Radio DIY Guide — App Controller
   Single-page application logic: navigation, rendering,
   interactive CAD toolbar, media tabs, CSV export, and
   scroll animations.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- tiny helpers ---------- */
  const $ = id => document.getElementById(id);
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ==========================================================
     1. Bootstrap — DOMContentLoaded
     ========================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    /* --- Navigation & scroll --- */
    initNavbar();
    initSmoothScroll();

    /* --- Hero Radio Station & Waveform Monitor --- */
    try { initHeroRadio(); } catch (e) { console.warn('initHeroRadio failed:', e); }

    /* --- Circuit CAD --- */
    try { CircuitDrawer.init(); } catch (e) { console.warn('CircuitDrawer.init failed:', e); }
    initCadToolbar();

    /* --- Lightbox & gallery --- */
    try { Carousel.initLightbox(); } catch (e) { console.warn('Carousel.initLightbox failed:', e); }
    try { Carousel.render(0); } catch (e) { console.warn('Carousel.render failed:', e); }

    /* --- Media tabs --- */
    initMediaTabs();

    /* --- Interactive Lab Notes Slider --- */
    try { initLabNotesSlider(); } catch (e) { console.warn('initLabNotesSlider failed:', e); }

    /* --- Milestone 1 content sections --- */
    const ms = (typeof MILESTONES !== 'undefined' && MILESTONES[0]) ? MILESTONES[0] : null;

    if (ms) {
      try { renderVideo(ms); }       catch (e) { console.warn('renderVideo failed:', e); }
      try { renderOverview(ms); }    catch (e) { console.warn('renderOverview failed:', e); }
      try { renderComponents(ms); }  catch (e) { console.warn('renderComponents failed:', e); }
      try { renderMath(ms); }        catch (e) { console.warn('renderMath failed:', e); }
      try { renderChallenges(ms); }  catch (e) { console.warn('renderChallenges failed:', e); }
    }

    /* --- CSV download --- */
    initCSVDownload();

    /* --- Scroll-triggered animations --- */
    initScrollAnimations();
  });

  /* ==========================================================
     2. initNavbar — sticky class + active link highlight
     ========================================================== */
  function initNavbar() {
    const nav = qs('.site-nav');
    if (!nav) return;

    const navLinks = qsa('.site-nav a[href^="#"]');
    const sections = navLinks
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    function onScroll() {
      /* Sticky shrink class */
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }

      /* Active link highlight */
      if (sections.length === 0) return;
      let current = sections[0];
      for (const sec of sections) {
        if (sec.getBoundingClientRect().top <= 120) {
          current = sec;
        }
      }
      const currentId = current.getAttribute('id');
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================================
     3. initSmoothScroll — anchor links
     ========================================================== */
  function initSmoothScroll() {
    document.addEventListener('click', e => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ==========================================================
     4. initCadToolbar — circuit CAD workbench action buttons
     ========================================================== */
  function initCadToolbar() {
    const frame = $('schematic-frame');
    const btnPaper = $('btn-theme-paper');
    const btnBlueprint = $('btn-theme-blueprint');

    if (btnPaper && btnBlueprint && frame) {
      btnPaper.addEventListener('click', () => {
        frame.classList.remove('theme-blueprint');
        btnPaper.classList.add('active');
        btnBlueprint.classList.remove('active');
      });

      btnBlueprint.addEventListener('click', () => {
        frame.classList.add('theme-blueprint');
        btnBlueprint.classList.add('active');
        btnPaper.classList.remove('active');
      });
    }

    const actions = {
      'btn-cad-export':     () => { if (window.CircuitDrawer) CircuitDrawer.exportImage(); },
      'cad-tool-schematic': () => { if (window.CircuitDrawer) CircuitDrawer.loadMilestonePreset(0); },
    };

    Object.entries(actions).forEach(([id, fn]) => {
      const el = $(id);
      if (el) el.addEventListener('click', () => { try { fn(); } catch (_) { /* noop */ } });
    });
  }

  /* ==========================================================
     5. initMediaTabs — toggle video / gallery panels
     ========================================================== */
  function initMediaTabs() {
    const tabs = qsa('.media-tab');
    if (tabs.length === 0) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const panelId = tab.dataset.panel;

        /* Toggle active tab */
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        /* Toggle panels */
        qsa('.media-panel').forEach(panel => {
          const isTarget = panel.id === panelId;
          panel.classList.toggle('active', isTarget);
          panel.style.display = isTarget ? '' : 'none';
        });
      });
    });
  }

  /* ==========================================================
     6. renderVideo — milestone video embed
     ========================================================== */
  function renderVideo(ms) {
    const container = $('video-wrapper-inner');
    if (!container) return;
    if (!ms.media || !ms.media.videos || ms.media.videos.length === 0) return;

    const v = ms.media.videos[0];
    const videoUrl = v.src || v.url || '';
    let html = '';

    if (v.type === 'youtube' || videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) {
      /* Extract YouTube video ID */
      const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([^&?/]+)/);
      const vid = match ? match[1] : videoUrl;
      html = `
        <div class="video-responsive">
          <iframe src="https://www.youtube-nocookie.com/embed/${vid}?rel=0&mute=1"
                  title="${v.title || 'Milestone Video'}"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen></iframe>
        </div>`;
    } else if (videoUrl && (videoUrl.endsWith('.mp4') || v.type === 'video')) {
      html = `
        <div class="video-responsive">
          <video id="lab-main-video" controls muted playsinline preload="metadata">
            <source src="${videoUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>`;
    } else {
      html = `
        <div class="video-placeholder">
          <div class="placeholder-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>
          </div>
          <p>${v.title || 'Video Demonstration'}</p>
        </div>`;
    }

    container.innerHTML = html;

    /* Permanently enforce muted state all the time (user requested strictly muted) */
    const vidEl = $('lab-main-video');
    if (vidEl) {
      vidEl.muted = true;
      vidEl.volume = 0;
      vidEl.addEventListener('volumechange', () => {
        if (!vidEl.muted || vidEl.volume > 0) {
          vidEl.muted = true;
          vidEl.volume = 0;
        }
      });
      vidEl.addEventListener('play', () => {
        vidEl.muted = true;
        vidEl.volume = 0;
      });
    }
  }

  /* ==========================================================
     7. renderOverview — summary + learning objectives
     ========================================================== */
  function renderOverview(ms) {
    const body = $('overview-body');
    if (!body || !ms.overview) return;

    let html = '';

    if (ms.overview.summary) {
      html += `<p class="overview-summary">${ms.overview.summary}</p>`;
    }

    if (ms.overview.objectives && ms.overview.objectives.length) {
      html += `<h3>Learning Objectives</h3>`;
      html += `<ul class="objectives-list">`;
      ms.overview.objectives.forEach(obj => {
        html += `<li>${obj}</li>`;
      });
      html += `</ul>`;
    }

    body.innerHTML = html;
  }

  /* ==========================================================
     8. renderComponents — schematic description + table
     ========================================================== */
  function renderComponents(ms) {
    const body = $('components-body');
    if (!body || !ms.schematic) return;

    let html = '';

    if (ms.schematic.description) {
      html += `<div class="schematic-description"><p>${ms.schematic.description}</p></div>`;
    }

    if (ms.schematic.components && ms.schematic.components.length) {
      html += `
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Component</th>
                <th>Value</th>
                <th>Specifications</th>
                <th>Package</th>
              </tr>
            </thead>
            <tbody>`;

      ms.schematic.components.forEach(c => {
        html += `
              <tr>
                <td>${c.ref || ''}</td>
                <td>${c.name || c.component || ''}</td>
                <td>${c.value || ''}</td>
                <td>${c.specifications || c.specs || ''}</td>
                <td>${c.package || c.pkg || ''}</td>
              </tr>`;
      });

      html += `
            </tbody>
          </table>
        </div>`;
    }

    body.innerHTML = html;
  }

  /* ==========================================================
     9. renderMath — formula cards with KaTeX & clean fallback
     ========================================================== */
  function renderMath(ms) {
    const body = $('math-body');
    if (!body || !ms.formulas || ms.formulas.length === 0) return;

    // Clean mathematical representations
    const cleanFallbacks = [
      'f₀ = 1 / (2π√(LC))',
      'L (µH) = (r² · N²) / (9r + 10ℓ)',
      'Q = f₀ / Δf₃dB = (1/R)√(L/C)',
      '1/f_c ≪ R₁C₂ ≪ 1/f_m,max'
    ];

    let html = '<div class="formula-grid">';

    ms.formulas.forEach((f, i) => {
      const displayId = `formula-display-${i}`;
      const fallback = cleanFallbacks[i] || f.latex || '';
      html += `
        <div class="formula-card">
          <h4 class="formula-title">${f.title || f.name || 'Formula'}</h4>
          <div class="formula-display" id="${displayId}" data-latex="${encodeURIComponent(f.latex || '')}">
            <span class="math-fallback">${fallback}</span>
          </div>
          ${f.description ? `<p class="formula-desc">${f.description}</p>` : ''}
        </div>`;
    });

    html += '</div>';
    body.innerHTML = html;

    /* Robust KaTeX renderer with retry */
    function tryRenderKaTeX(attempts = 0) {
      if (typeof katex !== 'undefined') {
        ms.formulas.forEach((f, i) => {
          const el = $(`formula-display-${i}`);
          if (el && f.latex) {
            try {
              katex.render(f.latex, el, { displayMode: true, throwOnError: false, output: 'html' });
            } catch (e) {
              console.warn('KaTeX render error:', e);
            }
          }
        });
      } else if (attempts < 25) {
        setTimeout(() => tryRenderKaTeX(attempts + 1), 100);
      }
    }

    tryRenderKaTeX();
  }

  /* ==========================================================
     10. renderChallenges — issues, solutions, tips
     ========================================================== */
  function renderChallenges(ms) {
    const body = $('challenges-body');
    if (!body || !ms.challenges || ms.challenges.length === 0) return;

    let html = '<div class="challenges-grid">';

    ms.challenges.forEach(ch => {
      const issueLabel = ch.issue || ch.title || 'Issue';
      html += `
        <div class="challenge-item">
          <div class="challenge-header">
            <span class="badge">Issue</span>
            <h4 class="challenge-title">${issueLabel}</h4>
          </div>
          <p class="challenge-desc">${ch.description || ''}</p>
          ${ch.solution ? `
          <div class="challenge-solution">
            <span class="sol-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </span>
            <p><strong>Solution:</strong> ${ch.solution}</p>
          </div>` : ''}
        </div>`;
    });

    html += '</div>';
    body.innerHTML = html;
  }

  /* ==========================================================
     11. initCSVDownload — export M1 data tables as CSV
     ========================================================== */
  function initCSVDownload() {
    const btn = $('btn-download-csv');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const lines = [];

      /* ---- Table 4: M1 Predictions ---- */
      lines.push('Table 4: M1 Predictions');
      lines.push('Parameter,Value');
      lines.push('Prediction L,"291.45 µH"');
      lines.push('C for 819 kHz,"129.57 pF"');
      lines.push('f at 280 pF,"557 kHz"');
      lines.push('f at 20 pF,"2.08 MHz"');
      lines.push('RC,"50 µs (~49.5 µs)"');
      lines.push('');

      /* ---- Table 5: Tank Characteristics at TP1 ---- */
      lines.push('Table 5: Tank Characteristics at TP1 (Driven by Test Loop)');
      lines.push('Parameter,Value');
      lines.push("Band's low end,\"675.5 kHz\"");
      lines.push("Band's high end,\"1.2 MHz\"");
      lines.push('f0 at half travel,"830 kHz"');
      lines.push('flow,"197 kHz"');
      lines.push('fhigh,"1000 kHz"');
      lines.push('Tank Quality Factor (Q),"1.033"');
      lines.push('');

      /* ---- Table 6: Detector Performance ---- */
      lines.push('Table 6: Detector Performance at f0 (TP1 Peak vs TP3 DC)');
      lines.push('Source (V),TP1 Peak (mV),TP3 DC (mV)');
      lines.push('0.05,90,0');
      lines.push('0.1,120,3');
      lines.push('0.2,215,42');
      lines.push('0.3,330,112');
      lines.push('0.5,520,260');
      lines.push('1.0,1020,707');

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'milestone1_data.csv';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      /* Clean up */
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    });
  }

  /* ==========================================================
     13. initHeroRadio — AM Radio Tuner & Waveform Animation
     ========================================================== */
  function initHeroRadio() {
    const canvas = $('hero-radio-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const slider = $('hero-tuning-slider');
    const needle = $('hero-dial-needle');
    const statusText = $('hero-radio-status');
    const freqVal = $('hero-freq-val');
    const btnAm = $('btn-mode-am');
    const btnDemod = $('btn-mode-demod');
    const vuBars = qsa('.vu-bar');

    let currentFreq = 819; // Target MW frequency
    let mode = 'am'; // 'am' or 'demod'
    let time = 0;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
      }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function updateTuning(val) {
      currentFreq = parseFloat(val);
      if (freqVal) freqVal.textContent = `${Math.round(currentFreq)} kHz`;

      // Position needle on dial (range 530 - 1400 kHz)
      if (needle) {
        const pct = Math.max(0, Math.min(100, ((currentFreq - 530) / (1400 - 530)) * 100));
        needle.style.left = `${pct}%`;
      }

      // Check resonance proximity (819 kHz)
      const delta = Math.abs(currentFreq - 819);
      if (statusText) {
        if (delta <= 12) {
          statusText.textContent = `TUNED · ${currentFreq.toFixed(1)} kHz`;
          if (statusText.parentElement) {
            statusText.parentElement.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          }
          statusText.style.color = '#10b981';
        } else {
          statusText.textContent = `SEEKING · ${currentFreq.toFixed(1)} kHz`;
          if (statusText.parentElement) {
            statusText.parentElement.style.borderColor = 'rgba(245, 158, 11, 0.3)';
          }
          statusText.style.color = '#f59e0b';
        }
      }
    }

    if (slider) {
      slider.addEventListener('input', e => updateTuning(e.target.value));
      updateTuning(slider.value);
    }

    if (btnAm) {
      btnAm.addEventListener('click', () => {
        mode = 'am';
        btnAm.classList.add('active');
        if (btnDemod) btnDemod.classList.remove('active');
      });
    }
    if (btnDemod) {
      btnDemod.addEventListener('click', () => {
        mode = 'demod';
        btnDemod.classList.add('active');
        if (btnAm) btnAm.classList.remove('active');
      });
    }

    function drawRadioScope() {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        requestAnimationFrame(drawRadioScope);
        return;
      }

      ctx.save();
      // Phosphor dark CRT background
      ctx.fillStyle = '#080c14';
      ctx.fillRect(0, 0, w, h);

      // Oscilloscope graticule grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      const stepX = w / 10;
      const stepY = h / 6;

      ctx.beginPath();
      for (let x = 0; x <= w; x += stepX) {
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
      }
      for (let y = 0; y <= h; y += stepY) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
      }
      ctx.stroke();

      // Center crosshair lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2 + 0.5); ctx.lineTo(w, h / 2 + 0.5);
      ctx.moveTo(w / 2 + 0.5, 0); ctx.lineTo(w / 2 + 0.5, h);
      ctx.stroke();

      // Signal resonance selectivity factor (LC Tank Bandpass Response)
      const delta = Math.abs(currentFreq - 819);
      const resonanceGain = 1 / Math.sqrt(1 + Math.pow(delta / 32, 2));
      const effectiveGain = Math.max(0.08, resonanceGain);

      // Time progression
      time += 0.04;
      const centerY = h / 2;
      const maxAmp = (h * 0.38) * effectiveGain;

      // Draw Waveform
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 8;

      if (mode === 'am') {
        // Full AM Modulated RF Carrier: s(t) = [1 + m*cos(wm*t)] * cos(wc*t)
        // Upper & Lower Audio Envelopes (amber)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
        ctx.setLineDash([4, 4]);

        // Upper envelope
        ctx.beginPath();
        for (let x = 0; x < w; x += 2) {
          const tAudio = (x / w) * 4 * Math.PI + time * 1.2;
          const envelope = 1 + 0.7 * Math.sin(tAudio);
          const y = centerY - (maxAmp * 0.6 * envelope);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Lower envelope
        ctx.beginPath();
        for (let x = 0; x < w; x += 2) {
          const tAudio = (x / w) * 4 * Math.PI + time * 1.2;
          const envelope = 1 + 0.7 * Math.sin(tAudio);
          const y = centerY + (maxAmp * 0.6 * envelope);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.setLineDash([]); // solid line

        // High-Frequency RF Carrier within envelope (cyan trace)
        ctx.strokeStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.beginPath();
        for (let x = 0; x < w; x += 1.5) {
          const tAudio = (x / w) * 4 * Math.PI + time * 1.2;
          const tCarrier = (x / w) * 48 * Math.PI + time * 8;
          const envelope = 1 + 0.7 * Math.sin(tAudio);
          const noise = (1 - effectiveGain) * (Math.random() - 0.5) * 8;
          const y = centerY + Math.sin(tCarrier) * (maxAmp * 0.6 * envelope) + noise;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();

      } else {
        // Demodulated 1 kHz Audio Output at TP3
        ctx.strokeStyle = '#f59e0b';
        ctx.shadowColor = '#f59e0b';
        ctx.beginPath();
        for (let x = 0; x < w; x += 2) {
          const tAudio = (x / w) * 4 * Math.PI + time * 1.2;
          const audio = Math.sin(tAudio);
          const ripple = Math.sin((x / w) * 48 * Math.PI + time * 8) * (maxAmp * 0.05);
          const y = centerY - (audio * maxAmp * 0.8) + ripple;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();

      // Animate VU meter bars
      if (vuBars.length > 0) {
        vuBars.forEach((bar, idx) => {
          const wobble = Math.sin(time * 3 + idx * 0.8) * 0.15;
          const pct = Math.max(10, Math.min(95, (effectiveGain + wobble) * 100));
          bar.style.height = `${pct}%`;
        });
      }

      requestAnimationFrame(drawRadioScope);
    }

    drawRadioScope();
  }

  /* ==========================================================
     14. initLabNotesSlider — Draggable Slider Button for Notes
     ========================================================== */
  function initLabNotesSlider() {
    const track = $('slider-drag-track');
    const thumb = $('slider-drag-thumb');
    const drawer = $('lab-notes-drawer');
    const labelText = $('slider-drag-text');
    if (!track || !thumb || !drawer) return;

    let isOpen = false;
    let isDragging = false;
    let startX = 0;
    let currentX = 0;

    function setDrawerState(open) {
      isOpen = open;
      if (isOpen) {
        track.classList.add('unlocked');
        drawer.classList.add('open');
        const maxSlide = track.clientWidth - thumb.clientWidth - 8;
        thumb.style.transform = `translateX(${maxSlide}px)`;
        if (labelText) labelText.textContent = 'Click or drag slider back to close lab notes';
      } else {
        track.classList.remove('unlocked');
        drawer.classList.remove('open');
        thumb.style.transform = 'translateX(0px)';
        if (labelText) labelText.textContent = 'Slide / Drag or click to view laboratory measurement notes';
      }
    }

    // Click toggle
    track.addEventListener('click', () => {
      if (isDragging) return;
      setDrawerState(!isOpen);
    });

    // Mouse drag
    thumb.addEventListener('mousedown', e => {
      isDragging = true;
      startX = e.clientX;
      thumb.style.transition = 'none';
      e.stopPropagation();
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const maxSlide = track.clientWidth - thumb.clientWidth - 8;
      const deltaX = e.clientX - startX;
      currentX = isOpen ? Math.max(0, Math.min(maxSlide, maxSlide + deltaX)) : Math.max(0, Math.min(maxSlide, deltaX));
      thumb.style.transform = `translateX(${currentX}px)`;
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      thumb.style.transition = '';
      const maxSlide = track.clientWidth - thumb.clientWidth - 8;
      if (currentX > maxSlide * 0.4) {
        setDrawerState(true);
      } else {
        setDrawerState(false);
      }
    });

    // Touch drag support
    thumb.addEventListener('touchstart', e => {
      isDragging = true;
      startX = e.touches[0].clientX;
      thumb.style.transition = 'none';
      e.stopPropagation();
    }, { passive: true });

    window.addEventListener('touchmove', e => {
      if (!isDragging) return;
      const maxSlide = track.clientWidth - thumb.clientWidth - 8;
      const deltaX = e.touches[0].clientX - startX;
      currentX = isOpen ? Math.max(0, Math.min(maxSlide, maxSlide + deltaX)) : Math.max(0, Math.min(maxSlide, deltaX));
      thumb.style.transform = `translateX(${currentX}px)`;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      thumb.style.transition = '';
      const maxSlide = track.clientWidth - thumb.clientWidth - 8;
      if (currentX > maxSlide * 0.4) {
        setDrawerState(true);
      } else {
        setDrawerState(false);
      }
    });
  }

})();
