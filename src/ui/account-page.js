const $ = (id) => document.getElementById(id);
let mode = "login";
function show(modeValue) {
  mode = modeValue;
  const register = mode === "register";
  $("nameField").hidden = !register;
  $("accountName").required = register;
  $("accountPassword").autocomplete = register ? "new-password" : "current-password";
  $("accountTitle").textContent = register ? "Create a local account" : "Sign in";
  $("accountSubmit").textContent = register ? "Create account" : "Sign in";
  $("showLogin").setAttribute("aria-pressed", String(!register));
  $("showRegister").setAttribute("aria-pressed", String(register));
  $("accountStatus").textContent = "";
}
function signedIn(user) {
  $("accountForm").hidden = Boolean(user);
  $("showLogin").parentElement.hidden = Boolean(user);
  $("signedIn").hidden = !user;
  $("accountTitle").textContent = user ? "Welcome back" : "Sign in";
  $("signedInName").textContent = user ? `${user.name} · ${user.email}` : "";
  $("accountPassword").value = "";
}
async function request(path, body) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Account request failed.");
  return result;
}
$("showLogin").addEventListener("click", () => show("login"));
$("showRegister").addEventListener("click", () => show("register"));
$("accountForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("accountSubmit").disabled = true;
  $("accountStatus").textContent = mode === "register" ? "Creating your local account…" : "Signing in…";
  try {
    const path = mode === "register" ? "/api/account/register" : "/api/account/login";
    const result = await request(path, { name: $("accountName").value, email: $("accountEmail").value, password: $("accountPassword").value });
    signedIn(result.user);
    $("accountStatus").textContent = "Signed in. Your saved farms are available in Farmer view.";
  } catch (error) { $("accountStatus").textContent = error.message; }
  finally { $("accountSubmit").disabled = false; }
});
$("logoutButton").addEventListener("click", async () => {
  try { await request("/api/account/logout", {}); signedIn(null); show("login"); $("accountStatus").textContent = "Signed out."; }
  catch (error) { $("accountStatus").textContent = error.message; }
});
fetch("/api/account/me", { credentials: "same-origin" }).then(async (response) => {
  if (response.ok) signedIn((await response.json()).user);
}).catch(() => { $("accountStatus").textContent = "Account service unavailable. Start the app with npm start."; });
