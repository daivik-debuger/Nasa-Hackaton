import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { querySoil } from "./soil-service.js";
import { queryImergDay } from "./imerg-service.js";
import { searchGlobalPlants } from "./global-crops-service.js";

const types = { ".ttf": "font/ttf", ".woff2": "font/woff2", ".txt": "text/plain", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".md": "text/markdown", ".webmanifest": "application/manifest+json" };
const publicRootFiles = new Set(["dist/global-app.js", "dist/global-app.css", ...[400,600,700].map((weight) => `dist/space-grotesk-latin-${weight}-normal.woff2`), "index.html", "workspace.css", "terrasown.css", "styles.css", "dashboard.css", "farm-hero.css", "location-map.css", "research.css", "accessibility.css", "sw.js", "manifest.webmanifest", "icon.svg", "assets/farm-overview.jpg", "assets/harvest-card.jpg", "assets/wheat-ear.png", ...["alfalfa", "cereal-rye", "corn", "oats", "oilseed-radish", "red-clover", "soybean", "winter-wheat"].map((id) => `assets/crops/${id}.jpg`), "docs/PRIVACY.md", "docs/GLOBAL_RESEARCH.md", "docs/RESEARCH_EVIDENCE_AUDIT.md"]);
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

function sendJson(res, code, value) {
  res.writeHead(code, { ...responseHeaders, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(value));
}

export function createRequestHandler({ root, region, soilLookup = querySoil, imergLookup = queryImergDay, cropLookup = searchGlobalPlants }) {
  const rootDir = resolve(root);
  return async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
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
      const code = error.status || (error.code === "ENOENT" ? 404 : /coordinates|latitude|longitude|Invalid|Day must|valid/.test(error.message) ? 400 : 502);
      sendJson(res, code, { error: error.message });
    }
  };
}
