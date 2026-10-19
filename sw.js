const CACHE_NAME = "terrasown-shell-v23";
const APP_SHELL = ["./dist/global-app.js", "./dist/global-app.css", "./data/global-crops.json", "./data/global-layers.json", "./data/agronomy.json", "./src/agronomy-validation.js", "./src/engine/regional-engine.js", "./src/ui/agronomy-view.js", "./assets/fonts/newsreader-regular.ttf", "./assets/fonts/jakarta-regular.ttf", "./assets/fonts/jakarta-semibold.ttf", "./assets/fonts/plex-mono.ttf", "./", "./index.html", "./workspace.css", "./assets/crops/alfalfa.jpg", "./assets/crops/cereal-rye.jpg", "./assets/crops/corn.jpg", "./assets/crops/oats.jpg", "./assets/crops/oilseed-radish.jpg", "./assets/crops/red-clover.jpg", "./assets/crops/soybean.jpg", "./assets/crops/winter-wheat.jpg", "./vendor/leaflet.css", "./vendor/leaflet.js", "./src/main.js", "./src/climate.js", "./src/coverage.js", "./src/global-demo-locations.js", "./src/nasa-power.js", "./src/api/nasa-power.js", "./src/api/soil-data.js", "./src/api/imerg.js", "./src/api/global-crops.js", "./src/engine/indicators.js", "./src/engine/compare-strategies.js", "./src/engine/confidence.js", "./src/ui/climate-view.js", "./src/ui/overview-view.js", "./src/ui/crop-view.js", "./src/ui/view-router.js", "./src/ui/soil-view.js", "./src/ui/strategy-view.js", "./src/ui/research-view.js", "./src/ui/location-picker.js", "./src/ui/status-view.js", "./src/validation/field-inputs.js", "./data/regions/central-iowa.json", "./data/crops.json", "./data/crops/corn.json", "./data/crops/oats.json", "./data/crops/soybean.json", "./data/crops/alfalfa.json", "./data/crops/winter-wheat.json", "./data/crops/cereal-rye.json", "./data/crops/red-clover.json", "./data/crops/oilseed-radish.json", "./data/evidence.json", "./data/global-research.json", "./data/rotation-rules.json", "./data/sources.json", "./docs/PRIVACY.md", "./manifest.webmanifest", "./icon.svg"];

APP_SHELL.push("./terrasown.css");
APP_SHELL.push(...[400,600,700].map((weight) => `./dist/space-grotesk-latin-${weight}-normal.woff2`));

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
