import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { querySoil } from "./src/api/soil-service.js";
import { queryImergDay } from "./src/api/imerg-service.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const region = JSON.parse(await readFile(new URL("./data/regions/central-iowa.json", import.meta.url), "utf8"));
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };
const port = Number(process.env.PORT || 8000);

function coordinates(url) {
  const lat = Number(url.searchParams.get("latitude")), lon = Number(url.searchParams.get("longitude"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < region.bounds.south || lat > region.bounds.north || lon < region.bounds.west || lon > region.bounds.east) throw new Error("Choose coordinates inside the central Iowa pilot region.");
  return { lat, lon };
}

function sendJson(res, code, value) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (req.method !== "GET") return sendJson(res, 405, { error: "GET only." });
    if (url.pathname === "/api/soil") return sendJson(res, 200, await querySoil(coordinates(url)));
    if (url.pathname === "/api/imerg") return sendJson(res, 200, await queryImergDay(coordinates(url), url.searchParams.get("day") || ""));
    const path = resolve(root, `.${url.pathname === "/" ? "/index.html" : url.pathname}`);
    if (!path.startsWith(root + sep) || !types[extname(path)]) return sendJson(res, 404, { error: "Not found." });
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": `${types[extname(path)]}; charset=utf-8`, "Cache-Control": "no-store" });
    res.end(body);
  } catch (error) {
    sendJson(res, error.code === "ENOENT" ? 404 : /coordinates|Invalid|Day must/.test(error.message) ? 400 : 502, { error: error.message });
  }
}).listen(port, "127.0.0.1", () => console.log(`FieldShift pilot running at http://localhost:${port}`));
