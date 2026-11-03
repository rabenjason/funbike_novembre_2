/**
 * Authentification admin : jetons JWT (jsonwebtoken) + mots de passe hachés (bcryptjs).
 *
 * Le compte initial est créé au premier démarrage depuis les variables
 * INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD du fichier .env.
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { getStore } from "./db.js";

export function signToken(email) {
  return jwt.sign({ email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

/** Extrait et vérifie le jeton : Authorization: Bearer <token>. */
export function authFromHeader(headerValue) {
  if (!headerValue) return null;
  const m = /^Bearer\s+(.+)$/i.exec(headerValue);
  return verifyToken(m ? m[1] : headerValue);
}

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/** Connexion par e-mail + mot de passe → jeton JWT. */
export async function login(email, password) {
  const user = await getStore().getUserByEmail(email);
  if (!user) throw new Error("Identifiants incorrects.");
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new Error("Identifiants incorrects.");
  return signToken(user.email);
}

/** Crée le compte administrateur initial si aucun utilisateur n'existe. */
export async function ensureInitialAdmin() {
  const store = getStore();
  if ((await store.countUsers()) > 0) return;
  const hash = await hashPassword(config.adminPassword);
  await store.createUser(config.adminEmail, hash);
  console.log(`✔ Compte administrateur créé : ${config.adminEmail}`);
}

/** Change le mot de passe de l'utilisateur connecté (vérifie l'ancien). */
export async function changePassword(email, currentPassword, newPassword) {
  const store = getStore();
  const user = await store.getUserByEmail(email);
  if (!user) throw new Error("Compte introuvable.");
  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) throw new Error("Mot de passe actuel incorrect.");
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Le nouveau mot de passe doit faire au moins 8 caractères.");
  }
  const hash = await hashPassword(newPassword);
  await store.updateUserPassword(email, hash);
  return true;
}
