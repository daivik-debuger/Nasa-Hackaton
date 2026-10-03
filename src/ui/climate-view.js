const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";

export function renderClimate(summary) {
  document.getElementById("climateMetrics").innerHTML = `<div class="metric"><span class="metric-label">MEAN AIR TEMP</span><strong>${fmt(summary.mean)}°</strong><span class="metric-unit">${summary.temperatureUnit} · ${summary.count.toLocaleString()} valid days</span></div><div class="metric"><span class="metric-label">TOTAL RAINFALL</span><strong>${fmt(summary.totalRain, 0)}</strong><span class="metric-unit">mm · period sum</span></div><div class="metric"><span class="metric-label">HOT DAYS</span><strong>${summary.hotDays.toLocaleString()}</strong><span class="metric-unit">days · max ≥ 30°C</span></div>`;
  document.getElementById("periodBadge").textContent = `${summary.start}–${summary.end}`;
  document.getElementById("climateSubhead").textContent = `NASA POWER daily data · ${summary.start} to ${summary.end} · ${summary.lat.toFixed(3)}, ${summary.lon.toFixed(3)}.`;
  document.getElementById("requestedPoint").textContent = `${summary.lat.toFixed(4)}, ${summary.lon.toFixed(4)}`;
  document.getElementById("requestedPeriod").textContent = `${summary.start}–${summary.end} · ${summary.count.toLocaleString()} valid days`;
  const bins = new Map();
  for (const day of summary.keys) {
    const month = day.slice(0, 6), temp = Number(summary.params.T2M[day]), rain = Number(summary.params.PRECTOTCORR[day]);
    if (!Number.isFinite(temp) || temp === summary.fillValue || !Number.isFinite(rain) || rain === summary.fillValue) continue;
    const bin = bins.get(month) || { t: 0, n: 0, r: 0 };
    bin.t += temp; bin.n++; bin.r += rain; bins.set(month, bin);
  }
  const data = [...bins.values()];
  if (!data.length) return;
  const maxRain = Math.max(1, ...data.map((b) => b.r));
  const rainBars = data.map((b, i) => `<rect x="${i * 680 / data.length}" y="${140 - b.r / maxRain * 115}" width="${Math.max(1, 680 / data.length * .62)}" height="${b.r / maxRain * 115}" fill="#8eb3bd" opacity=".7"/>`).join("");
  const temps = data.map((b, i) => `${i * 680 / Math.max(1, data.length - 1)},${135 - (b.t / b.n + 25) / 65 * 120}`).join(" ");
  const chart = document.getElementById("chart");
  chart.className = "";
  chart.innerHTML = `<svg class="chart-svg" viewBox="0 0 680 148" role="img" aria-label="Monthly mean air temperature line and monthly rainfall bars"><line x1="0" y1="140" x2="680" y2="140" stroke="#e8ede7"/>${rainBars}<polyline points="${temps}" fill="none" stroke="#d48a4d" stroke-width="2"/></svg>`;
}

export function renderImerg(data, referenceDay, powerRain) {
  const status = document.getElementById("imergStatus"), metric = document.getElementById("imergMetric");
  if (!data) { status.textContent = "IMERG unavailable for this reference day. The comparison remains possible, with lower context confidence."; metric.textContent = "Unavailable"; return; }
  metric.textContent = `${fmt(data.value)} mm`;
  status.textContent = `Rainiest April–September day in the chosen end year: ${data.time}. IMERG estimates ${fmt(data.value)} mm from ${data.sampleCount} half-hour samples; POWER estimates ${fmt(powerRain)} mm for the same UTC day. Different grids and methods can disagree. Neither is a field gauge or forecast.`;
}
