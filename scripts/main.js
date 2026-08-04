/* fonts/scripts/main.js
   Copyright (c) 2026 Clove Nytrix Doughmination Twilight
   Licensed under the DASL-1.0 Licence.
   See LICENCE.md in the project root for full licence information. */

/* ----------------------------------------------------------------------
   Data
   Each collection has a slug (matches its page + body[data-collection]),
   a title, a blurb, and a list of fonts. Each font has:
     name   - what to show
     family - the CSS font-family (must match an @font-face)
     meta   - little grey descriptor
     files  - real file paths, shown with copy buttons
   ---------------------------------------------------------------------- */

const COLLECTIONS = {
  'comic-code': {
    title: 'Comic Code',
    blurb: 'The house monospace. Rounded, warm, and made for reading code all day.',
    page: '/Comic-Code/',
    sample: 'const joy = () => bake();',
    fonts: [
      {
        name: 'Comic Code',
        family: 'Comic Code',
        meta: 'monospace · regular, medium, bold, italic',
        files: [
          '/Comic-Code/woff2/ComicCode-Regular.woff2',
          '/Comic-Code/woff2/ComicCode-Medium.woff2',
          '/Comic-Code/woff2/ComicCode-Bold.woff2',
          '/Comic-Code/woff2/ComicCode-Italic.woff2',
        ],
      },
      {
        name: 'Comic Code Ligatures',
        family: 'Comic Code Ligatures',
        meta: 'monospace · with coding ligatures',
        files: [
          '/Comic-Code/woff2/ComicCodeLigatures-Regular.woff2',
          '/Comic-Code/woff2/ComicCodeLigatures-Bold.woff2',
        ],
      },
    ],
  },

  'san-francisco': {
    title: 'San Francisco',
    blurb: "Apple's system family. The whole set, from big display type down to fixed-width mono.",
    page: '/San-Francisco/',
    sample: 'Hello, San Francisco.',
    fonts: [
      { name: 'SF Pro',            family: 'SF Pro',            meta: 'sans-serif',            files: ['/San-Francisco/SF Pro/SF-Pro.ttf'] },
      { name: 'SF Pro Display',    family: 'SF Pro Display',    meta: 'sans-serif · display',  files: ['/San-Francisco/SF Pro Display/SF-Pro-Display-Regular.otf'] },
      { name: 'SF Pro Text',       family: 'SF Pro Text',       meta: 'sans-serif · body',     files: ['/San-Francisco/SF Pro Text/SF-Pro-Text-Regular.otf'] },
      { name: 'SF Pro Rounded',    family: 'SF Pro Rounded',    meta: 'sans-serif · rounded',  files: ['/San-Francisco/SF Pro Rounded/SF-Pro-Rounded-Regular.otf'] },
      { name: 'SF Mono',           family: 'SF Mono',           meta: 'monospace',             files: ['/San-Francisco/SF Mono/SF-Mono-Regular.otf'] },
      { name: 'SF Compact',        family: 'SF Compact',        meta: 'sans-serif · compact',  files: ['/San-Francisco/SF Compact/SF-Compact.ttf'] },
      { name: 'SF Compact Display', family: 'SF Compact Display', meta: 'sans-serif · compact display', files: ['/San-Francisco/SF Compact Display/SF-Compact-Display-Regular.otf'] },
      { name: 'SF Compact Text',   family: 'SF Compact Text',   meta: 'sans-serif · compact body', files: ['/San-Francisco/SF Compact Text/SF-Compact-Text-Regular.otf'] },
      { name: 'SF Compact Rounded', family: 'SF Compact Rounded', meta: 'sans-serif · rounded, compact', files: ['/San-Francisco/SF Compact Rounded/SF-Compact-Rounded-Regular.otf'] },
    ],
  },

  'discord': {
    title: 'Discord',
    blurb: "The fonts Discord ships in its app, pulled out and ready to preview.",
    page: '/discord/',
    sample: 'gm, nitro gang',
    fonts: [
      { name: 'gg sans',   family: 'gg sans',          meta: "Discord's default UI font", files: ['/discord/gg sans.woff2'] },
      { name: 'Medieval',  family: 'Discord Medieval', meta: 'blackletter',    files: ['/discord/Medieval.woff2'] },
      { name: 'Jellybean', family: 'Discord Jellybean', meta: 'soft handwritten', files: ['/discord/Jellybean.woff2'] },
      { name: 'Modern',    family: 'Discord Modern',   meta: 'clean sans',     files: ['/discord/Modern.woff2'] },
      { name: '8Bit',      family: 'Discord 8Bit',     meta: 'pixel / retro',  files: ['/discord/8Bit.woff2'] },
      { name: 'Tempo',     family: 'Discord Tempo',    meta: 'display',        files: ['/discord/Tempo.woff2'] },
      { name: 'Sakura',    family: 'Discord Sakura',   meta: 'brush / script', files: ['/discord/Sakura.woff2'] },
      { name: 'Vampyre',   family: 'Discord Vampyre',  meta: 'gothic display', files: ['/discord/Vampyre.woff2'] },
    ],
  },
};

