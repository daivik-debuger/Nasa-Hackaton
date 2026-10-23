import { demoLocation } from "../global-demo-locations.js";
import { climateCoverage } from "./overview-view.js";

export function describeJudgeObservation(power) {
  if (!power) return "No NASA observation loaded yet. The dashboard will show valid-day coverage, units, period, and source.";
  const coverage = climateCoverage(power);
  if (!coverage) return "NASA data loaded, but its calendar-day coverage could not be established. Check the source panel below.";
  const period = power.start === power.end ? String(power.start) : `${power.start}–${power.end}`;
  return `NASA POWER ${period}: ${power.count} valid mean-temperature days and ${power.rainfallCount} valid rainfall days of ${coverage.days} requested. Minimum coverage ${coverage.percent}%. Grid history, not a field sensor or forecast.`;
}

export function setupJudgeDemo() {
  const panel = document.getElementById("judgeDemo");
  if (!panel || document.body.dataset.workspace !== "judge") return;
  const $ = (id) => document.getElementById(id);
  const status = $("judgeDemoStatus");
  const dataReadout = $("judgeDataReadout");
  const scopeReadout = $("judgeScopeReadout");
  window.addEventListener("fieldshift:context", (event) => {
    dataReadout.textContent = describeJudgeObservation(event.detail?.power);
    if (event.detail?.power) status.textContent = "NASA POWER loaded. Inspect the coverage ring, history and source record below; IMERG may remain unavailable if its day is incomplete.";
  });
  window.addEventListener("fieldshift:load-complete", (event) => {
    status.textContent = event.detail?.powerLoaded
      ? "NASA POWER loaded. Inspect the coverage ring, history and source record below; any partial-source warning remains visible in Climate."
      : `NASA POWER was not loaded. ${event.detail?.status || "Check the Climate status below, then retry."}`;
  });
  for (const button of panel.querySelectorAll("[data-judge-example]")) button.addEventListener("click", () => {
    const example = demoLocation(button.dataset.judgeExample);
    if (!example) return;
    $("startYear").value = "2025";
    $("endYear").value = "2025";
    $("demoLocation").value = example.id;
    $("demoLocation").dispatchEvent(new Event("change"));
    $("conversationQuestion").value = example.id === "iowa" ? "soil" : "heat";
    $("conversationQuestion").dispatchEvent(new Event("change"));
    scopeReadout.textContent = example.id === "iowa"
      ? "Central Iowa is the only area with a requestable mapped-soil layer and research-only rotation catalog. SSURGO components are uncertain, not a lab test."
      : "Brazil receives global NASA climate context only. Iowa mapped soil and crop rules are deliberately withheld; local soil and crop validation remain needed.";
    dataReadout.textContent = describeJudgeObservation(null);
    status.textContent = `Requesting 2025 observations for the public ${example.label} point. No private farm coordinates or notes are sent.`;
    $("loadClimate").click();
  });
}
