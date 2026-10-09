const routes = new Map([
  ["top", "dashboard"], ["location", "dashboard"], ["climate", "dashboard"],
  ["farm", "plan"], ["strategies-section", "plan"],
  ["crops", "crops"], ["research", "research"]
]);

export function viewForHash(hash) {
  return routes.get(String(hash || "").replace(/^#/, "")) || "dashboard";
}

export function createViewRouter({ onChange = () => {} } = {}) {
  function show() {
    const hash = location.hash.replace(/^#/, "");
    const view = viewForHash(location.hash);
    for (const panel of document.querySelectorAll(".app-view")) panel.hidden = panel.dataset.view !== view;
    for (const link of document.querySelectorAll("[data-tab-link]")) {
      if (link.dataset.tabLink === view) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    requestAnimationFrame(() => {
      onChange(view);
      const target = document.getElementById(hash);
      if (target && !target.closest(".app-view")?.hidden) target.scrollIntoView({ block: "start" });
      else if (hash) window.scrollTo(0, 0);
    });
  }
  window.addEventListener("hashchange", show);
  show();
  return { show };
}
