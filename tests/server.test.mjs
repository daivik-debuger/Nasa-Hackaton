import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  assert.deepEqual((await call("/health")).body, { status: "ok" });
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
  for (const path of ["/package.json", "/data/AGENTS.md", "/docs/STATUS.md", "/tests/fixtures/nasa-power-des-moines-2025-01-01-to-2025-01-07.json", "/.git/config"]) assert.equal((await call(path)).status, 404, path);
});
