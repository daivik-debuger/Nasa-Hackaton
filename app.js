import { summarizePowerPayload, validateFieldQuery } from "./src/climate.js";
import { fetchPowerData } from "./src/nasa-power.js";

const $ = (id) => document.getElementById(id);
const nowYear = new Date().getUTCFullYear();
const lastFullYear = nowYear - 1;
for (const id of ["startYear", "endYear"]) {
  const select = $(id);
  for (let year = lastFullYear; year >= 1981; year--) {
    const option = document.createElement("option"); option.value = String(year); option.textContent = String(year); select.append(option);
  }
}
$("startYear").value = String(Math.max(1981, lastFullYear - 4));
$("endYear").value = String(lastFullYear);

const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";

function validateLocation() {
  return validateFieldQuery({
    latitude: $("latitude").value,
    longitude: $("longitude").value,
    startYear: $("startYear").value,
    endYear: $("endYear").value
  }, { lastFullYear });
}

function drawChart(summary) {
  const days = summary.keys;
  const t = summary.params.T2M, r = summary.params.PRECTOTCORR;
  const monthBins = new Map();
  for (const day of days) {
    const month = day.slice(0, 6);
    const tv = Number(t[day]), rv = Number(r[day]);
    if (!Number.isFinite(tv) || tv <= -900 || !Number.isFinite(rv) || rv <= -900) continue;
    const bin = monthBins.get(month) || { temp: 0, n: 0, rain: 0 };
    bin.temp += tv; bin.n += 1; bin.rain += rv; monthBins.set(month, bin);
  }
  const bins = [...monthBins.entries()].map(([month, b]) => ({ month, temp: b.temp / b.n, rain: b.rain }));
  const width = 680, height = 148, left = 35, right = 12, top = 16, bottom = 23;
  const innerW = width - left - right, innerH = height - top - bottom;
  const min = Math.min(...bins.map((b) => b.temp)), max = Math.max(...bins.map((b) => b.temp));
  const span = Math.max(5, max - min);
  const yT = (v) => top + innerH - ((v - min) / span) * innerH;
  const maxRain = Math.max(1, ...bins.map((b) => b.rain));
  const barW = Math.max(2, innerW / bins.length * .45);
  const points = bins.map((b, i) => `${left + i * (innerW / Math.max(1, bins.length - 1))},${yT(b.temp)}`).join(" ");
  const bars = bins.map((b, i) => { const x = left + i * (innerW / Math.max(1, bins.length - 1)); const h = (b.rain / maxRain) * innerH * .68; return `<rect x="${x - barW / 2}" y="${top + innerH - h}" width="${barW}" height="${h}" rx="2" fill="#8eb3bd" opacity=".68"><title>${b.month.slice(0,4)}-${b.month.slice(4)} rainfall: ${fmt(b.rain)} mm</title></rect>`; }).join("");
  const labels = bins.map((b, i) => { if (bins.length > 18 && i % 3 !== 0) return ""; const x = left + i * (innerW / Math.max(1, bins.length - 1)); return `<text x="${x}" y="${height - 4}" text-anchor="middle" class="chart-label">${b.month.slice(4)}</text>`; }).join("");
  $("chart").className = "";
  $("chart").innerHTML = `<svg class="chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly mean daily temperature line and monthly rainfall bars"><line x1="${left}" y1="${top + innerH}" x2="${width-right}" y2="${top + innerH}" stroke="#e8ede7"/>${bars}<polyline points="${points}" fill="none" stroke="#d48a4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>${labels}</svg>`;
}

function renderSummary(s, payload) {
  const dailyUnits = payload?.parameters?.PRECTOTCORR?.units || "mm/day";
  const rainLabel = dailyUnits.toLowerCase().includes("mm") ? "mm" : dailyUnits;
  $("climateMetrics").innerHTML = `<div class="metric"><span class="metric-label">MEAN AIR TEMP</span><strong>${fmt(s.mean)}°</strong><span class="metric-unit">${s.temperatureUnit} · ${s.count.toLocaleString()} daily values</span></div><div class="metric"><span class="metric-label">TOTAL RAINFALL</span><strong>${fmt(s.totalRain, 0)}</strong><span class="metric-unit">${rainLabel} · summed daily values</span></div><div class="metric"><span class="metric-label">HOT DAYS</span><strong>${s.hotDays.toLocaleString()}</strong><span class="metric-unit">days · max ≥ 30°C threshold</span></div>`;
  $("periodBadge").textContent = `${s.start}–${s.end}`;
  $("climateSubhead").textContent = `NASA POWER daily data · ${s.start} to ${s.end} · requested point ${s.lat.toFixed(3)}, ${s.lon.toFixed(3)}.`;
  $("requestedPoint").textContent = `${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`;
  $("requestedPeriod").textContent = `${s.start}–${s.end} · ${s.count.toLocaleString()} valid days`;
  drawChart(s);
}

$("loadClimate").addEventListener("click", async () => {
  const button = $("loadClimate"), status = $("climateStatus");
  try {
    const loc = validateLocation();
    button.disabled = true; status.className = "status"; status.textContent = "Requesting daily climate data from NASA POWER…";
    const payload = await fetchPowerData(loc);
    const summary = summarizePowerPayload(payload, loc);
    renderSummary(summary, payload);
    status.className = "status success"; status.textContent = "NASA POWER data loaded. Treat it as regional context—not a measurement from your field.";
  } catch (error) {
    status.className = "status error";
    status.textContent = error.code === "network" ? "Could not reach NASA POWER. Check your internet connection and try again. If you opened this as a local file, run it from a local web server." : error.message;
  } finally { button.disabled = false; }
});

$("summarize").addEventListener("click", () => {
  const name = $("fieldName").value.trim() || "Unnamed field";
  const loc = `${Number($("latitude").value).toFixed(4)}, ${Number($("longitude").value).toFixed(4)}`;
  const last = $("lastCrop").value || "not entered", prior = $("priorCrop").value || "not entered";
  const texture = $("soilTexture").value || "not known / not entered";
  const ph = $("soilPh").value ? `pH ${Number($("soilPh").value).toFixed(1)} (farmer-entered; verify test date)` : "no soil pH provided";
  const priorities = [...document.querySelectorAll(".priority-options input:checked")].map((i) => i.parentElement.innerText.trim());
  $("inputSummary").textContent = `${name} · ${loc}. Crop history: ${prior} → ${last}. Soil: ${texture}; ${ph}. Priorities: ${priorities.length ? priorities.join(", ") : "none selected"}. This summary is only stored on this page and is not sent to a server.`;
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
