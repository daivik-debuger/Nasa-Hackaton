const number = (value, digits = 0) => Number.isFinite(value)
  ? value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })
  : "—";

export function climateCoverage(power) {
  if (!power) return null;
  const days = (Date.UTC(power.end + 1, 0, 1) - Date.UTC(power.start, 0, 1)) / 86_400_000;
  if (!Number.isFinite(days) || days <= 0) return null;
  return { days, percent: Math.max(0, Math.min(100, Math.round(Math.min(power.count, power.rainfallCount) / days * 100))) };
}

export function renderOverview({ power = null, point = null, fieldName = "" } = {}) {
  const $ = (id) => document.getElementById(id);

  const name = fieldName.trim();
  const validPoint = Number.isFinite(point?.lat) && Number.isFinite(point?.lon) && Math.abs(point.lat) <= 90 && Math.abs(point.lon) <= 180;
  $("overviewPlace").textContent = validPoint
    ? `${name ? `${name} · ` : ""}${point.lat.toFixed(3)}, ${point.lon.toFixed(3)}`
    : "No location selected";

  const coverage = climateCoverage(power);
  $("overviewTempDays").textContent = power ? number(power.count) : "—";
  $("overviewRainDays").textContent = power ? number(power.rainfallCount) : "—";
  $("overviewRequestedDays").textContent = coverage ? number(coverage.days) : "—";
  $("overviewCoverage").textContent = coverage ? `${coverage.percent}%` : "—";
  $("overviewCoverageLabel").textContent = coverage ? "valid-day coverage" : "Load data to check";
  $("overviewRing").style.setProperty("--coverage", `${coverage?.percent ?? 0}%`);
  $("overviewRing").setAttribute("aria-label", coverage
    ? `Minimum of temperature and rainfall valid-day coverage: ${coverage.percent} percent of ${coverage.days} requested days.`
    : "Climate data coverage unavailable until NASA data is loaded.");
}
