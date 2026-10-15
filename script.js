import QRCode from 'qrcode';
import {
  normalizeUrl,
  isEmail,
  urlLabel,
  buildCardUrl,
  decodeCard,
  hasCardData,
  renderCard,
} from './card.js';

(function () {
  const form = document.getElementById('form');
  const input = document.getElementById('url');
  const error = document.getElementById('error');
  const darkInput = document.getElementById('dark');
  const lightInput = document.getElementById('light');
  const shapeInput = document.getElementById('shape');
  const svgHost = document.getElementById('svg-host');
  const canvas = document.getElementById('canvas');
  const download = document.getElementById('download');
  const logoPick = document.getElementById('logo-pick');
  const logoInput = document.getElementById('logo-input');
  const logoRemove = document.getElementById('logo-remove');
  const logoPreview = document.getElementById('logo-preview');
  const editor = document.getElementById('editor');
  const editorViewport = document.getElementById('editor-viewport');
  const editorImage = document.getElementById('editor-image');
  const editorZoom = document.getElementById('editor-zoom');
  const editorApply = document.getElementById('editor-apply');
  const editorCancel = document.getElementById('editor-cancel');
  const tabs = document.getElementById('tabs');
  const appTitle = document.getElementById('app-title');
  const views = {
    qr: document.getElementById('view-qr'),
    card: document.getElementById('view-card'),
    viewer: document.getElementById('view-viewer'),
  };
  const cardForm = document.getElementById('card-form');
  const cardPreview = document.getElementById('card-preview');
  const cardSvgHost = document.getElementById('card-svg-host');
  const cardCanvas = document.getElementById('card-canvas');
  const cardDownload = document.getElementById('card-download');
  const cardError = document.getElementById('card-error');
  const viewerCard = document.getElementById('viewer-card');
  const viewerHome = document.getElementById('viewer-home');
  const cardFields = {
    name: document.getElementById('c-name'),
    last: document.getElementById('c-last'),
    role: document.getElementById('c-role'),
    desc: document.getElementById('c-desc'),
    email: document.getElementById('c-email'),
    phone: document.getElementById('c-phone'),
    web: document.getElementById('c-web'),
    linkedin: document.getElementById('c-li'),
    instagram: document.getElementById('c-ig'),
    x: document.getElementById('c-x'),
    photo: document.getElementById('c-photo'),
    bg: document.getElementById('c-bg'),
    fg: document.getElementById('c-fg'),
  };

  const QR_SIZE = 512;
  const MODULE_MARGIN = 4;
  const LOGO_RATIO = 0.22;
  const LOGO_OUTPUT = 256;
  const MAX_CARD_URL = 1000;

  let logoDataURL = '';
  let currentText = '';
  let cardQrLight = '#ffffff';

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
  }

  function clearError() {
    error.hidden = true;
  }

  function showCardError(message) {
    cardError.textContent = message;
    cardError.hidden = false;
  }

  function clearCardError() {
    cardError.hidden = true;
  }

  function fileName() {
    const host = input.value
      .trim()
      .replace(/^[a-z]+:\/\//i, '')
      .split('/')[0]
      .replace(/[^a-z0-9.-]/gi, '-')
      .slice(0, 50);

    return `${host || 'qr'}.jpg`;
  }

  function svgToDataURL(svg) {
    const encoded = encodeURIComponent(svg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }

  function shapePath(shape, cx, cy, r) {
    const rr = r;
    switch (shape) {
      case 'circle':
        return `<circle cx="${cx}" cy="${cy}" r="${rr / 2}"/>`;
      default:
        return `<rect x="${cx - rr / 2}" y="${cy - rr / 2}" width="${rr}" height="${rr}"/>`;
    }
  }

  function buildQrSvg(text, options) {
    const opts = Object.assign(
      {
        size: QR_SIZE,
        margin: MODULE_MARGIN,
        dark: '#000000',
        light: '#ffffff',
        shape: 'square',
        ecc: 'Q',
        logo: '',
      },
      options
    );

    const qrData = QRCode.create(text, { errorCorrectionLevel: opts.ecc });
    const size = qrData.modules.size;
    const data = qrData.modules.data;
    const moduleSize = opts.size / (size + opts.margin * 2);
    const margin = moduleSize * opts.margin;
    let shapes = '';

    for (let i = 0; i < data.length; i++) {
      if (!data[i]) continue;
      const col = i % size;
      const row = Math.floor(i / size);
      const cx = margin + col * moduleSize + moduleSize / 2;
      const cy = margin + row * moduleSize + moduleSize / 2;
      shapes += shapePath(opts.shape, cx, cy, moduleSize);
    }

    let overlay = '';
    if (opts.logo) {
      const logoSize = opts.size * LOGO_RATIO;
      const pad = moduleSize;
      const box = logoSize / 2 + pad;
      const center = opts.size / 2;
      overlay =
        `<rect x="${center - box}" y="${center - box}" width="${box * 2}" height="${box * 2}" rx="${pad * 1.5}" fill="${opts.light}"/>` +
        `<image x="${center - logoSize / 2}" y="${center - logoSize / 2}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" href="${opts.logo}"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.size}" height="${opts.size}" viewBox="0 0 ${opts.size} ${opts.size}" shape-rendering="geometricPrecision"><rect x="0" y="0" width="${opts.size}" height="${opts.size}" fill="${opts.light}"/><g fill="${opts.dark}">${shapes}</g>${overlay}</svg>`;
  }

  function renderSvg(svg, host) {
    host.innerHTML = svg;
    host.hidden = false;
  }

  function rasterize(svg, background, targetCanvas, type) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ctx = targetCanvas.getContext('2d');
        targetCanvas.width = QR_SIZE;
        targetCanvas.height = QR_SIZE;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, QR_SIZE, QR_SIZE);
        ctx.drawImage(img, 0, 0, QR_SIZE, QR_SIZE);
        resolve(targetCanvas.toDataURL(type, 0.92));
      };
      img.onerror = () => resolve('');
      img.src = svgToDataURL(svg);
    });
  }

  function downloadImage(svg, background, targetCanvas, name, type) {
    rasterize(svg, background, targetCanvas, type).then((url) => {
      if (!url) return;
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
    });
  }

  function renderGeneratorQr() {
    try {
      const svg = buildQrSvg(currentText, {
        dark: darkInput.value,
        light: lightInput.value,
        shape: shapeInput.value,
        ecc: logoDataURL ? 'H' : 'Q',
        logo: logoDataURL,
      });
      renderSvg(svg, svgHost);
      download.hidden = false;
      canvas.hidden = true;
      clearError();
    } catch (e) {
      svgHost.hidden = true;
      download.hidden = true;
      canvas.hidden = true;
      showError('No se ha podido generar el código QR. Prueba con una URL más corta.');
    }
  }

  function downloadJPG() {
    const svg = svgHost.innerHTML;
    if (!svg) return;
    downloadImage(svg, lightInput.value, canvas, fileName(), 'image/jpeg');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();

    if (!text) {
      svgHost.hidden = true;
      download.hidden = true;
      canvas.hidden = true;
      showError('Introduce una URL para generar el código QR.');
      input.focus();
      return;
    }

    clearError();
    currentText = text;
    renderGeneratorQr();
  });

  let imgWidth = 0;
  let imgHeight = 0;
  let baseScale = 1;
  let zoom = 1;
  let posX = 0;
  let posY = 0;
  let dragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragPosX = 0;
  let dragPosY = 0;

  function applyTransform() {
    editorImage.style.transform = `translate(${posX}px, ${posY}px) scale(${baseScale * zoom})`;
  }

  function clampPosition() {
    const view = editorViewport.clientWidth;
    const scale = baseScale * zoom;
    const width = imgWidth * scale;
    const height = imgHeight * scale;
    posX = Math.min(0, Math.max(view - width, posX));
    posY = Math.min(0, Math.max(view - height, posY));
  }

  function openEditor(dataUrl) {
    editor.hidden = false;
    editorImage.onload = () => {
      imgWidth = editorImage.naturalWidth;
      imgHeight = editorImage.naturalHeight;
      const view = editorViewport.clientWidth;
      baseScale = Math.max(view / imgWidth, view / imgHeight);
      zoom = 1;
      editorZoom.value = '1';
      const scale = baseScale;
      posX = (view - imgWidth * scale) / 2;
      posY = (view - imgHeight * scale) / 2;
      applyTransform();
    };
    editorImage.src = dataUrl;
  }

  function onZoom() {
    const view = editorViewport.clientWidth;
    const oldScale = baseScale * zoom;
    const centerX = (view / 2 - posX) / oldScale;
    const centerY = (view / 2 - posY) / oldScale;
    zoom = Number(editorZoom.value);
    const scale = baseScale * zoom;
    posX = view / 2 - centerX * scale;
    posY = view / 2 - centerY * scale;
    clampPosition();
    applyTransform();
  }

  function applyLogo() {
    const view = editorViewport.clientWidth;
    const scale = baseScale * zoom;
    const out = document.createElement('canvas');
    out.width = LOGO_OUTPUT;
    out.height = LOGO_OUTPUT;
    const ctx = out.getContext('2d');
    const ratio = LOGO_OUTPUT / view;
    ctx.drawImage(editorImage, posX * ratio, posY * ratio, imgWidth * scale * ratio, imgHeight * scale * ratio);
    logoDataURL = out.toDataURL('image/jpeg', 0.92);
    logoPreview.src = logoDataURL;
    logoPreview.hidden = false;
    logoRemove.hidden = false;
    editor.hidden = true;
    if (currentText) renderGeneratorQr();
  }

  function closeEditor() {
    editor.hidden = true;
    editorImage.removeAttribute('src');
  }

  logoPick.addEventListener('click', () => logoInput.click());

  logoInput.addEventListener('change', () => {
    const file = logoInput.files && logoInput.files[0];
    logoInput.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => openEditor(reader.result);
    reader.readAsDataURL(file);
  });

  logoRemove.addEventListener('click', () => {
    logoDataURL = '';
    logoPreview.hidden = true;
    logoPreview.removeAttribute('src');
    logoRemove.hidden = true;
    if (currentText) renderGeneratorQr();
  });

  editorZoom.addEventListener('input', onZoom);

  editorViewport.addEventListener('pointerdown', (event) => {
    dragging = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragPosX = posX;
    dragPosY = posY;
    editorViewport.setPointerCapture(event.pointerId);
  });

  editorViewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    posX = dragPosX + (event.clientX - dragStartX);
    posY = dragPosY + (event.clientY - dragStartY);
    clampPosition();
    applyTransform();
  });

  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    if (editorViewport.hasPointerCapture(event.pointerId)) {
      editorViewport.releasePointerCapture(event.pointerId);
    }
  }

  editorViewport.addEventListener('pointerup', endDrag);
  editorViewport.addEventListener('pointercancel', endDrag);
  editorApply.addEventListener('click', applyLogo);
  editorCancel.addEventListener('click', closeEditor);
  editor.addEventListener('click', (event) => {
    if (event.target === editor) closeEditor();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !editor.hidden) closeEditor();
  });

  function showView(name) {
    const viewerOnly = name === 'viewer';
    tabs.hidden = viewerOnly;
    appTitle.hidden = viewerOnly;
    Object.entries(views).forEach(([key, section]) => {
      section.hidden = key !== name;
    });
    Array.prototype.forEach.call(tabs.children, (button) => {
      button.classList.toggle('is-active', button.dataset.view === name);
    });
  }

  function readCardForm() {
    const values = {};
    Object.entries(cardFields).forEach(([key, field]) => {
      values[key] = field.value.trim();
    });
    values.bg = cardFields.bg.value;
    values.fg = cardFields.fg.value;
    return values;
  }

  function collectCard(strict) {
    const raw = readCardForm();
    const card = {
      name: raw.name,
      last: raw.last,
      role: raw.role,
      desc: raw.desc,
      email: raw.email,
      phone: raw.phone,
      bg: raw.bg,
      fg: raw.fg,
    };

    const urlKeys = ['web', 'linkedin', 'instagram', 'x', 'photo'];
    for (let i = 0; i < urlKeys.length; i++) {
      const key = urlKeys[i];
      if (!raw[key]) continue;
      const normalized = normalizeUrl(raw[key]);
      if (normalized === null) {
        if (strict) return { error: `La URL de ${urlLabel(key)} no es válida.` };
        continue;
      }
      card[key] = normalized;
    }

    if (card.email && !isEmail(card.email)) {
      if (strict) return { error: 'El correo no tiene un formato válido.' };
      delete card.email;
    }

    if (strict && !card.name) {
      return { error: 'Introduce al menos el nombre.' };
    }

    return { card };
  }

  function cardQrSvg(card) {
    try {
      const url = buildCardUrl(card);
      if (url.length > MAX_CARD_URL) return '';
      return buildQrSvg(url, {
        size: 128,
        margin: 4,
        shape: 'square',
        ecc: 'M',
        dark: card.fg || '#ededed',
        light: card.bg || '#171717',
      });
    } catch (e) {
      return '';
    }
  }

  function updateCardPreview() {
    const result = collectCard(false);
    if (result.error) return;
    cardPreview.replaceChildren(renderCard(result.card, cardQrSvg(result.card)));
  }

  cardForm.addEventListener('input', updateCardPreview);

  cardForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = collectCard(true);

    if (result.error) {
      showCardError(result.error);
      return;
    }

    const url = buildCardUrl(result.card);
    if (url.length > MAX_CARD_URL) {
      showCardError('La tarjeta tiene demasiados datos. Acorta la descripción o elimina algún enlace.');
      return;
    }

    try {
      const light = result.card.bg || '#171717';
      const dark = result.card.fg || '#ededed';
      const svg = buildQrSvg(url, { ecc: 'M', shape: 'square', dark, light });
      renderSvg(svg, cardSvgHost);
      cardQrLight = light;
      cardDownload.hidden = false;
      clearCardError();
    } catch (e) {
      cardSvgHost.hidden = true;
      cardDownload.hidden = true;
      showCardError('No se ha podido generar el QR. Prueba con menos datos.');
    }
  });

  cardDownload.addEventListener('click', () => {
    const svg = cardSvgHost.innerHTML;
    if (!svg) return;
    downloadImage(svg, cardQrLight, cardCanvas, 'tarjeta-qr.png', 'image/png');
  });

  function showViewer(card) {
    showView('viewer');
    viewerCard.replaceChildren(renderCard(card, cardQrSvg(card)));
  }

  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view]');
    if (!button) return;
    showView(button.dataset.view);
  });

  viewerHome.addEventListener('click', () => {
    history.replaceState(null, '', window.location.pathname);
    showView('card');
  });

  function init() {
    const search = window.location.hash.replace(/^#/, '');
    const card = search ? decodeCard(search) : null;
    if (card && hasCardData(card)) {
      showViewer(card);
      return;
    }
    showView('qr');
  }

  updateCardPreview();
  init();
})();
