// Cloudflare Pages middleware: CORS allowlist for the CDN.
//
// `Access-Control-Allow-Origin` can only be ONE origin (or "*"), so to allow a
// set of domains we inspect the request's Origin and echo it back if it's on
// the list. Apex domains and any subdomain (e.g. assets.example.com) match.
//
// Docs: https://developers.cloudflare.com/pages/functions/middleware/

const ALLOWED: string[] = [
  // Mine
  "clovelib.win",
  "clove-portfolio.win",
  "cuddle-blahaj.win",
  "doughmination.co.uk",
  "doughmination.gay",
  "doughmination.info",
  "doughmination.me",
  "doughmination.net",
  "doughmination.online",
  "doughmination.org",
  "doughmination.site",
  "doughmination.systems",
  "doughmination.tech",
  "doughmination.uk",
  "doughmination.win",
  "doughmination.xyz",
  "imlesbian.fyi",
  "transgamers.org",
  "yuri-lover.win",

  // gf
  "ariare.es",
  "ari.rip",
  "gaybot.site",
  "girlsnetwork.dev",
  "kib.lol",
  "stupid.cat",
  "thesafespawn.net",

  // Friends — add domains here
];

function isAllowed(origin: string): boolean {
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }
  return ALLOWED.some(
    (domain) => host === domain || host.endsWith("." + domain),
  );
}

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const origin = request.headers.get("Origin");
  const allow = origin !== null && isAllowed(origin);

  // Preflight: answer directly, don't hit the asset.
  if (request.method === "OPTIONS") {
    const headers = new Headers({
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    });
    if (allow && origin !== null) {
      headers.set("Access-Control-Allow-Origin", origin);
    }
    return new Response(null, { status: 204, headers });
  }

  // Normal request: run it, then attach CORS if the origin is allowed.
  const response = await next();
  if (allow && origin !== null) {
    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", origin);
    headers.append("Vary", "Origin");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
};
