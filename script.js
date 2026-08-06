// Static directory browser. Reads /manifest.json (generated at build time by
// scripts/gen-manifest.ts) and renders folder navigation via the URL hash,
// e.g. #/f/Comic-Code — no server-side directory listing needed.

const listing = document.getElementById("listing");
const crumbs = document.getElementById("crumbs");
const filter = document.getElementById("filter");
const footer = document.getElementById("footer");

let FILES = []; // [{ path, size }]

function fmtSize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// Current folder path from the hash, e.g. "f/Comic-Code" ("" = root).
function currentPath() {
  const raw = decodeURIComponent(location.hash.replace(/^#\/?/, ""));
  return raw.replace(/\/+$/, "");
}

// Immediate children (folders + files) of the given prefix.
function childrenOf(prefix) {
  const base = prefix ? prefix + "/" : "";
  const folders = new Set();
  const files = [];
  for (const f of FILES) {
    if (!f.path.startsWith(base)) continue;
    const rest = f.path.slice(base.length);
    const slash = rest.indexOf("/");
    if (slash === -1) {
      files.push({ name: rest, path: f.path, size: f.size });
    } else {
      folders.add(rest.slice(0, slash));
    }
  }
  return {
    folders: [...folders].sort((a, b) => a.localeCompare(b)),
    files: files.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function renderCrumbs(prefix) {
  const parts = prefix ? prefix.split("/") : [];
  let acc = "";
  const links = [`<a href="#/">cdn</a>`];
  for (const p of parts) {
    acc = acc ? `${acc}/${p}` : p;
    links.push(`<a href="#/${encodeURI(acc)}">${p}</a>`);
  }
  crumbs.innerHTML = links.join('<span class="sep">/</span>');
}

function render() {
  const prefix = currentPath();
  renderCrumbs(prefix);
  const { folders, files } = childrenOf(prefix);
  const q = filter.value.trim().toLowerCase();

  const rows = [];

  for (const name of folders) {
    if (q && !name.toLowerCase().includes(q)) continue;
    const target = prefix ? `${prefix}/${name}` : name;
    rows.push(
      `<li class="row folder">
        <a class="name" href="#/${encodeURI(target)}">📁 ${name}/</a>
      </li>`,
    );
  }

  for (const f of files) {
    if (q && !f.name.toLowerCase().includes(q)) continue;
    const url = `/${encodeURI(f.path)}`;
    rows.push(
      `<li class="row file">
        <a class="name" href="${url}" target="_blank" rel="noopener">📄 ${f.name}</a>
        <span class="size">${fmtSize(f.size)}</span>
        <button class="copy" data-path="${f.path}" title="Copy URL">copy</button>
      </li>`,
    );
  }

  listing.innerHTML =
    rows.join("") || `<li class="row empty">Nothing here.</li>`;
}

listing.addEventListener("click", (e) => {
  const btn = e.target.closest("button.copy");
  if (!btn) return;
  const url = `${location.origin}/${btn.dataset.path}`;
  navigator.clipboard?.writeText(url).then(() => {
    const was = btn.textContent;
    btn.textContent = "copied";
    setTimeout(() => (btn.textContent = was), 1200);
  });
});

filter.addEventListener("input", render);
window.addEventListener("hashchange", () => {
  filter.value = "";
  render();
});

async function init() {
  footer.textContent = "loading…";
  try {
    const res = await fetch("/manifest.json", { cache: "no-cache" });
    const data = await res.json();
    FILES = data.files || [];
    footer.textContent =
      `${data.count} files · © ${new Date().getFullYear()} · assets may move without notice`;
    render();
  } catch {
    footer.textContent = "";
    listing.innerHTML =
      `<li class="row empty">Couldn't load the file list.</li>`;
  }
}

init();
