import { access, readFile, readdir } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";

const root = process.cwd();
const checked = new Set();

async function requireLocal(path, label) {
  const absolute = resolve(root, path);
  if (absolute !== root && !absolute.startsWith(root + sep)) throw new Error(`${label} escapes the project: ${path}`);
  if (absolute !== root) await access(absolute);
  checked.add(path);
}

const html = await readFile("index.html", "utf8");
for (const [, reference] of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) {
  if (/^(?:https?:|#|data:)/.test(reference)) continue;
  await requireLocal(reference.split(/[?#]/)[0], "HTML reference");
}

const worker = await readFile("sw.js", "utf8");
const shell = worker.match(/const APP_SHELL = (\[[^;]+\]);/);
if (!shell) throw new Error("Service worker app-shell list is missing.");
for (const reference of JSON.parse(shell[1])) {
  if (!reference.startsWith("./")) throw new Error(`Unexpected app-shell reference: ${reference}`);
  await requireLocal(reference, "App-shell reference");
}

async function scanModules(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) await scanModules(file);
    else if (entry.isFile() && [".js", ".mjs"].includes(extname(file))) {
      const source = await readFile(file, "utf8");
      for (const [, specifier] of source.matchAll(/\bfrom\s+["'](\.[^"']+)["']/g)) {
        const target = resolve(dirname(file), specifier);
        if (!target.startsWith(root + sep)) throw new Error(`Import escapes the project: ${specifier}`);
        await access(target);
        checked.add(target);
      }
    }
  }
}

await scanModules(resolve(root, "src"));
console.log(`Asset/import check passed: ${checked.size} local references.`);
