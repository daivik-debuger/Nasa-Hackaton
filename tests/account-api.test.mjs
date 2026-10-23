import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequestHandler } from "../src/api/http-handler.js";
import { createFarmerAccountService } from "../src/server/farmer-accounts.js";

test("account API scopes farms, blocks anonymous access and rejects cross-origin writes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "terrasown-api-test-"));
  const accounts = await createFarmerAccountService(join(directory, "farmers.json"));
  const server = createServer(createRequestHandler({ root: resolve("."), region: { bounds: { south: 40, north: 43, west: -96, east: -90 } }, accounts }));
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, headers = {}) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json", Origin: base, ...headers }, body: JSON.stringify(body) });
  try {
    assert.equal((await fetch(base + "/api/account/farms")).status, 401);
    assert.equal((await post("/api/account/register", { name: "Demo", email: "demo@example.test", password: "test-only-password-123" }, { Origin: "https://evil.example" })).status, 403);
    const created = await post("/api/account/register", { name: "Demo", email: "demo@example.test", password: "test-only-password-123" });
    assert.equal(created.status, 201);
    const cookie = created.headers.get("set-cookie").split(";")[0];
    assert.match(created.headers.get("set-cookie"), /HttpOnly; SameSite=Strict/);
    const farm = { name: "Test field", latitude: 41, longitude: -93, startYear: 2025, endYear: 2025, lastCrop: "corn", priorCrop: "", soilTexture: "", soilPh: null, priorities: ["water"] };
    assert.equal((await post("/api/account/farms", farm)).status, 401);
    assert.equal((await post("/api/account/farms", farm, { Cookie: cookie })).status, 201);
    const list = await fetch(base + "/api/account/farms", { headers: { Cookie: cookie } });
    assert.equal((await list.json()).farms.length, 1);
    assert.equal((await fetch(base + "/api/account/farms")).status, 401);
    assert.equal((await fetch(base + "/.local-data/farmers.json")).status, 404);
  } finally {
    await new Promise((done) => server.close(done));
    await rm(directory, { recursive: true, force: true });
  }
});
