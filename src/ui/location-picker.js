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
  const exactCoordinates = document.getElementById("exactCoordinates");
  const leaflet = globalThis.L;
  let map = null;
  let marker = null;

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
    map.setView([normalized.lat, normalized.lon], Math.max(map.getZoom(), 10));
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
    exactCoordinates.open = true;
    status.textContent = "The map could not load. Enter exact coordinates below or choose a public example.";
    return { showPin, clearPin };
  }

  map = leaflet.map(mapElement, { worldCopyJump: true, minZoom: 2, maxZoom: 18 }).setView([20, 0], 2);
  leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
  }).on("tileerror", () => {
    status.textContent = "Map imagery is unavailable right now. You can still choose an example or enter exact coordinates.";
  }).addTo(map);
  map.on("click", (event) => selectPoint(event.latlng, "Pin placed. Drag it to refine the point."));
  status.textContent = "Tap or click the map to drop a pin. Drag the pin to refine it; keyboard users can pan the map and choose its center.";
  return { showPin, clearPin };
}
