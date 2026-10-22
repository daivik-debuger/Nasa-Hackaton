import { demoLocation } from "../global-demo-locations.js";

export const PUBLIC_QUESTIONS = Object.freeze({
  water: "What does the rainfall record show?",
  heat: "How often were days hot?",
  soil: "What can space data not tell us about soil?"
});

export function parsePublicExampleLink(href, lastFullYear) {
  const url = new URL(href);
  const id = url.searchParams.get("example");
  const start = Number(url.searchParams.get("start"));
  const end = Number(url.searchParams.get("end"));
  const question = url.searchParams.get("question");
  if (!demoLocation(id) || !Object.hasOwn(PUBLIC_QUESTIONS, question)) return null;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1981 || end > lastFullYear || start > end) return null;
  return { id, start, end, question };
}

export function buildPublicExampleLink(href, { id, start, end, question }, lastFullYear) {
  const url = new URL(href);
  const record = parsePublicExampleLink(new URL(`?example=${encodeURIComponent(id)}&start=${start}&end=${end}&question=${encodeURIComponent(question)}`, url).href, lastFullYear);
  if (!record) throw new Error("Choose a public example, valid years and a question before sharing.");
  url.search = "";
  url.searchParams.set("example", record.id);
  url.searchParams.set("start", String(record.start));
  url.searchParams.set("end", String(record.end));
  url.searchParams.set("question", record.question);
  url.hash = "#top";
  return url.href;
}

export function conversationEvidence(power, question) {
  if (!power) return "Load NASA POWER history to put this question beside real observations. A map pin alone cannot answer it.";
  const period = power.start === power.end ? String(power.start) : `${power.start}–${power.end}`;
  if (question === "heat") return `${power.hotDays.toLocaleString("en-US")} days reached at least 30°C maximum air temperature among ${power.maxTemperatureCount.toLocaleString("en-US")} valid maximum-temperature days in ${period}. This is a general indicator, not a crop-specific stress threshold.`;
  if (question === "soil") return `NASA POWER returned ${power.count.toLocaleString("en-US")} valid mean-temperature days in ${period}, but it does not measure field soil organic matter, pH or nutrients. Those need local evidence.`;
  return `${Math.round(power.totalRain).toLocaleString("en-US")} mm of rain summed across ${power.rainfallCount.toLocaleString("en-US")} valid daily readings in ${period}. Missing days can understate the sum; this is not effective rainfall at a field.`;
}
