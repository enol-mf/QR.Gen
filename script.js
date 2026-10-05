import QRCode from 'qrcode';

const form = document.getElementById('form');
const input = document.getElementById('url');
const error = document.getElementById('error');
const darkInput = document.getElementById('dark');
const lightInput = document.getElementById('light');
const canvas = document.getElementById('canvas');
const download = document.getElementById('download');

const QR_SIZE = 512;

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

function downloadJPG() {
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/jpeg', 0.92);
  link.download = fileName();
  link.click();
}

async function renderQR(text) {
  try {
    await QRCode.toCanvas(canvas, text, {
      width: QR_SIZE,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: darkInput.value, light: lightInput.value },
    });
    canvas.style.removeProperty('width');
    canvas.style.removeProperty('height');
    canvas.hidden = false;
    download.hidden = false;
  } catch {
    canvas.hidden = true;
    download.hidden = true;
    showError('No se ha podido generar el código QR. Prueba con una URL más corta.');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    canvas.hidden = true;
    download.hidden = true;
    showError('Introduce una URL para generar el código QR.');
    input.focus();
    return;
  }

  clearError();
  renderQR(text);
});

download.addEventListener('click', downloadJPG);

input.addEventListener('input', clearError);
