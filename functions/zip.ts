// Cloudflare Pages Function: stream a folder as a .zip on demand.
//
//   GET /zip?path=f/Comic-Code  ->  Comic-Code.zip
//
// A folder is only zippable if it contains an empty marker file named
// "zippable". Files are listed from /manifest.json, fetched via the ASSETS
// binding, and written into a STORE (uncompressed) zip that is streamed one
// file at a time to keep memory low. (Pages Functions run on the Workers
// runtime, so memory/CPU limits apply — huge folders are intentionally left
// non-zippable.)

interface Env {
  ASSETS: Fetcher;
}

interface ManifestEntry {
  path: string;
  size: number;
}

// --- CRC-32 -----------------------------------------------------------------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// --- zip record builders ----------------------------------------------------

const DOS_TIME = 0;
const DOS_DATE = 0x5821; // 2024-01-01, a valid fixed date

function localHeader(name: Uint8Array, crc: number, size: number): Uint8Array {
  const h = new Uint8Array(30 + name.length);
  const v = new DataView(h.buffer);
  v.setUint32(0, 0x04034b50, true);
  v.setUint16(4, 20, true); // version needed
  v.setUint16(6, 0x0800, true); // UTF-8 filename flag
  v.setUint16(8, 0, true); // method: store
  v.setUint16(10, DOS_TIME, true);
  v.setUint16(12, DOS_DATE, true);
  v.setUint32(14, crc, true);
  v.setUint32(18, size, true); // compressed
  v.setUint32(22, size, true); // uncompressed
  v.setUint16(26, name.length, true);
  v.setUint16(28, 0, true); // extra length
  h.set(name, 30);
  return h;
}

function centralHeader(
  name: Uint8Array,
  crc: number,
  size: number,
  offset: number,
): Uint8Array {
  const h = new Uint8Array(46 + name.length);
  const v = new DataView(h.buffer);
  v.setUint32(0, 0x02014b50, true);
  v.setUint16(4, 20, true); // version made by
  v.setUint16(6, 20, true); // version needed
  v.setUint16(8, 0x0800, true);
  v.setUint16(10, 0, true); // method: store
  v.setUint16(12, DOS_TIME, true);
  v.setUint16(14, DOS_DATE, true);
  v.setUint32(16, crc, true);
  v.setUint32(20, size, true);
  v.setUint32(24, size, true);
  v.setUint16(28, name.length, true);
  v.setUint16(30, 0, true); // extra
  v.setUint16(32, 0, true); // comment
  v.setUint16(34, 0, true); // disk start
  v.setUint16(36, 0, true); // internal attrs
  v.setUint32(38, 0, true); // external attrs
  v.setUint32(42, offset, true); // local header offset
  h.set(name, 46);
  return h;
}

function endOfCentralDir(
  count: number,
  cdSize: number,
  cdOffset: number,
): Uint8Array {
  const h = new Uint8Array(22);
  const v = new DataView(h.buffer);
  v.setUint32(0, 0x06054b50, true);
  v.setUint16(4, 0, true);
  v.setUint16(6, 0, true);
  v.setUint16(8, count, true);
  v.setUint16(10, count, true);
  v.setUint32(12, cdSize, true);
  v.setUint32(16, cdOffset, true);
  v.setUint16(20, 0, true);
  return h;
}

// --- handler ----------------------------------------------------------------

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const folder = (url.searchParams.get("path") || "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  if (!folder || folder.includes("..")) {
    return new Response("Bad path.", { status: 400 });
  }

  const origin = url.origin;
  const asset = (p: string) =>
    env.ASSETS.fetch(new Request(new URL(p, origin)));

  // Gate: the folder must contain a "zippable" marker.
  const marker = await asset(`/${folder}/zippable`);
  if (!marker.ok) {
    return new Response("This folder isn't zippable.", { status: 403 });
  }

  // List the folder's files from the manifest.
  const manRes = await asset("/manifest.json");
  if (!manRes.ok) {
    return new Response("No manifest.", { status: 500 });
  }
  const manifest = (await manRes.json()) as { files: ManifestEntry[] };
  const prefix = `${folder}/`;
  const files = manifest.files.filter((f) => {
    if (!f.path.startsWith(prefix)) return false;
    const name = f.path.slice(f.path.lastIndexOf("/") + 1);
    return name !== "zippable" && !name.startsWith(".");
  });

  if (files.length === 0) {
    return new Response("Folder is empty.", { status: 404 });
  }

  // Name the zip after the folder path minus its root segment, so leaf-level
  // markers stay distinct: "f/Comic-Code/otf" -> "Comic-Code-otf",
  // "f/San-Francisco/SF Pro" -> "San-Francisco-SF Pro", "f/discord" -> "discord".
  const segs = folder.split("/");
  const label = segs.length > 1 ? segs.slice(1).join("-") : segs[0];
  const enc = new TextEncoder();

  type CentralEntry = { name: Uint8Array; crc: number; size: number; offset: number };
  const central: CentralEntry[] = [];
  let offset = 0;
  let i = 0;
  let finished = false;

  const stream = new ReadableStream({
    // One file per pull → memory stays near the size of a single file.
    async pull(controller) {
      if (i < files.length) {
        const f = files[i++];
        const res = await asset(`/${f.path}`);
        if (!res.ok) {
          controller.error(new Error(`Missing asset: ${f.path}`));
          return;
        }
        const data = new Uint8Array(await res.arrayBuffer());
        const crc = crc32(data);
        // Entry name: "<label>/<relative path>".
        const nameBytes = enc.encode(label + "/" + f.path.slice(prefix.length));

        const header = localHeader(nameBytes, crc, data.length);
        controller.enqueue(header);
        controller.enqueue(data);

        central.push({ name: nameBytes, crc, size: data.length, offset });
        offset += header.length + data.length;
        return;
      }

      if (!finished) {
        finished = true;
        const cdStart = offset;
        let cdSize = 0;
        for (const e of central) {
          const rec = centralHeader(e.name, e.crc, e.size, e.offset);
          controller.enqueue(rec);
          cdSize += rec.length;
        }
        controller.enqueue(endOfCentralDir(central.length, cdSize, cdStart));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${label}.zip"`,
      "Cache-Control": "no-store",
    },
  });
};
