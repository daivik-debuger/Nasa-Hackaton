const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";

export function renderClimate(summary) {
  if (!summary) {
    document.getElementById("climateMetrics").innerHTML = '<div class="metric"><span class="metric-label">MEAN AIR TEMP</span><strong>—</strong><span class="metric-unit">°C · daily mean</span></div><div class="metric"><span class="metric-label">SUMMED RAINFALL</span><strong>—</strong><span class="metric-unit">mm · valid days only</span></div><div class="metric"><span class="metric-label">HOT DAYS</span><strong>—</strong><span class="metric-unit">days · max ≥ 30°C</span></div>';
    document.getElementById("periodBadge").textContent = "WAITING FOR DATA";
    document.getElementById("climateSubhead").textContent = "Load NASA POWER data to populate this view.";
    document.getElementById("requestedPoint").textContent = "Not loaded";
    document.getElementById("requestedPeriod").textContent = "Not loaded";
    const chart = document.getElementById("chart");
    chart.className = "chart-empty";
    chart.textContent = "Your NASA data chart will appear here.";
    return;
  }
  document.getElementById("climateMetrics").innerHTML = `<div class="metric"><span class="metric-label">MEAN AIR TEMP</span><strong>${fmt(summary.mean)}°</strong><span class="metric-unit">${summary.temperatureUnit} · ${summary.count.toLocaleString()} valid days</span></div><div class="metric"><span class="metric-label">SUMMED RAINFALL</span><strong>${fmt(summary.totalRain, 0)}</strong><span class="metric-unit">mm · ${summary.rainfallCount.toLocaleString()} valid days</span></div><div class="metric"><span class="metric-label">HOT DAYS</span><strong>${summary.hotDays.toLocaleString()}</strong><span class="metric-unit">max ≥ 30°C · ${summary.maxTemperatureCount.toLocaleString()} valid days</span></div>`;
  document.getElementById("periodBadge").textContent = `${summary.start}–${summary.end}`;
  document.getElementById("climateSubhead").textContent = `NASA POWER daily data · ${summary.start} to ${summary.end} · ${summary.lat.toFixed(3)}, ${summary.lon.toFixed(3)}.`;
  document.getElementById("requestedPoint").textContent = `${summary.lat.toFixed(4)}, ${summary.lon.toFixed(4)}`;
  document.getElementById("requestedPeriod").textContent = `${summary.start}–${summary.end} · ${summary.count.toLocaleString()} valid days`;
  const bins = new Map();
  for (const day of summary.keys) {
    const month = day.slice(0, 6), tempRaw = summary.params.T2M[day], rainRaw = summary.params.PRECTOTCORR[day];
    if (tempRaw === null || tempRaw === "" || rainRaw === null || rainRaw === "") continue;
    const temp = Number(tempRaw), rain = Number(rainRaw);
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

export function renderImerg(data, referenceDay, powerRain, state = "result") {
  const status = document.getElementById("imergStatus"), metric = document.getElementById("imergMetric");
  if (!data) {
    const messages = {
      "not-loaded": "Load data to compare IMERG with NASA POWER on the wettest valid day in your selected end year. This is historical context, not a forecast.",
      "power-unavailable": "IMERG cross-check was not attempted because valid NASA POWER context was unavailable.",
      "no-reference": "IMERG cross-check was not attempted because the selected end year had no valid POWER precipitation day."
    };
    status.textContent = messages[state] || "No complete IMERG day available for this reference day. A partial satellite sample is not shown as a daily rainfall total; other comparisons remain possible with lower context confidence.";
    metric.textContent = state === "not-loaded" ? "—" : "Unavailable";
    return;
  }
  metric.textContent = `${fmt(data.value)} mm`;
  status.textContent = `Wettest valid POWER day in the chosen end year: ${data.time}. IMERG estimates ${fmt(data.value)} mm from ${data.sampleCount} half-hour samples; POWER estimates ${fmt(powerRain)} mm for the same UTC day. Different grids and methods can disagree. Neither is a field gauge or forecast.`;
}
