import http from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequestHandler } from "./src/api/http-handler.js";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const region = JSON.parse(await readFile(new URL("./data/regions/central-iowa.json", import.meta.url), "utf8"));
const port = Number(process.env.PORT ?? 8000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("PORT must be an integer from 0 to 65535.");
const host = process.env.HOST === "0.0.0.0" ? "0.0.0.0" : "127.0.0.1";

http.createServer(createRequestHandler({ root, region })).listen(port, host, function () {
  console.log(`FieldShift running at http://${host}:${this.address().port}`);
});
