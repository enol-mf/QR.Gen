import QRCode from 'qrcode';

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

const QR_SIZE = 512;
const MODULE_MARGIN = 4; // zona de silencio recomendada por el estándar QR
const LOGO_RATIO = 0.22; // proporción del QR que ocupa la imagen central
const LOGO_OUTPUT = 256; // resolución del recorte exportado

let logoDataURL = '';
let currentText = '';

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

function clearError() {
  error.hidden = true;
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

function downloadJPG() {
  const svg = svgHost.innerHTML;
  if (!svg) return;
  const img = new Image();
  const ctx = canvas.getContext('2d');
  img.onload = () => {
    canvas.width = QR_SIZE;
    canvas.height = QR_SIZE;
    ctx.fillStyle = lightInput.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, QR_SIZE, QR_SIZE);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.download = fileName();
    link.click();
  };
  img.crossOrigin = 'anonymous';
  img.src = svgToDataURL(svg);
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

function renderQR(text) {
  const logo = logoDataURL;
  Promise.resolve().then(() =>
    QRCode.create(text, {
      errorCorrectionLevel: logo ? 'H' : 'Q',
      version: undefined,
    })
  )
    .then((qrData) => {
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const moduleSize = QR_SIZE / (size + MODULE_MARGIN * 2);
      const margin = moduleSize * MODULE_MARGIN;
      let shapes = '';
      const dark = darkInput.value;
      const light = lightInput.value;
      const shape = shapeInput.value;

      for (let i = 0; i < data.length; i++) {
        if (!data[i]) continue;
        const col = i % size;
        const row = Math.floor(i / size);
        const cx = margin + col * moduleSize + moduleSize / 2;
        const cy = margin + row * moduleSize + moduleSize / 2;
        shapes += shapePath(shape, cx, cy, moduleSize);
      }

      let overlay = '';
      if (logo) {
        const logoSize = QR_SIZE * LOGO_RATIO;
        const pad = moduleSize;
        const box = logoSize / 2 + pad;
        const center = QR_SIZE / 2;
        overlay =
          `<rect x="${center - box}" y="${center - box}" width="${box * 2}" height="${box * 2}" rx="${pad * 1.5}" fill="${light}"/>` +
          `<image x="${center - logoSize / 2}" y="${center - logoSize / 2}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid slice" href="${logo}"/>`;
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}" shape-rendering="geometricPrecision"><rect x="0" y="0" width="${QR_SIZE}" height="${QR_SIZE}" fill="${light}"/><g fill="${dark}">${shapes}</g>${overlay}</svg>`;
      svgHost.innerHTML = svg;
      svgHost.hidden = false;
      download.hidden = false;
      canvas.hidden = true;
      clearError();
    })
    .catch(() => {
      svgHost.hidden = true;
      download.hidden = true;
      canvas.hidden = true;
      showError('No se ha podido generar el código QR. Prueba con una URL más corta.');
    });

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
  renderQR(text);
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
  if (currentText) renderQR(currentText);
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
  if (currentText) renderQR(currentText);
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

download.addEventListener('click', downloadJPG);
input.addEventListener('input', clearError);
})();