/**
 * Driver MySQL (mysql2) — tables réelles, consultables dans phpMyAdmin.
 *
 * Implémente l'API de stockage partagée (getCollection / setCollection)
 * en mappant les collections de l'API GraphQL vers les tables du schéma
 * server/sql/schema.mysql.sql.
 */
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config, parseDatabaseUrl } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

/* ------------------------------------------------------------------ */
/*  Mappings collections ↔ tables                                      */
/* ------------------------------------------------------------------ */

const rowToSlide = (r) => ({
  id: r.id,
  short: r.short_name,
  brand: r.brand,
  tag: r.tag,
  image: r.image_url,
  alt: r.alt_text,
  bikeId: r.bike_id ?? null,
  order: r.sort_order,
  enabled: Boolean(r.enabled),
});

const slideToRow = (s, index) => ({
  id: s.id,
  short_name: s.short ?? "",
  brand: s.brand ?? "",
  tag: s.tag ?? "",
  image_url: s.image ?? "",
  alt_text: s.alt ?? "",
  bike_id: s.bikeId ?? null,
  sort_order: index,
  enabled: s.enabled ? 1 : 0,
});

const rowToArrival = (r) => ({
  id: r.id,
  badge: r.badge,
  surTitre: r.sur_titre,
  titre: r.titre,
  description: r.description ?? "",
  alt: r.alt_text ?? "",
  points: parseJson(r.points, []),
  prix: r.prix,
  productId: r.product_id ?? null,
  image: r.image_url,
  order: r.sort_order,
});

const arrivalToRow = (n, index) => ({
  id: n.id,
  badge: n.badge ?? "",
  sur_titre: n.surTitre ?? "",
  titre: n.titre ?? "",
  description: n.description ?? "",
  alt_text: n.alt ?? "",
  points: JSON.stringify(n.points ?? []),
  prix: n.prix ?? "",
  product_id: n.productId ?? null,
  image_url: n.image ?? "",
  sort_order: index,
});

const rowToExclusive = (r) => ({
  id: r.id,
  key: r.brand_key,
  name: r.name,
  tagline: r.tagline,
  image: r.image_url,
  order: r.sort_order,
});

const exclusiveToRow = (b, index) => ({
  id: b.id,
  brand_key: b.key ?? "",
  name: b.name ?? "",
  tagline: b.tagline ?? "",
  image_url: b.image ?? "",
  sort_order: index,
});

const rowToBike = (r) => ({
  id: r.id,
  name: r.name,
  brand: r.brand,
  family: r.family,
  price: r.price,
  tag: r.tag ?? null,
  alt: r.alt_text ?? "",
  image: r.image_url,
  gallery: parseJson(r.gallery, []),
  specs: parseJson(r.specs, []),
  desc: r.description ?? "",
  order: r.sort_order,
});

const bikeToRow = (b, index) => ({
  id: b.id,
  name: b.name,
  brand: b.brand,
  family: b.family,
  price: b.price,
  tag: b.tag ?? null,
  alt_text: b.alt ?? "",
  image_url: b.image ?? "",
  gallery: JSON.stringify(b.gallery ?? []),
  specs: JSON.stringify(b.specs ?? []),
  description: b.desc ?? "",
  sort_order: b.order ?? index,
});

const rowToPart = (r) => ({
  id: r.id,
  name: r.name,
  price: r.price,
  image: r.image_url,
  kind: r.kind,
  category: r.category ?? null,
  compatibleBrand: r.compatible_brand ?? null,
  partType: r.part_type ?? null,
  sourceUrl: r.source_url ?? null,
  gallery: parseJson(r.gallery, []),
  desc: r.description ?? null,
  specs: parseJson(r.specs, []),
  order: r.sort_order,
});

