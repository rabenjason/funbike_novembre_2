/**
 * Configuration du backend — lit le fichier `.env` à la racine du projet
 * (variables d'environnement prioritaires).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseEnvFile(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

// .env à la racine du projet, puis éventuellement server/.env (prioritaire).
const env = {
  ...parseEnvFile(resolve(__dirname, "..", "..", ".env")),
  ...parseEnvFile(resolve(__dirname, "..", ".env")),
  ...process.env,
};

export const config = {
  /** Chaîne de connexion MySQL — mysql://user:pass@hôte:port/base */
  databaseUrl: env.DATABASE_URL || "mysql://funbike_user:FunbikeLocal2026@127.0.0.1:3306/funbike",
  /** Port d'écoute de l'API GraphQL */
  apiPort: Number(env.API_PORT || 4000),
  /** Cible du proxy Vite (utilisé aussi par vite.config.ts) */
  apiProxyTarget: env.API_PROXY_TARGET || "http://127.0.0.1:4000",
  /** Signature des jetons admin */
  jwtSecret: env.JWT_SECRET || "funbike_local_secret_key_2026_change_this_before_production",
  jwtExpiresIn: env.JWT_EXPIRES_IN || "8h",
  /** Compte administrateur créé au premier démarrage */
  adminEmail: env.INITIAL_ADMIN_EMAIL || "admin@funbike.local",
  adminPassword: env.INITIAL_ADMIN_PASSWORD || "tojosoa1998.",
  /** Forcer le stockage local (sans MySQL) — utile pour le dev hors-ligne */
  forceSqlite: env.FORCE_SQLITE === "1" || env.FORCE_SQLITE === "true",
};

/** Analyse mysql://user:pass@host:port/database → objet de connexion mysql2. */
export function parseDatabaseUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username || "root"),
    password: decodeURIComponent(u.password || ""),
    database: u.pathname.replace(/^\//, "") || undefined,
    charset: "utf8mb4",
    connectTimeout: 4000,
  };
}
