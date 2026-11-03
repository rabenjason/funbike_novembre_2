/**
 * Ré-initialise la base depuis server/data/seed.json.
 * Usage : npm run seed  (dans server/)
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { db, setCollection, COLLECTIONS, seedIfEmpty } from "../src/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(readFileSync(join(__dirname, "..", "data", "seed.json"), "utf8"));

db.prepare("DELETE FROM store").run();
for (const key of COLLECTIONS) {
  if (seed[key] !== undefined) setCollection(key, seed[key]);
}
console.log("✔ Base ré-initialisée depuis seed.json");
seedIfEmpty();
