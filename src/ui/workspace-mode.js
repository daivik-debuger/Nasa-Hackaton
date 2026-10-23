export function setupWorkspaceMode() {
  const params = new URLSearchParams(location.search);
  const mode = params.get("workspace") === "judge" ? "judge" : "farmer";
  document.body.dataset.workspace = mode;
  for (const link of document.querySelectorAll("[data-workspace-link]")) {
    if (link.dataset.workspaceLink === mode) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  const researchLink = document.querySelector('[data-tab-link="research"]');
  if (researchLink) researchLink.hidden = mode !== "judge";
  const judgeDemo = document.getElementById("judgeDemo");
  if (judgeDemo) judgeDemo.hidden = mode !== "judge";
  const intro = document.getElementById("workspaceIntro");
  intro.innerHTML = mode === "judge"
    ? "<strong>Judge / evidence view</strong> The farmer workflow is here, plus research, source provenance and limitations. This is a public demonstration—not an administrator account or access to other farmers' records."
    : "<strong>Farmer view</strong> Choose a location, review Earth observations and explore locally scoped rotation questions. <a href='./?workspace=judge#research'>Open the research and source view</a>.";
  if (mode === "farmer" && location.hash === "#research") location.replace(`${location.pathname}${location.search}#top`);
  return mode;
}