const partToRow = (p, index) => ({
  id: p.id,
  name: p.name,
  price: p.price,
  image_url: p.image ?? "",
  kind: p.kind,
  category: p.category ?? null,
  compatible_brand: p.compatibleBrand ?? null,
  part_type: p.partType ?? null,
  source_url: p.sourceUrl ?? null,
  gallery: JSON.stringify(p.gallery ?? []),
  description: p.desc ?? null,
  specs: JSON.stringify(p.specs ?? []),
  sort_order: p.order ?? index,
});

const rowToBrand = (r) => ({ id: r.id, name: r.name, src: r.src, order: r.sort_order });
const brandToRow = (b, index) => ({ id: b.id, name: b.name, src: b.src, sort_order: b.order ?? index });

const rowToCategory = (r) => ({
  id: r.id,
  title: r.title,
  desc: r.description ?? "",
  src: r.image_url,
  to: r.target,
  brand: r.brand ?? null,
  order: r.sort_order,
});

const categoryToRow = (c, index) => ({
  id: c.id,
  title: c.title,
  description: c.desc ?? "",
  image_url: c.src ?? "",
  target: c.to,
  brand: c.brand ?? null,
  sort_order: c.order ?? index,
});

const rowToDealer = (r) => ({
  id: r.id,
  key: r.dealer_key,
  city: r.city,
  name: r.name,
  kind: r.kind,
  address: r.address,
  hours: r.hours,
  phone: r.phone,
  email: r.email,
  desc: r.description ?? "",
  lat: r.lat,
  lon: r.lon,
  services: parseJson(r.services, []),
  order: r.sort_order,
});

const dealerToRow = (d, index) => ({
  id: d.id,
  dealer_key: d.key,
  city: d.city,
  name: d.name,
  kind: d.kind,
  address: d.address,
  hours: d.hours,
  phone: d.phone,
  email: d.email,
  description: d.desc ?? "",
  lat: d.lat,
  lon: d.lon,
  services: JSON.stringify(d.services ?? []),
  sort_order: d.order ?? index,
});

const rowToSettings = (r) => ({
  siteName: r.site_name,
  siteFullName: r.site_full_name,
  logoUrl: r.logo_url,
  logoAlt: r.logo_alt,
  country: r.country,
  city: r.city,
  address: r.address,
  addressFull: r.address_full,
  phoneDisplay: r.phone_display,
  phoneLink: r.phone_link,
  email: r.email,
  hours: r.hours,
  hoursShort: r.hours_short,
});

const settingsToRow = (s) => ({
  id: 1,
  site_name: s.siteName ?? "",
  site_full_name: s.siteFullName ?? "",
  logo_url: s.logoUrl ?? "",
  logo_alt: s.logoAlt ?? "",
  country: s.country ?? "",
  city: s.city ?? "",
  address: s.address ?? "",
  address_full: s.addressFull ?? "",
  phone_display: s.phoneDisplay ?? "",
  phone_link: s.phoneLink ?? "",
  email: s.email ?? "",
  hours: s.hours ?? "",
  hours_short: s.hoursShort ?? "",
});

