/**
 * Driver SQLite de repli (node:sqlite) — utilisé uniquement quand le
 * serveur MySQL de DATABASE_URL est injoignable (dev hors-ligne).
 *
 * Stockage simple : une table `store` avec des collections JSON.
 * Le driver MySQL (db-mysql.js) est la source de production : tables
 * réelles consultables dans phpMyAdmin.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createSqliteStore() {
  const dataDir = join(__dirname, "..", "data");
  mkdirSync(dataDir, { recursive: true });
  const db = new DatabaseSync(join(dataDir, "funbike.db"));

  db.exec(`
    CREATE TABLE IF NOT EXISTS store (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return {
    name: "sqlite (repli local)",

    async getCollection(key) {
      const row = db.prepare("SELECT value FROM store WHERE key = ?").get(key);
      return row ? JSON.parse(row.value) : null;
    },

    async setCollection(key, value) {
      db.prepare(
        `INSERT INTO store (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ).run(key, JSON.stringify(value));
    },

    async seedIfEmpty(seed) {
      const row = db.prepare("SELECT COUNT(*) AS n FROM store").get();
      if (row.n > 0) return false;
      await this.resetFromSeed(seed);
      return true;
    },

    async resetFromSeed(seed) {
      const keys = ["settings", "home", "bikes", "parts", "brands", "categories", "dealers"];
      for (const key of keys) {
        if (seed[key] !== undefined) await this.setCollection(key, seed[key]);
      }
    },

    async getUserByEmail(email) {
      return db.prepare("SELECT * FROM admin_users WHERE email = ?").get(email) ?? null;
    },

    async createUser(email, passwordHash) {
      db.prepare("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)").run(email, passwordHash);
    },

    async updateUserPassword(email, passwordHash) {
      db.prepare("UPDATE admin_users SET password_hash = ? WHERE email = ?").run(passwordHash, email);
    },

    async countUsers() {
      return Number(db.prepare("SELECT COUNT(*) AS n FROM admin_users").get().n);
    },

    async close() {
      db.close();
    },
  };
}
