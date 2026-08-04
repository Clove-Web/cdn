/* fonts/scripts/main.js
   Copyright (c) 2026 Clove Nytrix Doughmination Twilight
   Licensed under the DASL-1.0 Licence.
   See LICENCE.md in the project root for full licence information. */

// The fonts, with their real names and actual file paths.
const FONTS = [
  {
    name: 'Comic Code',
    meta: 'monospace · regular, medium, bold, italic',
    files: [
      '/Comic-Code/woff2/ComicCode-Regular.woff2',
      '/Comic-Code/woff2/ComicCode-Medium.woff2',
      '/Comic-Code/woff2/ComicCode-Bold.woff2',
      '/Comic-Code/woff2/ComicCode-Italic.woff2',
    ],
  },
  {
    name: 'SF Pro Display',
    meta: 'sans-serif · display',
    files: ['/San-Francisco/SF Pro Display/SF-Pro-Display-Regular.otf'],
  },
  {
    name: 'SF Pro Rounded',
    meta: 'sans-serif · rounded',
    files: ['/San-Francisco/SF Pro Rounded/SF-Pro-Rounded-Regular.otf'],
  },
  {
    name: 'SF Pro Text',
    meta: 'sans-serif · body',
    files: ['/San-Francisco/SF Pro Text/SF-Pro-Text-Regular.otf'],
  },
  {
    name: 'SF Mono',
    meta: 'monospace',
    files: ['/San-Francisco/SF Mono/SF-Mono-Regular.otf'],
  },
  {
    name: 'SF Compact Rounded',
    meta: 'sans-serif · rounded, compact',
    files: ['/San-Francisco/SF Compact Rounded/SF-Compact-Rounded-Regular.otf'],
  },
];

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

let toastTimer;
function toast(msg) {
  const t = $('#toast');
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

function fileName(path) {
  return path.split('/').pop();
}

function build() {
  const list = $('#fonts');
  list.innerHTML = FONTS.map((f, i) => `
    <li class="font">
      <div class="font-head">
        <p class="font-name">${f.name}</p>
        <span class="font-meta">${f.meta}</span>
      </div>
      <div class="specimen" data-specimen style="font-family:'${f.name}', monospace"></div>
      <div class="files">
        ${f.files.map((p) => `
          <div class="file-row">
            <button class="copy" data-copy="${p}">copy path</button>
            <code>${fileName(p)}</code>
          </div>`).join('')}
      </div>
    </li>
  `).join('');

  $$('.copy[data-copy]', list).forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ok = await copyText(btn.dataset.copy);
      if (ok) {
        btn.classList.add('done');
        btn.textContent = 'copied';
        toast(fileName(btn.dataset.copy));
        setTimeout(() => { btn.classList.remove('done'); btn.textContent = 'copy path'; }, 1300);
      }
    });
  });
}

function preview() {
  const input = $('#preview-input');
  const size = $('#size');
  const sizeVal = $('#size-val');

  function apply() {
    const text = input.value || 'The quick brown fox';
    $$('[data-specimen]').forEach((el) => {
      el.textContent = text;
      el.style.fontSize = size.value + 'px';
    });
    sizeVal.textContent = size.value + 'px';
  }

  input.addEventListener('input', apply);
  size.addEventListener('input', apply);
  apply();
}

function snippetCopy() {
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

document.addEventListener('DOMContentLoaded', () => {
  build();
  preview();
  snippetCopy();
});
