/**
 * Authentification admin : jetons HMAC signés (sans dépendance externe).
 *
 * Identifiants par défaut (surcharge par variables d'environnement) :
 *   ADMIN_USER=admin  ADMIN_PASSWORD=funbike2026
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.JWT_SECRET || "funbike-dev-secret-change-me";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "funbike2026";
const TTL_SECONDS = 12 * 60 * 60; // 12 h

const b64url = (buf) => Buffer.from(buf).toString("base64url");

function sign(payloadB64) {
  return createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export function login(username, password) {
  const okUser = username === ADMIN_USER;
  const okPass = password === ADMIN_PASSWORD;
  if (!okUser || !okPass) {
    throw new Error("Identifiants incorrects.");
  }
  const payload = b64url(
    JSON.stringify({ u: username, exp: Date.now() + TTL_SECONDS * 1000 }),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Extrait le jeton depuis l'en-tête Authorization: Bearer <token>. */
export function authFromHeader(headerValue) {
  if (!headerValue) return null;
  const m = /^Bearer\s+(.+)$/i.exec(headerValue);
  return verifyToken(m ? m[1] : headerValue);
}
