import QRCode from 'qrcode';

const form = document.getElementById('form');
const input = document.getElementById('url');
const error = document.getElementById('error');
const result = document.getElementById('result');
const canvas = document.getElementById('canvas');

const QR_OPTIONS = {
  width: 256,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: { dark: '#111111', light: '#ffffff' },
};

function showError(message) {
  error.textContent = message;
  error.hidden = false;
}

function clearError() {
  error.hidden = true;
}

async function renderQR(text) {
  try {
    await QRCode.toCanvas(canvas, text, QR_OPTIONS);
    result.hidden = false;
  } catch {
    result.hidden = true;
    showError('No se ha podido generar el código QR. Prueba con una URL más corta.');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    result.hidden = true;
    showError('Introduce una URL para generar el código QR.');
    input.focus();
    return;
  }

  clearError();
  renderQR(text);
});

input.addEventListener('input', clearError);
