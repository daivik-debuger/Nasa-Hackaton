const key = "terrasown-theme";
function theme() {
  try { return localStorage.getItem(key) === "dark" ? "dark" : "light"; }
  catch { return "light"; }
}
function apply(value) {
  document.documentElement.dataset.theme = value;
  const button = document.getElementById("themeToggle");
  if (button) {
    button.textContent = value === "dark" ? "Day mode" : "Night mode";
    button.setAttribute("aria-label", `Switch to ${value === "dark" ? "day" : "night"} mode`);
    button.setAttribute("aria-pressed", String(value === "dark"));
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", value === "dark" ? "#16231d" : "#e5e9dc");
}
apply(theme());
document.getElementById("themeToggle")?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try { localStorage.setItem(key, next); } catch { /* Theme still changes for this page. */ }
  apply(next);
});
