(function () {
  var QRCode = window.QRCode;

  if (!QRCode) {
    try {
      QRCode = require && require('qrcode');
    } catch (e) {}
  }

const form = document.getElementById('form');
const input = document.getElementById('url');
const error = document.getElementById('error');
const darkInput = document.getElementById('dark');
const lightInput = document.getElementById('light');
const shapeInput = document.getElementById('shape');
const svgHost = document.getElementById('svg-host');
const canvas = document.getElementById('canvas');
const download = document.getElementById('download');

const QR_SIZE = 512;
const MODULE_MARGIN = 1; // para evitar artefactos al rasterizar

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
  const rr = r * 0.9;
  switch (shape) {
    case 'circle':
      return `<circle cx="${cx}" cy="${cy}" r="${rr / 2}"/>`;
    case 'diamond':
      return `<polygon points="${cx},${cy - rr / 2} ${cx + rr / 2},${cy} ${cx},${cy + rr / 2} ${cx - rr / 2},${cy}"/>`;
    case 'triangle':
      return `<polygon points="${cx},${cy - rr / 2} ${cx + rr / 2},${cy + rr / 2} ${cx - rr / 2},${cy + rr / 2}"/>`;
    case 'heart': {
      const s = rr / 2.6;
      return `<path d="M ${cx - s},${cy - s / 2} C ${cx - s * 1.8},${cy - s * 1.4} ${cx - s * 1.8},${cy + s * 0.6} ${cx - s},${cy + s * 1.2} C ${cx + s},${cy + s * 1.2} ${cx + s * 1.8},${cy + s * 0.6} ${cx + s},${cy - s / 2} C ${cx + s * 0.4},${cy - s * 1.1} ${cx - s * 0.4},${cy - s * 1.1} ${cx - s},${cy - s / 2} Z"/>`;
    }
    case 'spade': {
      const s = rr / 2.8;
      return `<path d="M ${cx},${cy - s * 1.2} L ${cx + s * 0.8},${cy - s * 0.1} L ${cx + s * 1.2},${cy + s * 0.2} L ${cx + s * 0.1},${cy + s * 0.8} L ${cx},${cy + s * 1.2} L ${cx - s * 0.1},${cy + s * 0.8} L ${cx - s * 1.2},${cy + s * 0.2} L ${cx - s * 0.8},${cy - s * 0.1} Z M ${cx - s * 0.3},${cy + s * 0.8} H ${cx + s * 0.3} L ${cx},${cy + s * 1.5} Z"/>`;
    }
    default:
      return `<rect x="${cx - rr / 2}" y="${cy - rr / 2}" width="${rr}" height="${rr}"/>`;
  }
}

function renderQR(text) {
  QRCode.create(text, {
    errorCorrectionLevel: 'M',
    version: undefined,
  })
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

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}" shape-rendering="geometricPrecision"><rect x="0" y="0" width="${QR_SIZE}" height="${QR_SIZE}" fill="${light}"/><g fill="${dark}">${shapes}</g></svg>`;
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
})();

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
  renderQR(text);
});

download.addEventListener('click', downloadJPG);
input.addEventListener('input', clearError);
})();