const ORDER = ['comic-code', 'san-francisco', 'discord'];

/* ---------------------------------------------------------------------- */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

function esc(s) {
  return String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
function fileName(path) { return path.split('/').pop(); }
function fontCount(c) { return c.fonts.length; }

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1400);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

function wireCopyButtons(root) {
  $$('.copy[data-copy]', root).forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      if (ok) {
        const original = btn.textContent;
        btn.classList.add('done');
        btn.textContent = 'copied';
        toast(btn.dataset.toast || fileName(btn.dataset.copy));
        setTimeout(() => { btn.classList.remove('done'); btn.textContent = original; }, 1300);
      }
    });
  });
}

/* ---------- Root: collection directory ---------- */

function renderNav() {
  const nav = $('#collections');
  if (!nav) return;
  nav.innerHTML = ORDER.map((slug) => {
    const c = COLLECTIONS[slug];
    return `
      <li>
        <a class="collection-card" href="${c.page}">
          <div class="cc-head">
            <h2>${esc(c.title)}</h2>
            <span class="count">${fontCount(c)} font${fontCount(c) === 1 ? '' : 's'}</span>
          </div>
          <p class="cc-blurb">${esc(c.blurb)}</p>
          <div class="cc-sample" style="font-family:'${esc(c.fonts[0].family)}', monospace">${esc(c.sample)}</div>
        </a>
      </li>`;
  }).join('');
}

/* ---------- Collection page: font list ---------- */

function renderCollection(slug) {
  const c = COLLECTIONS[slug];
  const list = $('#fonts');
  if (!c || !list) return;

  const titleEl = $('[data-collection-title]');
  if (titleEl) titleEl.textContent = c.title;
  const blurbEl = $('[data-collection-blurb]');
  if (blurbEl) blurbEl.textContent = c.blurb;
  if (document.title.includes('{title}')) {
    document.title = document.title.replace('{title}', c.title);
  }

  list.innerHTML = c.fonts.map((f) => `
    <li class="font">
      <div class="font-head">
        <p class="font-name">${esc(f.name)}</p>
        <span class="font-meta">${esc(f.meta)}</span>
      </div>
      <div class="specimen" data-specimen style="font-family:'${esc(f.family)}', sans-serif"></div>
      <div class="files">
        ${f.files.map((p) => `
          <div class="file-row">
            <button class="copy" data-copy="${esc(p)}">copy path</button>
            <code>${esc(fileName(p))}</code>
          </div>`).join('')}
      </div>
    </li>
  `).join('');

  wireCopyButtons(list);
}

/* ---------- Shared: live preview ---------- */

function setupPreview() {
  const input = $('#preview-input');
  const size = $('#size');
  const sizeVal = $('#size-val');
  if (!input || !size) return;

  function apply() {
    const text = input.value || 'The quick brown fox';
    $$('[data-specimen]').forEach((el) => {
      el.textContent = text;
      el.style.fontSize = size.value + 'px';
    });
    if (sizeVal) sizeVal.textContent = size.value + 'px';
  }
  input.addEventListener('input', apply);
  size.addEventListener('input', apply);
  apply();
}

/* ---------- Shared: usage snippet ---------- */

function setupSnippet() {
  const btn = $('[data-copy-code]');
  const code = $('#snippet');
  if (!btn || !code) return;
  btn.addEventListener('click', async () => {
    const ok = await copyText(code.textContent);
    if (ok) {
      btn.classList.add('done');
      btn.textContent = 'copied';
      toast('CSS copied');
      setTimeout(() => { btn.classList.remove('done'); btn.textContent = 'copy'; }, 1300);
    }
  });
}

/* ---------- Boot ---------- */

document.addEventListener('DOMContentLoaded', () => {
  const slug = document.body.dataset.collection;
  if (slug) {
    renderCollection(slug);
  } else {
    renderNav();
  }
  setupPreview();
  setupSnippet();
});
