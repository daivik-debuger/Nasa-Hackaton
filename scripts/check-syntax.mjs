import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const paths = ["server.js", "sw.js"];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile() && /\.(?:m?js)$/.test(entry.name)) paths.push(path);
  }
}

for (const directory of ["src", "scripts", "tests"]) await collect(directory);

for (const path of paths.sort()) {
  const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || `Syntax check failed: ${path}\n`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log(`Syntax check passed: ${paths.length} JavaScript files.`);
