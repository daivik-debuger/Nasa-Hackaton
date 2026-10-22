import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../sw.js", import.meta.url), "utf8");

function startWorker(hostname) {
  const listeners = new Map();
  const deleted = [];
  const cacheNames = ["terrasown-shell-v23", "fieldshift-shell-v22", "unrelated-cache"];
  const self = {
    location: { hostname, origin: `https://${hostname}` },
    addEventListener(name, callback) { listeners.set(name, callback); },
    skipWaiting: async () => {},
    clients: { claim: async () => {} }
  };
  const caches = {
    keys: async () => cacheNames,
    delete: async (name) => { deleted.push(name); return true; },
    open: async () => ({ addAll: async () => {}, put: async () => {} }),
    match: async () => undefined
  };
  runInNewContext(source, { self, caches, URL, Promise, fetch: async () => ({ ok: false }) });
  return { listeners, deleted };
}

test("localhost preview never serves a cached page when its server is stopped", async () => {
  const worker = startWorker("127.0.0.1");
  let intercepted = false;
  worker.listeners.get("fetch")({
    request: { method: "GET", url: "http://127.0.0.1:8001/" },
    respondWith() { intercepted = true; }
  });
  assert.equal(intercepted, false);

  let activation;
  worker.listeners.get("activate")({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(worker.deleted, ["terrasown-shell-v23", "fieldshift-shell-v22"]);
});

test("HTTPS deployment still uses the PWA fetch handler", () => {
  const worker = startWorker("farm.example.org");
  let intercepted = false;
  worker.listeners.get("fetch")({
    request: { method: "GET", url: "https://farm.example.org/" },
    respondWith() { intercepted = true; }
  });
  assert.equal(intercepted, true);
});
