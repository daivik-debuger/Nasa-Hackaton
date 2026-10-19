import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../workspace.css", import.meta.url), "utf8");
const tokens = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/g)].map((match) => [match[1], match[2]]));
function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function ratio(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => a - b);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

test("authored text palette meets 7:1 on every supported light surface", () => {
  for (const text of ["ink", "muted", "accent", "green", "warning", "critical"]) {
    for (const surface of ["paper", "surface", "surface-soft", "warning-bg"]) {
      assert.ok(tokens[text] && tokens[surface], `Missing token: ${text}/${surface}`);
      assert.ok(ratio(tokens[text], tokens[surface]) >= 7, `${text} on ${surface}: ${ratio(tokens[text], tokens[surface]).toFixed(2)}:1`);
    }
  }
});

test("control boundaries and focus indicators have at least 3:1 surface contrast", () => {
  for (const surface of ["paper", "surface", "surface-soft", "warning-bg"]) {
    assert.ok(ratio(tokens["line-strong"], tokens[surface]) >= 3);
    assert.ok(ratio(tokens.accent, tokens[surface]) >= 3);
  }
});

test("dark navigation and crop header text meet 7:1 contrast", () => {
  for (const surface of ["nav", "nav-hover"]) {
    assert.ok(ratio(tokens["nav-text"], tokens[surface]) >= 7);
  }
});

test("TerraSown presents the current workspace with local editorial type and an adaptive notebook index", async () => {
  const theme = await readFile(new URL("../terrasown.css", import.meta.url), "utf8");
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(theme, /font-family: 'Newsreader'/);
  assert.match(theme, /font-family: 'Plus Jakarta Sans'/);
  assert.match(theme, /\.app-header \{ position: fixed/);
  assert.match(theme, /@media \(max-width: 1120px\)/);
  assert.match(html, /<link rel="stylesheet" href="terrasown.css">/);
});
