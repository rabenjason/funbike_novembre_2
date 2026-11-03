/**
 * Ré-initialise la base (MySQL ou SQLite) depuis server/data/seed.json.
 * Usage : npm run seed  (dans server/)
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { initStore, getStore } from "../src/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(__dirname, "..", "data", "seed.json"), "utf8"));

await initStore(seed);
await getStore().resetFromSeed(seed);
console.log("✔ Base ré-initialisée depuis seed.json");
await getStore().close();