const rowToHomeContent = (r) => ({
  hero: {
    localisation: r.hero_localisation ?? "",
    titreLigne1: r.hero_titre1 ?? "",
    titreLigne2: r.hero_titre2 ?? "",
    description: r.hero_description ?? "",
    sloganPrefix: r.hero_slogan_prefix ?? "",
    usages: parseJson(r.hero_usages, []),
    boutonCatalogue: r.hero_bouton_catalogue ?? "",
    aLaUne: r.hero_a_la_une ?? "",
    annee: r.hero_annee ?? "",
  },
  univers: { surTitre: r.univers_surtitre ?? "", titre: r.univers_titre ?? "" },
  sherco: {
    surTitre: r.sherco_surtitre ?? "",
    titreLigne1: r.sherco_titre1 ?? "",
    titreLigne2: r.sherco_titre2 ?? "",
    description: r.sherco_description ?? "",
    bouton: r.sherco_bouton ?? "",
    image: r.sherco_image ?? "",
    imageAlt: r.sherco_image_alt ?? "",
  },
  distributeur: {
    surTitre: r.distributeur_surtitre ?? "",
    titre: r.distributeur_titre ?? "",
    boutonToutVoir: r.distributeur_bouton_voir ?? "",
    boutonToutesMotos: r.distributeur_bouton_motos ?? "",
  },
  nouveautes: {
    surTitre: r.nouveautes_surtitre ?? "",
    titre: r.nouveautes_titre ?? "",
    description: r.nouveautes_description ?? "",
    tarif: r.nouveautes_tarif ?? "",
    boutonCatalogue: r.nouveautes_bouton ?? "",
    decouvrirPrefix: r.nouveautes_decouvrir ?? "",
    items: [],
  },
  motos: {
    numero: r.motos_numero ?? "",
    titre: r.motos_titre ?? "",
    description: r.motos_description ?? "",
    bouton: r.motos_bouton ?? "",
  },
  atelier: {
    surTitre: r.atelier_surtitre ?? "",
    titre: r.atelier_titre ?? "",
    description: r.atelier_description ?? "",
    bouton: r.atelier_bouton ?? "",
    productIds: [],
  },
  partenaires: {
    titre: r.partenaires_titre ?? "",
    description: r.partenaires_description ?? "",
  },
  heroSlides: [],
  exclusiveBrands: [],
});

const homeContentToRow = (h) => ({
  id: 1,
  hero_localisation: h.hero?.localisation ?? "",
  hero_titre1: h.hero?.titreLigne1 ?? "",
  hero_titre2: h.hero?.titreLigne2 ?? "",
  hero_description: h.hero?.description ?? "",
  hero_slogan_prefix: h.hero?.sloganPrefix ?? "",
  hero_usages: JSON.stringify(h.hero?.usages ?? []),
  hero_bouton_catalogue: h.hero?.boutonCatalogue ?? "",
  hero_a_la_une: h.hero?.aLaUne ?? "",
  hero_annee: h.hero?.annee ?? "",
  univers_surtitre: h.univers?.surTitre ?? "",
  univers_titre: h.univers?.titre ?? "",
  sherco_surtitre: h.sherco?.surTitre ?? "",
  sherco_titre1: h.sherco?.titreLigne1 ?? "",
  sherco_titre2: h.sherco?.titreLigne2 ?? "",
  sherco_description: h.sherco?.description ?? "",
  sherco_bouton: h.sherco?.bouton ?? "",
  sherco_image: h.sherco?.image ?? "",
  sherco_image_alt: h.sherco?.imageAlt ?? "",
  distributeur_surtitre: h.distributeur?.surTitre ?? "",
  distributeur_titre: h.distributeur?.titre ?? "",
  distributeur_bouton_voir: h.distributeur?.boutonToutVoir ?? "",
  distributeur_bouton_motos: h.distributeur?.boutonToutesMotos ?? "",
  nouveautes_surtitre: h.nouveautes?.surTitre ?? "",
  nouveautes_titre: h.nouveautes?.titre ?? "",
  nouveautes_description: h.nouveautes?.description ?? "",
  nouveautes_tarif: h.nouveautes?.tarif ?? "",
  nouveautes_bouton: h.nouveautes?.boutonCatalogue ?? "",
  nouveautes_decouvrir: h.nouveautes?.decouvrirPrefix ?? "",
  motos_numero: h.motos?.numero ?? "",
  motos_titre: h.motos?.titre ?? "",
  motos_description: h.motos?.description ?? "",
  motos_bouton: h.motos?.bouton ?? "",
  atelier_surtitre: h.atelier?.surTitre ?? "",
  atelier_titre: h.atelier?.titre ?? "",
  atelier_description: h.atelier?.description ?? "",
  atelier_bouton: h.atelier?.bouton ?? "",
  partenaires_titre: h.partenaires?.titre ?? "",
  partenaires_description: h.partenaires?.description ?? "",
});

