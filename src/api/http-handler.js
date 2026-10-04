import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { querySoil } from "./soil-service.js";
import { queryImergDay } from "./imerg-service.js";

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".md": "text/markdown", ".webmanifest": "application/manifest+json" };

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
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}

export function createRequestHandler({ root, region, soilLookup = querySoil, imergLookup = queryImergDay }) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      if (req.method !== "GET") return sendJson(res, 405, { error: "GET only." });
      if (url.pathname === "/health") return sendJson(res, 200, { status: "ok" });
      if (url.pathname === "/api/soil") return sendJson(res, 200, await soilLookup(soilCoordinates(url, region)));
      if (url.pathname === "/api/imerg") return sendJson(res, 200, await imergLookup(coordinates(url), url.searchParams.get("day") || ""));
      const path = resolve(root, `.${url.pathname === "/" ? "/index.html" : url.pathname}`);
      if (!path.startsWith(root + sep) || !types[extname(path)]) return sendJson(res, 404, { error: "Not found." });
      const body = await readFile(path);
      res.writeHead(200, { "Content-Type": `${types[extname(path)]}; charset=utf-8`, "Cache-Control": "no-store" });
      res.end(body);
    } catch (error) {
      const code = error.status || (error.code === "ENOENT" ? 404 : /coordinates|latitude|longitude|Invalid|Day must|valid/.test(error.message) ? 400 : 502);
      sendJson(res, code, { error: error.message });
    }
  };
}
