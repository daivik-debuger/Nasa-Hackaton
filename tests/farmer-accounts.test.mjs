import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFarmerAccountService } from "../src/server/farmer-accounts.js";

const request = { socket: { remoteAddress: "127.0.0.1" }, headers: { host: "127.0.0.1:8000" } };
const farm = { name: "North field", latitude: 41.5, longitude: -93.4, startYear: 2023, endYear: 2025, lastCrop: "corn", priorCrop: "soybean", soilTexture: "Loam or silt loam", soilPh: 6.4, priorities: ["water"] };

test("local accounts isolate saved farms and survive a service restart", async () => {
  const directory = await mkdtemp(join(tmpdir(), "terrasown-account-test-"));
  try {
    const path = join(directory, "farmers.json");
    const service = await createFarmerAccountService(path);
    const alice = await service.register({ name: "Alice", email: "alice@example.test", password: "a-strong-test-password" }, request);
    const bob = await service.register({ name: "Bob", email: "bob@example.test", password: "another-test-password" }, request);
    const aliceRequest = { ...request, headers: { ...request.headers, cookie: alice.cookie.split(";")[0] } };
    const bobRequest = { ...request, headers: { ...request.headers, cookie: bob.cookie.split(";")[0] } };
    const aliceUser = service.sessionUser(aliceRequest), bobUser = service.sessionUser(bobRequest);
    assert.equal(aliceUser.name, "Alice");
    const saved = await service.saveFarm(aliceUser, farm);
    assert.equal(service.listFarms(aliceUser).length, 1);
    assert.equal(service.listFarms(bobUser).length, 0);
    await assert.rejects(service.saveFarm(bobUser, { ...farm, id: saved.id }), /not found/i);
    await assert.rejects(service.deleteFarm(bobUser, saved.id), /not found/i);
    assert.equal((await createFarmerAccountService(path)).listFarms({ id: aliceUser.id }).length, 1);
    service.logout(aliceRequest);
    assert.equal(service.sessionUser(aliceRequest), null);
    const loggedIn = await service.login({ email: "alice@example.test", password: "a-strong-test-password" }, request);
    assert.equal(loggedIn.user.name, "Alice");
    await service.deleteFarm(aliceUser, saved.id);
    assert.equal(service.listFarms(aliceUser).length, 0);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("account and farm inputs reject weak or invalid values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "terrasown-account-test-"));
  try {
    const service = await createFarmerAccountService(join(directory, "farmers.json"));
    await assert.rejects(service.register({ name: "A", email: "bad", password: "short" }, request), /email/i);
    await assert.rejects(service.register({ name: "A", email: "a@example.test", password: "short" }, request), /password/i);
    const result = await service.register({ name: "A", email: "a@example.test", password: "a-strong-test-password" }, request);
    const user = service.sessionUser({ ...request, headers: { ...request.headers, cookie: result.cookie.split(";")[0] } });
    await assert.rejects(service.saveFarm(user, { ...farm, latitude: 100 }), /coordinates/i);
    await assert.rejects(service.saveFarm(user, { ...farm, soilPh: 20 }), /pH/i);
    assert.equal(service.listFarms(user).length, 0);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
