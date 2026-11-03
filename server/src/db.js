/**
 * Couche de stockage — choisit le driver :
 *   1. MySQL (DATABASE_URL) par défaut — tables réelles, phpMyAdmin ;
 *   2. SQLite local en repli si MySQL est injoignable (dev hors-ligne),
 *      avec un avertissement explicite dans les logs.
 *
 * API partagée : getCollection / setCollection / seedIfEmpty /
 * resetFromSeed / getUserByEmail / createUser / updateUserPassword / countUsers.
 */
import { config } from "./config.js";
import { createMysqlStore } from "./db-mysql.js";
import { createSqliteStore } from "./db-sqlite.js";

let store = null;

export async function initStore(seed) {
  if (config.forceSqlite) {
    store = createSqliteStore();
    console.log("⚠ FORCE_SQLITE=1 — stockage local SQLite (le MySQL de DATABASE_URL est ignoré).");
  } else {
    try {
      store = await createMysqlStore();
      console.log(`✔ Base MySQL connectée (${config.databaseUrl.replace(/:[^:@]*@/, ":***@")})`);
    } catch (e) {
      store = createSqliteStore();
      console.warn("⚠ MySQL injoignable — bascule sur SQLite local pour le dev.");
      console.warn(`  → ${e.message}`);
      console.warn("  → Démarre MySQL (XAMPP/WAMP/docker) ou corrige DATABASE_URL dans .env.");
    }
  }

  const seeded = await store.seedIfEmpty(seed);
  if (seeded) console.log("✔ Base initialisée depuis seed.json");
  return store;
}

export function getStore() {
  if (!store) throw new Error("initStore() doit être appelé avant toute lecture.");
  return store;
}

/* Raccourcis utilisés par les resolvers GraphQL (asynchrones). */
export const getCollection = (key) => getStore().getCollection(key);
export const setCollection = (key, value) => getStore().setCollection(key, value);
