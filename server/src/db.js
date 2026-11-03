/**
 * Persistance SQLite (node:sqlite — sans dépendance native).
 *
 * Le stockage est volontairement simple : une table `store` avec des
 * collections JSON (settings, home, bikes, parts, brands, categories, dealers).
 * Chaque écriture est transactionnelle et atomique.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "funbike.db");
const SEED_PATH = join(DATA_DIR, "seed.json");

mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS store (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

/** Clés de collections gérées par le backend. */
export const COLLECTIONS = [
  "settings",
  "home",
  "bikes",
  "parts",
  "brands",
  "categories",
  "dealers",
];

export function getCollection(key) {
  const row = db.prepare("SELECT value FROM store WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : null;
}

export function setCollection(key, value) {
  db.prepare(
    `INSERT INTO store (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(key, JSON.stringify(value));
}

/** Insère le seed si la base est vide (premier démarrage). */
export function seedIfEmpty() {
  const row = db.prepare("SELECT COUNT(*) AS n FROM store").get();
  if (row.n > 0) return false;
  if (!existsSync(SEED_PATH)) {
    console.warn("⚠ seed.json introuvable — lancez : npx tsx server/scripts/build-seed.ts");
    return false;
  }
  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  for (const key of COLLECTIONS) {
    if (seed[key] !== undefined) setCollection(key, seed[key]);
  }
  console.log("✔ Base initialisée depuis seed.json");
  return true;
}