/* ------------------------------------------------------------------ */
/*  Driver                                                            */
/* ------------------------------------------------------------------ */

export async function createMysqlStore() {
  const pool = mysql.createPool({
    ...parseDatabaseUrl(config.databaseUrl),
    waitForConnections: true,
    connectionLimit: 10,
  });

  // Vérifie la connexion (échec → le store basculera sur SQLite).
  const conn = await pool.getConnection();
  conn.release();

  // Applique le schéma (idempotent).
  const schemaSql = readFileSync(join(__dirname, "..", "sql", "schema.mysql.sql"), "utf8");
  const statements = schemaSql
    .split(/;\s*\n/)
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
  for (const statement of statements) {
    await pool.query(statement);
  }

  async function selectAll(table, orderBy = "sort_order") {
    const [rows] = await pool.query(`SELECT * FROM \`${table}\` ORDER BY ${orderBy}, id`);
    return rows;
  }

  async function replaceAll(table, rows) {
    await pool.query(`DELETE FROM \`${table}\``);
    for (const row of rows) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => "?").join(", ");
      await pool.query(
        `INSERT INTO \`${table}\` (${columns.map((c) => `\`${c}\``).join(", ")}) VALUES (${placeholders})`,
        columns.map((c) => row[c]),
      );
    }
  }

  async function getHome() {
    const [contentRows] = await pool.query("SELECT * FROM `home_content` WHERE id = 1");
    const home = rowToHomeContent(contentRows[0] ?? {});
    home.heroSlides = (await selectAll("hero_slides")).map(rowToSlide);
    home.nouveautes.items = (await selectAll("new_arrivals")).map(rowToArrival);
    home.exclusiveBrands = (await selectAll("exclusive_brands")).map(rowToExclusive);
    home.atelier.productIds = (await selectAll("atelier_products")).map((r) => r.product_id);
    return home;
  }

  async function saveHome(home) {
    const conn2 = await pool.getConnection();
    try {
      await conn2.beginTransaction();
      const row = homeContentToRow(home);
      const columns = Object.keys(row);
      await conn2.query(
        `INSERT INTO \`home_content\` (${columns.map((c) => `\`${c}\``).join(", ")})
         VALUES (${columns.map(() => "?").join(", ")})
         ON DUPLICATE KEY UPDATE ${columns.filter((c) => c !== "id").map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(", ")}`,
        columns.map((c) => row[c]),
      );
      await conn2.query("DELETE FROM `hero_slides`");
      for (const [i, s] of (home.heroSlides ?? []).entries()) {
        const r = slideToRow(s, i);
        await conn2.query(
          "INSERT INTO `hero_slides` (`id`,`short_name`,`brand`,`tag`,`image_url`,`alt_text`,`bike_id`,`sort_order`,`enabled`) VALUES (?,?,?,?,?,?,?,?,?)",
          [r.id, r.short_name, r.brand, r.tag, r.image_url, r.alt_text, r.bike_id, r.sort_order, r.enabled],
        );
      }
      await conn2.query("DELETE FROM `new_arrivals`");
      for (const [i, n] of (home.nouveautes?.items ?? []).entries()) {
        const r = arrivalToRow(n, i);
        await conn2.query(
          "INSERT INTO `new_arrivals` (`id`,`badge`,`sur_titre`,`titre`,`description`,`alt_text`,`points`,`prix`,`product_id`,`image_url`,`sort_order`) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          [r.id, r.badge, r.sur_titre, r.titre, r.description, r.alt_text, r.points, r.prix, r.product_id, r.image_url, r.sort_order],
        );
      }
      await conn2.query("DELETE FROM `exclusive_brands`");
      for (const [i, b] of (home.exclusiveBrands ?? []).entries()) {
        const r = exclusiveToRow(b, i);
        await conn2.query(
          "INSERT INTO `exclusive_brands` (`id`,`brand_key`,`name`,`tagline`,`image_url`,`sort_order`) VALUES (?,?,?,?,?,?)",
          [r.id, r.brand_key, r.name, r.tagline, r.image_url, r.sort_order],
        );
      }
      await conn2.query("DELETE FROM `atelier_products`");
      for (const [i, pid] of (home.atelier?.productIds ?? []).entries()) {
        await conn2.query("INSERT INTO `atelier_products` (`product_id`,`sort_order`) VALUES (?,?)", [pid, i]);
      }
      await conn2.commit();
    } catch (e) {
      await conn2.rollback();
      throw e;
    } finally {
      conn2.release();
    }
    return getHome();
  }

  /* ---------------- API de stockage partagée ---------------- */

  return {
    name: "mysql",

    async getCollection(key) {
      switch (key) {
        case "settings": {
          const [rows] = await pool.query("SELECT * FROM `settings` WHERE id = 1");
          return rows[0] ? rowToSettings(rows[0]) : null;
        }
        case "home":
          return getHome();
        case "bikes":
          return (await selectAll("bikes")).map(rowToBike);
        case "parts":
          return (await selectAll("parts")).map(rowToPart);
        case "brands":
          return (await selectAll("brands")).map(rowToBrand);
        case "categories":
          return (await selectAll("categories")).map(rowToCategory);
        case "dealers":
          return (await selectAll("dealers")).map(rowToDealer);
        default:
          return null;
      }
    },

    async setCollection(key, value) {
      switch (key) {
        case "settings": {
          const row = settingsToRow(value);
          const columns = Object.keys(row);
          await pool.query(
            `INSERT INTO \`settings\` (${columns.map((c) => `\`${c}\``).join(", ")})
             VALUES (${columns.map(() => "?").join(", ")})
             ON DUPLICATE KEY UPDATE ${columns.filter((c) => c !== "id").map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(", ")}`,
            columns.map((c) => row[c]),
          );
          return;
        }
        case "home":
          await saveHome(value);
          return;
        case "bikes":
          await replaceAll("bikes", (value ?? []).map(bikeToRow));
          return;
        case "parts":
          await replaceAll("parts", (value ?? []).map(partToRow));
          return;
        case "brands":
          await replaceAll("brands", (value ?? []).map(brandToRow));
          return;
        case "categories":
          await replaceAll("categories", (value ?? []).map(categoryToRow));
          return;
        case "dealers":
          await replaceAll("dealers", (value ?? []).map(dealerToRow));
          return;
        default:
          return;
      }
    },

    /** Insère le seed si la base est vide. */
    async seedIfEmpty(seed) {
      const [rows] = await pool.query("SELECT COUNT(*) AS n FROM `settings`");
      if (Number(rows[0].n) > 0) return false;
      await this.resetFromSeed(seed);
      return true;
    },

    /** Ré-initialise toutes les collections depuis le seed. */
    async resetFromSeed(seed) {
      for (const key of ["settings", "home", "bikes", "parts", "brands", "categories", "dealers"]) {
        if (seed[key] !== undefined) await this.setCollection(key, seed[key]);
      }
    },

    /* ---------------- Utilisateurs admin ---------------- */

    async getUserByEmail(email) {
      const [rows] = await pool.query("SELECT * FROM `admin_users` WHERE email = ?", [email]);
      return rows[0] ?? null;
    },

    async createUser(email, passwordHash) {
      await pool.query("INSERT INTO `admin_users` (`email`, `password_hash`) VALUES (?, ?)", [
        email,
        passwordHash,
      ]);
    },

    async updateUserPassword(email, passwordHash) {
      await pool.query("UPDATE `admin_users` SET `password_hash` = ? WHERE `email` = ?", [
        passwordHash,
        email,
      ]);
    },

    async countUsers() {
      const [rows] = await pool.query("SELECT COUNT(*) AS n FROM `admin_users`");
      return Number(rows[0].n);
    },

    async close() {
      await pool.end();
    },
  };
}
