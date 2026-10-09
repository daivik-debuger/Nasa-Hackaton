const CACHE_NAME = "fieldshift-shell-v8";
const APP_SHELL = ["./", "./index.html", "./styles.css", "./research.css", "./accessibility.css", "./src/main.js", "./src/climate.js", "./src/coverage.js", "./src/global-demo-locations.js", "./src/nasa-power.js", "./src/api/nasa-power.js", "./src/api/soil-data.js", "./src/api/imerg.js", "./src/engine/indicators.js", "./src/engine/compare-strategies.js", "./src/engine/confidence.js", "./src/ui/climate-view.js", "./src/ui/soil-view.js", "./src/ui/strategy-view.js", "./src/ui/research-view.js", "./src/ui/status-view.js", "./src/validation/field-inputs.js", "./data/regions/central-iowa.json", "./data/crops.json", "./data/crops/corn.json", "./data/crops/soybean.json", "./data/crops/oats.json", "./data/crops/alfalfa.json", "./data/crops/winter-wheat.json", "./data/crops/cereal-rye.json", "./data/crops/red-clover.json", "./data/crops/oilseed-radish.json", "./data/evidence.json", "./data/rotation-rules.json", "./data/sources.json", "./docs/PRIVACY.md", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin || new URL(request.url).pathname.startsWith("/api/")) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
    return response;
  }).catch(async () => (await caches.match(request)) || (request.mode === "navigate" ? caches.match("./index.html") : Response.error())));
});
