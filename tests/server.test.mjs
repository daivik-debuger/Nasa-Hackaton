import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createRequestHandler } from "../src/api/http-handler.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const region = JSON.parse(await readFile(new URL("../data/regions/central-iowa.json", import.meta.url), "utf8"));

async function call(url, options = {}) {
  let status, headers, body;
  const res = {
    writeHead(code, head) { status = code; headers = head; },
    end(value) { body = value; }
  };
  const handler = createRequestHandler({ root, region, ...options });
  await handler({ method: "GET", url, headers: { host: "localhost" } }, res);
  return { status, headers, body: typeof body === "string" ? JSON.parse(body) : body };
}

test("server health and unsupported soil responses do not require live services", async () => {
  const health = await call("/health");
  assert.deepEqual(health.body, { status: "ok" });
  assert.equal(health.headers["X-Content-Type-Options"], "nosniff");
  assert.equal(health.headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  const outside = await call("/api/soil?latitude=-15.7939&longitude=-47.8828", { soilLookup: () => { throw new Error("Should not call USDA."); } });
  assert.equal(outside.status, 422);
  assert.match(outside.body.error, /Central Iowa/);
  assert.equal((await call("/api/imerg?longitude=0&day=20250101")).status, 400);
});

test("IMERG route accepts global coordinates and preserves the requested day", async () => {
  const result = await call("/api/imerg?latitude=-15.7939&longitude=-47.8828&day=20250101", { imergLookup: (point, day) => ({ point, day }) });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { point: { lat: -15.7939, lon: -47.8828 }, day: "20250101" });
});

test("public server serves app assets but not repository internals", async () => {
  assert.equal((await call("/")).status, 200);
  assert.equal((await call("/data/regions/central-iowa.json")).status, 200);
  assert.equal((await call("/src/main.js")).status, 200);
  assert.equal((await call("/research.css")).status, 200);
  assert.equal((await call("/dashboard.css")).status, 200);
  assert.equal((await call("/farm-hero.css")).status, 200);
  const overviewImage = await call("/assets/farm-overview.jpg");
  assert.equal(overviewImage.status, 200);
  assert.equal(overviewImage.headers["Content-Type"], "image/jpeg");
  assert.equal((await call("/assets/harvest-card.jpg")).status, 200);
  assert.equal((await call("/assets/crops/oats.jpg")).headers["Content-Type"], "image/jpeg");
  assert.equal((await call("/assets/crops/unknown.jpg")).status, 404);
  const wheatImage = await call("/assets/wheat-ear.png");
  assert.equal(wheatImage.status, 200);
  assert.equal(wheatImage.headers["Content-Type"], "image/png");
  assert.equal((await call("/location-map.css")).status, 200);
  assert.equal((await call("/vendor/leaflet.js")).status, 200);
  assert.equal((await call("/vendor/leaflet.css")).status, 200);
  for (const path of ["/package.json", "/node_modules/leaflet/dist/leaflet.js", "/vendor/not-approved.js", "/data/AGENTS.md", "/docs/STATUS.md", "/tests/fixtures/nasa-power-des-moines-2025-01-01-to-2025-01-07.json", "/.git/config"]) assert.equal((await call(path)).status, 404, path);
});

test("real HTTP listener serves health, data, and errors without live upstream calls", async (t) => {
  const server = createServer(createRequestHandler({
    root,
    region,
    soilLookup: async () => ({ sourceId: "synthetic-test-soil" }),
    imergLookup: async (_point, day) => ({ day, sourceId: "synthetic-test-imerg" })
  }));
  try {
    await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  } catch (error) {
    if (error.code === "EPERM" && !process.env.CI) {
      t.skip("Local sandbox disallows loopback listeners; CI runs this test.");
      return;
    }
    throw error;
  }
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });
    const crop = await fetch(`${base}/data/crops/corn.json`);
    assert.equal(crop.status, 200);
    assert.equal((await crop.json()).id, "corn");
    const soil = await fetch(`${base}/api/soil?latitude=42.03&longitude=-93.62`);
    assert.deepEqual(await soil.json(), { sourceId: "synthetic-test-soil" });
    const rejected = await fetch(`${base}/api/soil?latitude=200&longitude=0`);
    assert.equal(rejected.status, 400);
    const privateFile = await fetch(`${base}/package.json`);
    assert.equal(privateFile.status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
