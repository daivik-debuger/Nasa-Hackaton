const $ = (id) => document.getElementById(id);

async function api(path, options = {}) {
  const response = await fetch(`/api/account/${path}`, { credentials: "same-origin", ...options, headers: options.body ? { "Content-Type": "application/json" } : undefined });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || "The account service is unavailable.");
  return value;
}

export function setupFarmerAccountUi({ snapshot, restore }) {
  let farms = [];
  let currentId = null;
  let signedIn = false;
  const status = (message) => { $("farmSaveStatus").textContent = message; };
  function render() {
    const select = $("savedFarmSelect");
    const selected = select.value || currentId;
    select.replaceChildren(new Option(farms.length ? "Choose a saved farm" : "No saved farms", ""));
    for (const farm of farms) select.add(new Option(`${farm.name} · ${new Date(farm.updatedAt).toLocaleDateString()}`, farm.id));
    if (selected && farms.some((farm) => farm.id === selected)) select.value = selected;
    select.disabled = !signedIn || !farms.length;
    $("saveFarm").disabled = !signedIn;
    $("saveFarm").textContent = currentId ? "Update saved farm" : "Save current farm";
    $("newFarm").disabled = !signedIn || !currentId;
    $("loadFarm").disabled = !signedIn || !select.value;
    $("deleteFarm").disabled = !signedIn || !select.value;
  }
  async function refresh() {
    try {
      const session = await api("me");
      signedIn = true;
      $("accountGreeting").textContent = `${session.user.name}, you have ${farms.length} saved ${farms.length === 1 ? "farm" : "farms"} on this computer. NASA observations are requested live, not stored with the record.`;
      farms = (await api("farms")).farms;
      $("accountGreeting").textContent = `${session.user.name}, you have ${farms.length} saved ${farms.length === 1 ? "farm" : "farms"} on this computer. NASA observations are requested live, not stored with the record.`;
      status("Select a saved farm to open it, or save the field currently on this page.");
    } catch {
      signedIn = false; farms = []; currentId = null;
      $("accountGreeting").innerHTML = 'Sign in to save field notes on this computer. <a href="./account.html">Open account page</a>. Live NASA data must be loaded again for each visit.';
      status("No account is signed in. Fields you type now are not saved automatically.");
    }
    render();
  }
  $("savedFarmSelect").addEventListener("change", () => {
    if ($("savedFarmSelect").value !== currentId) currentId = null;
    render();
    status("Open the selected farm to edit it. Save current farm creates a new record until a farm is opened.");
  });
  $("newFarm").addEventListener("click", () => {
    currentId = null;
    $("savedFarmSelect").value = "";
    render();
    status("This field is ready to save as a separate new record. The previously saved farm is unchanged.");
  });
  $("saveFarm").addEventListener("click", async () => {
    try {
      status("Saving this farm…");
      const value = snapshot();
      const result = await api("farms", { method: "POST", body: JSON.stringify({ ...value, id: currentId }) });
      currentId = result.farm.id;
      farms = (await api("farms")).farms;
      render();
      status(`Saved ${result.farm.name} on this computer. NASA values were not saved.`);
      $("accountGreeting").textContent = `${farms.length} saved ${farms.length === 1 ? "farm" : "farms"} in your private local account.`;
    } catch (error) { status(`Not saved: ${error.message}`); }
  });
  $("loadFarm").addEventListener("click", () => {
    const farm = farms.find((item) => item.id === $("savedFarmSelect").value);
    if (!farm) return;
    currentId = farm.id;
    restore(farm);
    status(`Opened ${farm.name}. Load NASA observations again for this location and period.`);
  });
  $("deleteFarm").addEventListener("click", async () => {
    const farm = farms.find((item) => item.id === $("savedFarmSelect").value);
    if (!farm || !window.confirm(`Permanently delete saved farm “${farm.name}” from this local account?`)) return;
    try {
      await api(`farms/${farm.id}`, { method: "DELETE" });
      if (currentId === farm.id) currentId = null;
      farms = (await api("farms")).farms;
      render();
      status(`Deleted ${farm.name}. This does not clear fields already open on the page.`);
    } catch (error) { status(`Could not delete: ${error.message}`); }
  });
  refresh();
}
