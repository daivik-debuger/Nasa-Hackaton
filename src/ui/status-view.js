export function setStatus(element, message, kind = "") {
  element.className = `status ${kind}`.trim();
  element.textContent = message;
}
