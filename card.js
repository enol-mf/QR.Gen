const PARAM = {
  name: 'n',
  last: 'a',
  role: 'p',
  desc: 'd',
  email: 'e',
  phone: 't',
  web: 'w',
  linkedin: 'li',
  instagram: 'ig',
  x: 'x',
  photo: 'f',
  bg: 'bg',
  fg: 'fg',
};

const HEX_COLORS = ['bg', 'fg'];

const LABELS = {
  web: 'la web',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  x: 'X',
  photo: 'la foto',
};

export function urlLabel(key) {
  return LABELS[key] || key;
}

export function normalizeUrl(value) {
  const raw = String(value == null ? '' : value).trim();
  if (!raw || /\s/.test(raw)) return null;
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    if (!/^[a-z0-9.-]+$/i.test(url.hostname)) return null;
    return url.href;
  } catch (e) {
    return null;
  }
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value == null ? '' : value).trim());
}

export function encodeCard(card) {
  const params = new URLSearchParams();
  Object.entries(PARAM).forEach(([key, param]) => {
    const value = card[key];
    if (!value) return;
    params.set(param, HEX_COLORS.includes(key) ? String(value).replace('#', '') : value);
  });
  return params.toString();
}

export function decodeCard(search) {
  const params = new URLSearchParams(search);
  const card = {};
  Object.entries(PARAM).forEach(([key, param]) => {
    const value = params.get(param);
    if (!value) return;
    card[key] = HEX_COLORS.includes(key) ? `#${value}` : value;
  });
  return card;
}

export function hasCardData(card) {
  return Boolean(card.name || card.last || card.role || card.desc || card.email || card.web || card.photo);
}

export function buildCardUrl(card) {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#${encodeCard(card)}`;
}

export function renderCard(card, qrSvg) {
  const el = document.createElement('article');
  el.className = 'biz-card';
  el.style.setProperty('--card-bg', card.bg || '#171717');
  el.style.setProperty('--card-fg', card.fg || '#ededed');

  const top = document.createElement('div');
  top.className = 'biz-card__top';

  if (card.photo) {
    const img = document.createElement('img');
    img.className = 'biz-card__photo';
    img.src = card.photo;
    img.alt = '';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.remove());
    top.appendChild(img);
  }

  const identity = document.createElement('div');
  identity.className = 'biz-card__id';

  const name = document.createElement('h2');
  name.className = 'biz-card__name';
  name.textContent = [card.name, card.last].filter(Boolean).join(' ') || 'Tu nombre';
  identity.appendChild(name);

  if (card.role) {
    const role = document.createElement('p');
    role.className = 'biz-card__role';
    role.textContent = card.role;
    identity.appendChild(role);
  }

  top.appendChild(identity);
  el.appendChild(top);

  if (card.desc) {
    const desc = document.createElement('p');
    desc.className = 'biz-card__desc';
    desc.textContent = card.desc;
    el.appendChild(desc);
  }

  const links = [];
  if (card.email) links.push(['Email', `mailto:${card.email}`]);
  if (card.phone) links.push(['Teléfono', `tel:${card.phone.replace(/[^+\d]/g, '')}`]);
  if (card.web) links.push(['Web', card.web]);
  if (card.linkedin) links.push(['LinkedIn', card.linkedin]);
  if (card.instagram) links.push(['Instagram', card.instagram]);
  if (card.x) links.push(['X', card.x]);

  if (links.length || qrSvg) {
    const footer = document.createElement('div');
    footer.className = 'biz-card__footer';

    if (links.length) {
      const list = document.createElement('ul');
      list.className = 'biz-card__links';
      links.forEach(([label, href]) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        item.appendChild(link);
        list.appendChild(item);
      });
      footer.appendChild(list);
    }

    if (qrSvg) {
      const qr = document.createElement('div');
      qr.className = 'biz-card__qr';
      qr.innerHTML = qrSvg;
      footer.appendChild(qr);
    }

    el.appendChild(footer);
  }

  return el;
}
