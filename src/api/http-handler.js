import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { querySoil } from "./soil-service.js";
import { queryImergDay } from "./imerg-service.js";
import { searchGlobalPlants } from "./global-crops-service.js";

const types = { ".ttf": "font/ttf", ".woff2": "font/woff2", ".txt": "text/plain", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".md": "text/markdown", ".webmanifest": "application/manifest+json" };
const publicRootFiles = new Set(["dist/global-app.js", "dist/global-app.css", ...[400,600,700].map((weight) => `dist/space-grotesk-latin-${weight}-normal.woff2`), "index.html", "account.html", "account.css", "judge-demo.css", "workspace.css", "terrasown.css", "styles.css", "dashboard.css", "farm-hero.css", "location-map.css", "research.css", "accessibility.css", "sw.js", "manifest.webmanifest", "icon.svg", "assets/farm-overview.jpg", "assets/harvest-card.jpg", "assets/wheat-ear.png", ...["alfalfa", "cereal-rye", "corn", "oats", "oilseed-radish", "red-clover", "soybean", "winter-wheat"].map((id) => `assets/crops/${id}.jpg`), "docs/PRIVACY.md", "docs/GLOBAL_RESEARCH.md", "docs/RESEARCH_EVIDENCE_AUDIT.md", "docs/COMPETITION_SCORECARD.md"]);
const vendorFiles = new Map([["vendor/leaflet.js", "node_modules/leaflet/dist/leaflet.js"], ["vendor/leaflet.css", "node_modules/leaflet/dist/leaflet.css"]]);
const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=()"
};

function publicFile(pathname) {
  try {
    const relative = decodeURIComponent(pathname === "/" ? "/index.html" : pathname).replace(/^\/+/, "");
    return /^assets\/fonts\/(newsreader-regular\.ttf|jakarta-regular\.ttf|jakarta-semibold\.ttf|plex-mono\.ttf|Newsreader-OFL\.txt|Jakarta-OFL\.txt|Plex-OFL\.txt)$/.test(relative) || publicRootFiles.has(relative) || vendorFiles.has(relative) || /^src\/[a-z0-9/-]+\.js$/.test(relative) || /^data\/[a-z0-9/-]+\.json$/.test(relative) ? relative : null;
  } catch { return null; }
}

function coordinates(url) {
  if (!url.searchParams.get("latitude") || !url.searchParams.get("longitude")) throw new Error("Latitude and longitude are required.");
  const lat = Number(url.searchParams.get("latitude")), lon = Number(url.searchParams.get("longitude"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) throw new Error("Enter valid latitude and longitude.");
  return { lat, lon };
}

function soilCoordinates(url, region) {
  const point = coordinates(url);
  if (point.lat < region.bounds.south || point.lat > region.bounds.north || point.lon < region.bounds.west || point.lon > region.bounds.east) {
    const error = new Error("Mapped SSURGO soil is currently supported only for the Central Iowa demonstration.");
    error.status = 422;
    throw error;
  }
  return point;
}

function sendJson(res, code, value, headers = {}) {
  res.writeHead(code, { ...responseHeaders, ...headers, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

async function requestBody(req) {
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) { const error = new Error("JSON content type required."); error.status = 415; throw error; }
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16384) { const error = new Error("Request too large."); error.status = 413; throw error; }
  }
  try { return JSON.parse(body); }
  catch { const error = new Error("Invalid JSON request."); error.status = 400; throw error; }
}

async function handleAccount(req, res, url, accounts) {
  if (!accounts) return sendJson(res, 503, { error: "Local account storage is unavailable." });
  if (req.method !== "GET") {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) return sendJson(res, 403, { error: "Cross-site account changes are not allowed." });
  }
  const path = url.pathname;
  if (path === "/api/account/register" && req.method === "POST") {
    const result = await accounts.register(await requestBody(req), req);
    return sendJson(res, 201, { user: result.user }, { "Set-Cookie": result.cookie });
  }
  if (path === "/api/account/login" && req.method === "POST") {
    const result = await accounts.login(await requestBody(req), req);
    return sendJson(res, 200, { user: result.user }, { "Set-Cookie": result.cookie });
  }
  if (path === "/api/account/logout" && req.method === "POST") return sendJson(res, 200, { ok: true }, { "Set-Cookie": accounts.logout(req) });
  const user = accounts.sessionUser(req);
  if (!user) return sendJson(res, 401, { error: "Sign in to access saved farms." });
  if (path === "/api/account/me" && req.method === "GET") return sendJson(res, 200, { user: { id: user.id, name: user.name, email: user.email } });
  if (path === "/api/account/farms" && req.method === "GET") return sendJson(res, 200, { farms: accounts.listFarms(user) });
  if (path === "/api/account/farms" && req.method === "POST") return sendJson(res, 201, { farm: await accounts.saveFarm(user, await requestBody(req)) });
  const id = /^\/api\/account\/farms\/([a-f0-9-]{36})$/.exec(path)?.[1];
  if (id && req.method === "DELETE") { await accounts.deleteFarm(user, id); return sendJson(res, 200, { ok: true }); }
  return sendJson(res, 404, { error: "Account route not found." });
}

export function createRequestHandler({ root, region, accounts = null, soilLookup = querySoil, imergLookup = queryImergDay, cropLookup = searchGlobalPlants }) {
  const rootDir = resolve(root);
  return async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname.startsWith("/api/account/")) return await handleAccount(req, res, url, accounts);
      if (req.method !== "GET") return sendJson(res, 405, { error: "GET only." });
      if (url.pathname === "/health") return sendJson(res, 200, { status: "ok" });
      if (url.pathname === "/api/soil") return sendJson(res, 200, await soilLookup(soilCoordinates(url, region)));
      if (url.pathname === "/api/imerg") return sendJson(res, 200, await imergLookup(coordinates(url), url.searchParams.get("day") || ""));
      if (url.pathname === "/api/crops/search") return sendJson(res, 200, await cropLookup(url.searchParams.get("q") || ""));
      const relative = publicFile(url.pathname);
      if (!relative) return sendJson(res, 404, { error: "Not found." });
      const path = resolve(rootDir, vendorFiles.get(relative) || relative);
      if (!path.startsWith(rootDir + sep) || !types[extname(path)]) return sendJson(res, 404, { error: "Not found." });
      const body = await readFile(path);
      const type = types[extname(path)];
      res.writeHead(200, { ...responseHeaders, "Content-Type": type.startsWith("image/") || type.startsWith("font/") ? type : `${type}; charset=utf-8` });
      res.end(body);
    } catch (error) {
      const code = error.status || (error.code === "ENOENT" ? 404 : /coordinates|latitude|longitude|Invalid|Day must|valid|password|email|Farm|Text|period|priorities|pH/.test(error.message) ? 400 : 502);
      sendJson(res, code, { error: error.message });
    }
  };
}
