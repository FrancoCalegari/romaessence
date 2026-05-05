/* ── ADMIN JS ── Esencia builder, Tags chips, Previews ── */

document.addEventListener('DOMContentLoaded', () => {

  // ── ESENCIA BUILDER ────────────────────────────────────
  const esenciaContainer = document.getElementById('esencia-rows');
  const esenciaHidden = document.getElementById('esencia-json');
  const addEsenciaBtn = document.getElementById('add-esencia-btn');

  function updateEsenciaJSON() {
    if (!esenciaContainer || !esenciaHidden) return;
    const obj = {};
    esenciaContainer.querySelectorAll('.esencia-row-input').forEach(row => {
      const nameInput = row.querySelector('.esencia-name-input');
      const slider = row.querySelector('.esencia-slider');
      const name = nameInput?.value.trim();
      if (name) obj[name] = parseInt(slider?.value || 5);
    });
    esenciaHidden.value = JSON.stringify(obj);
  }

  function createEsenciaRow(name = '', value = 5) {
    const div = document.createElement('div');
    div.className = 'esencia-row-input';
    div.innerHTML = `
      <input type="text" class="form-control esencia-name-input" placeholder="ej: dulce" value="${escHtml(name)}">
      <div class="esencia-slider-wrap">
        <input type="range" class="esencia-slider" min="0" max="10" value="${value}">
        <span class="esencia-slider-val">${value}</span>
      </div>
      <button type="button" class="btn-remove-note" title="Eliminar nota">✕</button>
    `;
    const slider = div.querySelector('.esencia-slider');
    const valDisplay = div.querySelector('.esencia-slider-val');
    slider.addEventListener('input', () => {
      valDisplay.textContent = slider.value;
      updateEsenciaJSON();
    });
    div.querySelector('.btn-remove-note').addEventListener('click', () => {
      div.remove();
      updateEsenciaJSON();
    });
    div.querySelector('.esencia-name-input').addEventListener('input', updateEsenciaJSON);
    return div;
  }

  addEsenciaBtn?.addEventListener('click', () => {
    const row = createEsenciaRow();
    esenciaContainer.appendChild(row);
  });

  // Load existing esencia data
  if (esenciaHidden && esenciaContainer) {
    try {
      const existing = JSON.parse(esenciaHidden.value || '{}');
      Object.entries(existing).forEach(([name, val]) => {
        esenciaContainer.appendChild(createEsenciaRow(name, val));
      });
    } catch {}
    updateEsenciaJSON();
  }

  // ── TAGS CHIPS ─────────────────────────────────────────
  const tagsWrap = document.querySelector('.tags-input-wrap');
  const tagsInput = document.querySelector('.tags-input');
  const tagsHidden = document.getElementById('tags-json');

  function updateTagsJSON() {
    if (!tagsHidden) return;
    const tags = [...document.querySelectorAll('.tag-pill')].map(p => p.dataset.tag);
    tagsHidden.value = JSON.stringify(tags);
  }

  function addTag(value) {
    const tag = value.trim().replace(/^#/, '');
    if (!tag || document.querySelector(`.tag-pill[data-tag="${tag}"]`)) return;
    const pill = document.createElement('span');
    pill.className = 'tag-pill';
    pill.dataset.tag = tag;
    pill.innerHTML = `#${escHtml(tag)} <button type="button">×</button>`;
    pill.querySelector('button').addEventListener('click', () => { pill.remove(); updateTagsJSON(); });
    tagsWrap?.insertBefore(pill, tagsInput);
    updateTagsJSON();
  }

  tagsInput?.addEventListener('keydown', e => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      addTag(tagsInput.value);
      tagsInput.value = '';
    }
    if (e.key === 'Backspace' && !tagsInput.value) {
      const pills = document.querySelectorAll('.tag-pill');
      pills[pills.length - 1]?.remove();
      updateTagsJSON();
    }
  });

  tagsWrap?.addEventListener('click', () => tagsInput?.focus());

  // Load existing tags
  if (tagsHidden && tagsInput) {
    try {
      const existing = JSON.parse(tagsHidden.value || '[]');
      existing.forEach(t => addTag(t));
    } catch {}
  }

  // ── IMAGE PREVIEWS ─────────────────────────────────────
  function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-height:200px;border-radius:8px;">`;
      };
      reader.readAsDataURL(file);
    });
  }

  setupImagePreview('photo-input', 'photo-preview');
  setupImagePreview('banner-input', 'banner-preview');
  setupImagePreview('promo-image-input', 'promo-preview');

  // Multiple extra images preview
  const extraInput = document.getElementById('extra-images-input');
  const extraPreview = document.getElementById('extra-preview');
  extraInput?.addEventListener('change', () => {
    if (!extraPreview) return;
    extraPreview.innerHTML = '';
    [...extraInput.files].forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const div = document.createElement('div');
        div.className = 'upload-thumb';
        div.innerHTML = `<img src="${e.target.result}" alt="">`;
        extraPreview.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  });

  // ── CONFIRM DELETE ─────────────────────────────────────
  document.querySelectorAll('[data-confirm]').forEach(btn => {
    btn.addEventListener('click', e => {
      if (!confirm(btn.dataset.confirm || '¿Estás seguro?')) e.preventDefault();
    });
  });

  // ── TOGGLE ACTIVE (AJAX) ───────────────────────────────
  document.querySelectorAll('[data-toggle-url]').forEach(toggle => {
    toggle.addEventListener('change', async () => {
      try {
        const res = await fetch(toggle.dataset.toggleUrl, { method: 'PATCH' });
        const data = await res.json();
        if (!data.success) toggle.checked = !toggle.checked;
      } catch {
        toggle.checked = !toggle.checked;
      }
    });
  });

  // Upload area drag & drop visual
  document.querySelectorAll('.upload-area').forEach(area => {
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', e => {
      e.preventDefault();
      area.classList.remove('drag-over');
      const input = area.querySelector('input[type=file]');
      if (input) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
    area.addEventListener('click', () => area.querySelector('input[type=file]')?.click());
  });

  // ── AI BANNER MODAL ─────────────────────────────────────
  const aiModal = document.getElementById('ai-modal');
  const aiBannerBtn = document.getElementById('ai-banner-btn');
  const aiModalClose = document.getElementById('ai-modal-close');
  const aiGenerateBtn = document.getElementById('ai-generate-btn');
  const aiGenerateAnother = document.getElementById('ai-generate-another');
  const aiUseImage = document.getElementById('ai-use-image');
  const aiLoading = document.getElementById('ai-loading');
  const aiError = document.getElementById('ai-error');
  const aiCarouselSection = document.getElementById('ai-carousel-section');
  const aiCarouselTrack = document.getElementById('ai-carousel-track');
  const aiCarouselDots = document.getElementById('ai-carousel-dots');
  const aiPrev = document.getElementById('ai-prev');
  const aiNext = document.getElementById('ai-next');

  let aiImages = []; // Array of { mimeType, data } base64 images
  let aiCurrentIndex = 0;

  // Format selector (shared logic for modal and stories page)
  document.querySelectorAll('.ai-format-grid').forEach(grid => {
    grid.querySelectorAll('.ai-format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.ai-format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });

  // Open AI modal
  aiBannerBtn?.addEventListener('click', () => {
    // Check if there's a photo to use
    const photoInput = document.getElementById('photo-input');
    const existingPhotoId = aiBannerBtn.dataset.photoId;
    const hasNewPhoto = photoInput?.files?.length > 0;

    if (!existingPhotoId && !hasNewPhoto) {
      alert('Primero subí una foto principal del producto para poder generar un banner con IA.');
      return;
    }

    // Update product name from form
    const nameInput = document.getElementById('name');
    if (nameInput) {
      aiBannerBtn.dataset.productName = nameInput.value;
    }

    aiModal?.showModal();
  });

  // Close AI modal
  aiModalClose?.addEventListener('click', () => aiModal?.close());
  aiModal?.addEventListener('click', e => {
    if (e.target === aiModal) aiModal.close();
  });

  // Reset modal state on close
  aiModal?.addEventListener('close', () => {
    aiError?.classList.add('hidden');
    aiLoading?.classList.add('hidden');
  });

  // Get selected format from a container
  function getSelectedFormat(container) {
    const active = (container || document).querySelector('.ai-format-btn.active');
    return active?.dataset.format || '16:9';
  }

  // Render carousel
  function renderAICarousel() {
    if (!aiCarouselTrack || !aiCarouselDots) return;
    if (aiImages.length === 0) {
      aiCarouselSection?.classList.add('hidden');
      return;
    }

    aiCarouselSection?.classList.remove('hidden');

    // Show current image
    const img = aiImages[aiCurrentIndex];
    aiCarouselTrack.innerHTML = `<img src="data:${img.mimeType};base64,${img.data}" alt="Banner generado ${aiCurrentIndex + 1}">`;

    // Render dots
    aiCarouselDots.innerHTML = '';
    aiImages.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `ai-carousel-dot ${i === aiCurrentIndex ? 'active' : ''}`;
      dot.addEventListener('click', () => {
        aiCurrentIndex = i;
        renderAICarousel();
      });
      aiCarouselDots.appendChild(dot);
    });
  }

  // Carousel navigation
  aiPrev?.addEventListener('click', () => {
    if (aiImages.length === 0) return;
    aiCurrentIndex = (aiCurrentIndex - 1 + aiImages.length) % aiImages.length;
    renderAICarousel();
  });

  aiNext?.addEventListener('click', () => {
    if (aiImages.length === 0) return;
    aiCurrentIndex = (aiCurrentIndex + 1) % aiImages.length;
    renderAICarousel();
  });

  // Generate banner
  async function generateBanner() {
    const photoInput = document.getElementById('photo-input');
    const existingPhotoId = aiBannerBtn?.dataset.photoId;
    let imageFileId = existingPhotoId;

    // If user uploaded a new photo but hasn't saved yet, we need the existing one
    if (!imageFileId) {
      aiError.textContent = '⚠ Necesitás guardar el producto con una foto primero, o estar editando un producto existente con imagen.';
      aiError.classList.remove('hidden');
      return;
    }

    const modalContainer = aiModal;
    const format = getSelectedFormat(modalContainer);
    const prompt = document.getElementById('ai-prompt')?.value || '';
    const includeTitle = document.getElementById('ai-include-title')?.checked || false;
    const customText = document.getElementById('ai-custom-text')?.value || '';
    const productName = aiBannerBtn?.dataset.productName || '';

    // Show loading
    aiLoading?.classList.remove('hidden');
    aiError?.classList.add('hidden');
    aiGenerateBtn?.setAttribute('disabled', '');

    try {
      const res = await fetch('/admin/api/generate-banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageFileId, prompt, format, includeTitle, customText, productName })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al generar imagen');
      }

      // Add to carousel
      aiImages.push(data.image);
      aiCurrentIndex = aiImages.length - 1;
      renderAICarousel();
    } catch (err) {
      if (aiError) {
        aiError.textContent = `⚠ ${err.message}`;
        aiError.classList.remove('hidden');
      }
    } finally {
      aiLoading?.classList.add('hidden');
      aiGenerateBtn?.removeAttribute('disabled');
    }
  }

  aiGenerateBtn?.addEventListener('click', generateBanner);
  aiGenerateAnother?.addEventListener('click', generateBanner);

  // Use selected image as banner
  aiUseImage?.addEventListener('click', () => {
    if (aiImages.length === 0) return;
    const img = aiImages[aiCurrentIndex];

    // Convert base64 to blob and assign to banner input
    const byteString = atob(img.data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: img.mimeType });
    const file = new File([blob], `ai-banner-${Date.now()}.png`, { type: img.mimeType });

    // Assign to banner input using DataTransfer
    const bannerInput = document.getElementById('banner-input');
    if (bannerInput) {
      const dt = new DataTransfer();
      dt.items.add(file);
      bannerInput.files = dt.files;
      bannerInput.dispatchEvent(new Event('change'));
    }

    // Also show preview
    const bannerPreview = document.getElementById('banner-preview');
    if (bannerPreview) {
      bannerPreview.innerHTML = `<img src="data:${img.mimeType};base64,${img.data}" alt="AI Banner" style="max-height:200px;border-radius:8px;width:100%;object-fit:cover;">`;
    }

    // Close modal
    aiModal?.close();

    // Reset for next use
    aiImages = [];
    aiCurrentIndex = 0;
  });

  // ── STORIES PAGE ──────────────────────────────────────────
  const storyGrid = document.getElementById('story-products-grid');
  const storyGenerateBtn = document.getElementById('story-generate-btn');
  const storySelectedCount = document.getElementById('story-selected-count');
  const storyLoading = document.getElementById('story-loading');
  const storyError = document.getElementById('story-error');
  const storyResults = document.getElementById('story-results');
  const storyResultCarousel = document.getElementById('story-result-carousel');
  const storyGenerateAnother = document.getElementById('story-generate-another');
  const storyDownloadBtn = document.getElementById('story-download-btn');

  let storyImages = [];
  let storyCurrentIndex = 0;

  // Product selection
  storyGrid?.addEventListener('change', () => {
    const checked = storyGrid.querySelectorAll('.story-product-check:checked');
    const count = checked.length;
    if (storySelectedCount) storySelectedCount.textContent = `${count} seleccionado${count !== 1 ? 's' : ''}`;
    if (storyGenerateBtn) storyGenerateBtn.disabled = count === 0;
  });

  // Click on product card toggles checkbox
  storyGrid?.querySelectorAll('.story-product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.tagName === 'INPUT') return;
      const checkbox = card.querySelector('.story-product-check');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  // Generate story
  async function generateStory() {
    const checked = storyGrid?.querySelectorAll('.story-product-check:checked') || [];
    const productIds = [...checked].map(cb => cb.value);

    if (productIds.length === 0) return;

    const format = getSelectedFormat(document.querySelector('.card .ai-format-grid'));
    const prompt = document.getElementById('story-prompt')?.value || '';
    const customText = document.getElementById('story-custom-text')?.value || '';

    storyLoading?.classList.remove('hidden');
    storyError?.classList.add('hidden');
    storyGenerateBtn?.setAttribute('disabled', '');

    try {
      const res = await fetch('/admin/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds, prompt, format, customText })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al generar imagen');
      }

      storyImages.push(data.image);
      storyCurrentIndex = storyImages.length - 1;
      renderStoryResult();
      storyResults?.classList.remove('hidden');
    } catch (err) {
      if (storyError) {
        storyError.textContent = `⚠ ${err.message}`;
        storyError.classList.remove('hidden');
      }
    } finally {
      storyLoading?.classList.add('hidden');
      storyGenerateBtn?.removeAttribute('disabled');
    }
  }

  function renderStoryResult() {
    if (!storyResultCarousel || storyImages.length === 0) return;
    const img = storyImages[storyCurrentIndex];
    storyResultCarousel.innerHTML = `<img src="data:${img.mimeType};base64,${img.data}" alt="Historia generada">`;
  }

  storyGenerateBtn?.addEventListener('click', generateStory);
  storyGenerateAnother?.addEventListener('click', generateStory);

  // Download story image
  storyDownloadBtn?.addEventListener('click', () => {
    if (storyImages.length === 0) return;
    const img = storyImages[storyCurrentIndex];
    const ext = img.mimeType.includes('png') ? 'png' : 'jpg';
    const link = document.createElement('a');
    link.href = `data:${img.mimeType};base64,${img.data}`;
    link.download = `romaessence-historia-${Date.now()}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

});

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

