/**
 * AM Radio Project — Image Carousel & Lightbox Module
 * =====================================================
 * Provides a thumbnail strip, main preview, and fullscreen lightbox.
 * Depends on MILESTONES from data.js.
 */

/* global MILESTONES */

const Carousel = (function () {
  'use strict';

  let images = [];
  let currentIndex = 0;
  let lightboxOpen = false;

  /* ── DOM refs (cached on first render) ── */
  const $ = id => document.getElementById(id);

  /* ── Render carousel for given milestone ── */
  function render(milestoneIndex) {
    images = MILESTONES[milestoneIndex].media.images || [];
    currentIndex = 0;

    const container = $('gallery-content');
    if (!container) return;

    if (images.length === 0) {
      container.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--text-muted);font-size:0.85rem;">
          <p style="margin-bottom:12px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </p>
          <p>No gallery images configured for this milestone.</p>
          <p style="margin-top:8px;font-size:0.75rem;">Add image paths in <code>js/data.js</code></p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="carousel-container">
        <div class="carousel-main" id="carousel-main">
          <img id="carousel-img" src="${images[0].src}" alt="${images[0].alt}" />
          <div class="carousel-overlay">
            <span class="carousel-zoom-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Click to Enlarge
            </span>
            <p class="carousel-caption" id="carousel-caption">${images[0].title}</p>
          </div>
          <button class="carousel-nav prev" id="carousel-prev" aria-label="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button class="carousel-nav next" id="carousel-next" aria-label="Next">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="carousel-strip" id="carousel-strip">
          ${images.map((img, i) => `
            <div class="carousel-thumb ${i === 0 ? 'active' : ''}" data-index="${i}">
              <img src="${img.src}" alt="${img.alt}" loading="lazy" />
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Bind events
    $('carousel-prev').addEventListener('click', () => go(currentIndex - 1));
    $('carousel-next').addEventListener('click', () => go(currentIndex + 1));

    $('carousel-strip').addEventListener('click', e => {
      const thumb = e.target.closest('.carousel-thumb');
      if (thumb) go(parseInt(thumb.dataset.index, 10));
    });

    // Click main image → open lightbox
    $('carousel-img').addEventListener('click', () => openLightbox(currentIndex));
  }

  /* ── Navigate carousel ── */
  function go(idx) {
    if (images.length === 0) return;
    currentIndex = ((idx % images.length) + images.length) % images.length;

    const img = $('carousel-img');
    const cap = $('carousel-caption');
    if (img) {
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = images[currentIndex].src;
        img.alt = images[currentIndex].alt;
        img.style.opacity = '1';
      }, 200);
    }
    if (cap) cap.textContent = images[currentIndex].title;

    // Update active thumb
    const thumbs = document.querySelectorAll('.carousel-thumb');
    thumbs.forEach((t, i) => t.classList.toggle('active', i === currentIndex));

    // Scroll thumb into view
    const activeThumb = thumbs[currentIndex];
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  /* ── Lightbox ── */
  function openLightbox(idx) {
    if (images.length === 0) return;
    currentIndex = idx;
    lightboxOpen = true;

    const overlay = $('lightbox');
    const lbImg   = $('lightbox-img');
    const lbCap   = $('lightbox-caption');

    lbImg.src = images[currentIndex].src;
    lbImg.alt = images[currentIndex].alt;
    lbCap.textContent = images[currentIndex].title;
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightboxOpen = false;
    const overlay = $('lightbox');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  function lightboxNav(dir) {
    if (!lightboxOpen || images.length === 0) return;
    currentIndex = ((currentIndex + dir) % images.length + images.length) % images.length;
    const lbImg = $('lightbox-img');
    const lbCap = $('lightbox-caption');
    lbImg.src = images[currentIndex].src;
    lbImg.alt = images[currentIndex].alt;
    lbCap.textContent = images[currentIndex].title;
    // Also sync carousel
    go(currentIndex);
  }

  /* ── Init lightbox listeners (once) ── */
  function initLightbox() {
    $('lightbox-close').addEventListener('click', closeLightbox);
    $('lightbox-prev').addEventListener('click', () => lightboxNav(-1));
    $('lightbox-next').addEventListener('click', () => lightboxNav(1));

    // Close on overlay click
    $('lightbox').addEventListener('click', e => {
      if (e.target === $('lightbox') || e.target.classList.contains('lightbox-overlay')) {
        closeLightbox();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      if (!lightboxOpen) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft')  lightboxNav(-1);
      if (e.key === 'ArrowRight') lightboxNav(1);
    });
  }

  return { render, initLightbox };
})();
