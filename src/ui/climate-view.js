const fmt = (value, digits = 1) => Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: digits }) : "—";

function observation(raw, fillValue) {
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value !== fillValue ? value : null;
}

export function buildMonthlySeries(series, keys, fillValue, mode) {
  const bins = new Map();
  for (const day of keys) {
    const value = observation(series?.[day], fillValue);
    if (value === null) continue;
    const key = day.slice(0, 6);
    const bin = bins.get(key) || { key, sum: 0, count: 0 };
    bin.sum += value;
    bin.count++;
    bins.set(key, bin);
  }
  return [...bins.values()].map((bin) => ({ ...bin, value: mode === "mean" ? bin.sum / bin.count : bin.sum }));
}

function lineChart(data) {
  if (!data.length) return '<div class="trend-card"><strong>Temperature trend unavailable</strong><p class="supporting-text">No valid monthly temperature values were returned.</p></div>';
  const values = data.map((item) => item.value);
  const min = Math.min(...values), max = Math.max(...values), span = Math.max(1, max - min);
  const points = data.map((item, index) => `${index * 640 / Math.max(1, data.length - 1)},${132 - (item.value - min) / span * 108}`).join(" ");
  return `<div class="trend-card"><div class="trend-head"><strong>Monthly mean temperature</strong><span>${fmt(min)}–${fmt(max)} °C</span></div><svg class="chart-svg" viewBox="0 0 640 145" role="img" aria-label="Monthly mean air temperature from ${data[0].key} to ${data.at(-1).key}, ranging from ${fmt(min)} to ${fmt(max)} degrees Celsius"><line x1="0" y1="132" x2="640" y2="132" stroke="#dbe1da"/><polyline points="${points}" fill="none" stroke="#b96727" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg><div class="trend-scale"><span>${data[0].key}</span><span>${data.at(-1).key}</span></div></div>`;
}

function barChart(data) {
  if (!data.length) return '<div class="trend-card"><strong>Rainfall trend unavailable</strong><p class="supporting-text">No valid monthly precipitation values were returned.</p></div>';
  const max = Math.max(1, ...data.map((item) => item.value));
  const width = 640 / data.length;
  const bars = data.map((item, index) => {
    const height = Math.max(0, item.value) / max * 108;
    return `<rect x="${index * width}" y="${132 - height}" width="${Math.max(1, width * .72)}" height="${height}" rx="1" fill="#527f91" opacity=".82"/>`;
  }).join("");
  return `<div class="trend-card"><div class="trend-head"><strong>Monthly rainfall sum</strong><span>0–${fmt(max, 0)} mm</span></div><svg class="chart-svg" viewBox="0 0 640 145" role="img" aria-label="Monthly summed corrected precipitation from ${data[0].key} to ${data.at(-1).key}, with a maximum month of ${fmt(max, 0)} millimeters"><line x1="0" y1="132" x2="640" y2="132" stroke="#dbe1da"/>${bars}</svg><div class="trend-scale"><span>${data[0].key}</span><span>${data.at(-1).key}</span></div></div>`;
}

export function renderClimate(summary) {
  if (!summary) {
    document.getElementById("climateMetrics").innerHTML = '<div class="metric"><span class="metric-label">MEAN AIR TEMPERATURE</span><strong>—</strong><span class="metric-unit">°C · valid daily means</span></div><div class="metric"><span class="metric-label">PERIOD RAINFALL SUM</span><strong>—</strong><span class="metric-unit">mm · valid days only</span></div><div class="metric"><span class="metric-label">HOT DAYS IN PERIOD</span><strong>—</strong><span class="metric-unit">days · max ≥ 30°C</span></div>';
    document.getElementById("periodBadge").textContent = "Waiting for data";
    document.getElementById("climateSubhead").textContent = "Load NASA POWER data to populate this view.";
    document.getElementById("requestedPoint").textContent = "Not loaded";
    document.getElementById("requestedPeriod").textContent = "Not loaded";
    const chart = document.getElementById("chart");
    chart.className = "chart-empty";
    chart.textContent = "Temperature and rainfall trends will appear after data loads.";
    return;
  }

  document.getElementById("climateMetrics").innerHTML = `<div class="metric"><span class="metric-label">MEAN AIR TEMPERATURE</span><strong>${fmt(summary.mean)}°</strong><span class="metric-unit">${summary.temperatureUnit} · ${summary.count.toLocaleString()} valid days</span></div><div class="metric"><span class="metric-label">PERIOD RAINFALL SUM</span><strong>${fmt(summary.totalRain, 0)}</strong><span class="metric-unit">mm · ${summary.rainfallCount.toLocaleString()} valid days</span></div><div class="metric"><span class="metric-label">HOT DAYS IN PERIOD</span><strong>${summary.hotDays.toLocaleString()}</strong><span class="metric-unit">max ≥ 30°C · ${summary.maxTemperatureCount.toLocaleString()} valid days</span></div>`;
  document.getElementById("periodBadge").textContent = `${summary.start}–${summary.end}`;
  document.getElementById("climateSubhead").textContent = `NASA POWER daily data · ${summary.start} to ${summary.end} · ${summary.lat.toFixed(3)}, ${summary.lon.toFixed(3)}.`;
  document.getElementById("requestedPoint").textContent = `${summary.lat.toFixed(4)}, ${summary.lon.toFixed(4)}`;
  document.getElementById("requestedPeriod").textContent = `${summary.start}–${summary.end} · temperature ${summary.count.toLocaleString()} days · rainfall ${summary.rainfallCount.toLocaleString()} days`;

  const temperature = buildMonthlySeries(summary.params.T2M, summary.keys, summary.fillValue, "mean");
  const rainfall = buildMonthlySeries(summary.params.PRECTOTCORR, summary.keys, summary.fillValue, "sum");
  const chart = document.getElementById("chart");
  chart.className = "trend-grid";
  chart.innerHTML = `${lineChart(temperature)}${barChart(rainfall)}<p class="chart-note">Each plot uses its own labeled scale. Temperature months use valid T2M days; rainfall months use valid PRECTOTCORR days, so one variable’s missing values do not remove valid observations from the other.</p>`;
}

export function renderImerg(data, referenceDay, powerRain, state = "result") {
  const status = document.getElementById("imergStatus"), metric = document.getElementById("imergMetric");
  if (!data) {
    const messages = {
      "not-loaded": "Load data to compare IMERG with NASA POWER on the wettest valid day in your selected end year. This is historical context, not a forecast.",
      "power-unavailable": "IMERG cross-check was not attempted because valid NASA POWER context was unavailable.",
      "no-reference": "IMERG cross-check was not attempted because the selected end year had no valid POWER precipitation day."
    };
    status.textContent = messages[state] || "No complete IMERG day is available for this reference day. A partial satellite sample is not shown as a daily rainfall total; other comparisons remain possible with lower context confidence.";
    metric.textContent = state === "not-loaded" ? "—" : "Unavailable";
    return;
  }
  metric.textContent = `${fmt(data.value)} mm`;
  status.textContent = `Wettest valid POWER day in the chosen end year: ${data.time}. IMERG estimates ${fmt(data.value)} mm from ${data.sampleCount} half-hour samples; POWER estimates ${fmt(powerRain)} mm for the same UTC day. Different grids and methods can disagree. Neither is a field gauge or forecast.`;
}
