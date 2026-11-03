/**
 * Serveur backend Funbike — API GraphQL + upload d'images.
 *
 *   GET  /graphql        → GraphiQL (explorateur)
 *   POST /graphql        → API GraphQL (publique en lecture, admin en écriture)
 *   POST /api/upload     → upload d'image (header Authorization: Bearer <token>)
 *   GET  /uploads/<fich> → images uploadées
 *   GET  /health         → sonde de santé
 *
 * Démarrage : npm start  (port 4000, surcharge par PORT)
 */
import { createServer } from "node:http";
import { createYoga } from "graphql-yoga";
import { randomUUID } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, statSync } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { schema } from "./schema.js";
import { seedIfEmpty } from "./db.js";
import { authFromHeader } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, "..", "uploads");
const PORT = Number(process.env.PORT || 4000);

mkdirSync(UPLOAD_DIR, { recursive: true });
seedIfEmpty();

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".avif"]);
const MAX_UPLOAD = 10 * 1024 * 1024; // 10 Mo

const yoga = createYoga({
  schema,
  graphqlEndpoint: "/graphql",
  graphiql: true,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
  context: ({ request }) => ({
    auth: authFromHeader(request.headers.get("authorization")),
  }),
});

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

function handleUpload(req, res) {
  const auth = authFromHeader(req.headers.authorization);
  if (!auth) {
    return sendJson(res, 401, { error: "Authentification requise." });
  }

  const rawName = decodeURIComponent(req.headers["x-file-name"] || `image-${randomUUID()}`);
  const ext = extname(rawName).toLowerCase() || ".png";
  if (!ALLOWED_EXT.has(ext)) {
    return sendJson(res, 400, { error: `Format non autorisé : ${ext}` });
  }
  const safe = rawName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(-60) || "image";

  const filename = `${Date.now()}-${safe.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const target = join(UPLOAD_DIR, filename);

  let size = 0;
  const out = createWriteStream(target);
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_UPLOAD) {
      out.destroy();
      req.destroy();
      sendJson(res, 413, { error: "Fichier trop volumineux (max 10 Mo)." });
    }
  });
  req.pipe(out);
  out.on("finish", () => {
    if (res.writableEnded) return;
    sendJson(res, 200, { url: `/uploads/${filename}` });
  });
  out.on("error", () => {
    if (!res.writableEnded) sendJson(res, 500, { error: "Échec de l'enregistrement." });
  });
}

function handleStatic(req, res, pathname) {
  const rel = normalize(pathname.replace(/^\/uploads\//, ""));
  const file = join(UPLOAD_DIR, rel);
  if (!file.startsWith(UPLOAD_DIR) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Introuvable");
  }
  const types = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
  };
  res.writeHead(200, {
    "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=86400",
  });
  createReadStream(file).pipe(res);
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (pathname === "/health") {
    return sendJson(res, 200, { ok: true, service: "funbike-graphql" });
  }
  if (pathname === "/api/upload" && req.method === "POST") {
    return handleUpload(req, res);
  }
  if (pathname.startsWith("/uploads/")) {
    return handleStatic(req, res, pathname);
  }
  return yoga(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✔ Backend Funbike : http://localhost:${PORT}/graphql (GraphiQL)`);
});
