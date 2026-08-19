// Generates manifest.json: a flat list of every asset file (path + size).
// The static browser (index.html) reads this to render folder navigation,
// since a static host can't list directories at runtime.
//
// Run at build time. CF Pages build command:
//   node --experimental-strip-types scripts/gen-manifest.ts
// Zero dependencies (native TS type-stripping, Node >= 22.6).

import {
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

const ASSET_DIRS = [
  "f",
  "glb",
  "img",
  "sfx",
  "m",
  "gif",
  "pk"
];

type Entry = {
  path: string;
  size: number;
};

function walk(dir: string, out: Entry[]): void {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (st.isFile()) {
      out.push({
        path: full.slice(ROOT.length + 1).split("\\").join("/"),
        size: st.size,
      });
    }
  }
}

const files: Entry[] = [];

for (const dir of ASSET_DIRS) {
  try {
    walk(join(ROOT, dir), files);
  } catch {
    // Directory may not exist yet — skip it.
  }
}

files.sort((a, b) => a.path.localeCompare(b.path));

const manifest = {
  generated: new Date().toISOString(),
  count: files.length,
  roots: ASSET_DIRS,
  files,
};

writeFileSync(
  join(ROOT, "manifest.json"),
  JSON.stringify(manifest) + "\n",
);

console.log(`manifest.json written: ${files.length} files`);
