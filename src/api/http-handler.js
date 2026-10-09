import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { querySoil } from "./soil-service.js";
import { queryImergDay } from "./imerg-service.js";

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".md": "text/markdown", ".webmanifest": "application/manifest+json" };
const publicRootFiles = new Set(["index.html", "styles.css", "location-map.css", "research.css", "accessibility.css", "sw.js", "manifest.webmanifest", "icon.svg", "docs/PRIVACY.md"]);
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
    return publicRootFiles.has(relative) || vendorFiles.has(relative) || /^src\/[a-z0-9/-]+\.js$/.test(relative) || /^data\/[a-z0-9/-]+\.json$/.test(relative) ? relative : null;
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

export function createRequestHandler({ root, region, soilLookup = querySoil, imergLookup = queryImergDay }) {
  const rootDir = resolve(root);
  return async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method !== "GET") return sendJson(res, 405, { error: "GET only." });
      if (url.pathname === "/health") return sendJson(res, 200, { status: "ok" });
      if (url.pathname === "/api/soil") return sendJson(res, 200, await soilLookup(soilCoordinates(url, region)));
      if (url.pathname === "/api/imerg") return sendJson(res, 200, await imergLookup(coordinates(url), url.searchParams.get("day") || ""));
      const relative = publicFile(url.pathname);
      if (!relative) return sendJson(res, 404, { error: "Not found." });
      const path = resolve(rootDir, vendorFiles.get(relative) || relative);
      if (!path.startsWith(rootDir + sep) || !types[extname(path)]) return sendJson(res, 404, { error: "Not found." });
      const body = await readFile(path);
      res.writeHead(200, { ...responseHeaders, "Content-Type": `${types[extname(path)]}; charset=utf-8` });
      res.end(body);
    } catch (error) {
      const code = error.status || (error.code === "ENOENT" ? 404 : /coordinates|latitude|longitude|Invalid|Day must|valid/.test(error.message) ? 400 : 502);
      sendJson(res, code, { error: error.message });
    }
  };
}
