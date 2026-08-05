// Minimal touch: list the asset folders and stamp the year.
const dirs = ["f", "glb", "img", "sfx"];

const dirsEl = document.getElementById("dirs");
if (dirsEl) {
  dirsEl.innerHTML = dirs
    .map((d) => `<a href="/${d}/">/${d}</a>`)
    .join("");
}

const footer = document.getElementById("footer");
if (footer) {
  footer.textContent = `© ${new Date().getFullYear()} · assets may move without notice`;
}
