const MAX_MAP_LATITUDE = 85.05112878;

export function normalizeMapPoint({ lat, lon, lng }) {
  const longitude = lon ?? lng;
  if (!Number.isFinite(lat) || !Number.isFinite(longitude) || lat < -90 || lat > 90) throw new Error("Choose a valid location on Earth.");
  const wrappedLongitude = ((longitude + 180) % 360 + 360) % 360 - 180;
  return { lat: Number(lat.toFixed(6)), lon: Number(wrappedLongitude.toFixed(6)) };
}

export function createLocationPicker({ onSelect, onClear }) {
  const mapElement = document.getElementById("fieldMap");
  const selected = document.getElementById("selectedPlace");
  const status = document.getElementById("mapStatus");
  const centerButton = document.getElementById("useMapCenter");
  const clearButton = document.getElementById("clearPin");
  const satelliteButton = document.getElementById("satelliteStyle");
  const streetButton = document.getElementById("streetStyle");
  const sourceLabel = document.querySelector(".map-source-label");
  const exactCoordinates = document.getElementById("exactCoordinates");
  const leaflet = globalThis.L;
  let map = null;
  let marker = null;
  let activeLayer = null;
  let satelliteFailed = false;

  function clearPin() {
    if (marker) { marker.remove(); marker = null; }
    selected.textContent = "No place selected yet. Tap the map, use its center, or choose an example.";
    clearButton.disabled = true;
  }

  function showPin(point, label = "Pin placed. Zoom in or drag it to refine the point.") {
    const normalized = normalizeMapPoint(point);
    clearPin();
    selected.textContent = label;
    clearButton.disabled = false;
    if (!map) return normalized;
    if (Math.abs(normalized.lat) > MAX_MAP_LATITUDE) {
      selected.textContent = "Exact polar coordinates selected. The map cannot display a reliable pin this close to a pole; the entered point is still used for data requests.";
      map.setView([Math.sign(normalized.lat) * MAX_MAP_LATITUDE, normalized.lon], 3);
      return normalized;
    }
    marker = leaflet.marker([normalized.lat, normalized.lon], {
      draggable: true,
      icon: leaflet.divIcon({ className: "field-pin-icon", html: "<span aria-hidden=\"true\"></span>", iconSize: [28, 38], iconAnchor: [14, 36] })
    }).addTo(map);
    marker.on("dragend", () => selectPoint(marker.getLatLng(), "Pin moved. This point will be used for data requests."));
    map.setView([normalized.lat, normalized.lon], Math.max(map.getZoom(), 13));
    return normalized;
  }

  function selectPoint(point, label) {
    const normalized = showPin(point, label);
    onSelect(normalized);
  }

  centerButton.addEventListener("click", () => {
    if (map) selectPoint(map.getCenter(), "Pin placed at the map center. Drag it to refine the point.");
  });
  clearButton.addEventListener("click", () => { clearPin(); onClear(); });

  if (!leaflet) {
    mapElement.hidden = true;
    centerButton.disabled = true;
    satelliteButton.disabled = true;
    streetButton.disabled = true;
    exactCoordinates.open = true;
    status.textContent = "The map could not load. Enter exact coordinates below or choose a public example.";
    return { showPin, clearPin };
  }

  map = leaflet.map(mapElement, { worldCopyJump: true, minZoom: 2, maxZoom: 18 }).setView([20, 0], 2);
  const satelliteLayer = leaflet.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9" target="_blank" rel="noopener noreferrer">Esri World Imagery</a> — Esri, Vantor, Earthstar Geographics, GIS User Community'
  });
  const streetLayer = leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  });

  function setMapStyle(style) {
    if (style === "satellite" && satelliteFailed) return;
    if (activeLayer) map.removeLayer(activeLayer);
    activeLayer = style === "satellite" ? satelliteLayer : streetLayer;
    activeLayer.addTo(map);
    satelliteButton.classList.toggle("active", style === "satellite");
    streetButton.classList.toggle("active", style === "streets");
    satelliteButton.setAttribute("aria-pressed", String(style === "satellite"));
    streetButton.setAttribute("aria-pressed", String(style === "streets"));
    sourceLabel.textContent = style === "satellite" ? "Satellite view" : "Street view";
    status.textContent = style === "satellite"
      ? "Esri satellite imagery is a location basemap. Its date and resolution vary by place; it does not measure crop health."
      : "OpenStreetMap street view is active. Tap to place a pin, or pan and use the map center.";
  }

  satelliteLayer.on("tileerror", () => {
    if (activeLayer !== satelliteLayer || satelliteFailed) return;
    satelliteFailed = true;
    satelliteButton.disabled = true;
    setMapStyle("streets");
    status.textContent = "Satellite tiles could not load. Street view is available; you can still choose a place or enter coordinates.";
  });
  streetLayer.on("tileerror", () => {
    if (activeLayer === streetLayer) status.textContent = "Map tiles are unavailable right now. Choose a public example or enter exact coordinates.";
  });
  satelliteButton.addEventListener("click", () => setMapStyle("satellite"));
  streetButton.addEventListener("click", () => setMapStyle("streets"));
  setMapStyle("satellite");
  map.on("click", (event) => selectPoint(event.latlng, "Pin placed. Drag it to refine the point."));
  return { showPin, clearPin };
}
