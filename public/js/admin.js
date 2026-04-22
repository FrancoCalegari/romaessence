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
});

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
