/**
 * Génère server/data/seed.json à partir des données statiques actuelles du site :
 *  - src/data.ts             (motos, pièces, équipements, marques, catégories, logo)
 *  - src/constants/content.ts(site + textes de l'accueil)
 *  - src/pages/Dealers.tsx   (revendeurs)
 *  - src/components/BrandExclusif.tsx (marques exclusives)
 *  - le carrousel « produits mis en avant » codé dans src/pages/Home.tsx (FEATURED)
 *
 * Ces fichiers ne servent QU'À informer le backend GraphQL (initialisation).
 * Le frontend ne les consomme plus : il lit tout via /graphql.
 *
 * Lancer : npx tsx server/scripts/build-seed.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LOGO, BRANDS, CATEGORIES, BIKES, ALL_PARTS, DEALERS, EXCLUSIVE_BRANDS } from "../../src/data";
import { content } from "../../src/constants/content";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ */
/*  Carrousel « À la une » (anciennement FEATURED dans Home.tsx)       */
/* ------------------------------------------------------------------ */

const HERO_SLIDES = [
  {
    id: "slide-sef-250",
    short: "SEF 250 Factory",
    brand: "Sherco",
    tag: "Enduro / Factory",
    image:
      "https://funbike.mg/wp-content/uploads/2026/02/01-250-SEF-FACTORY-2026-3679x2456-1-1920x1080-1.jpg",
    alt: "Sherco SEF 250 Factory 2026 en action",
    bikeId: "sherco-sef-250-factory-2026",
    order: 0,
    enabled: true,
  },
  {
    id: "slide-sef-300",
    short: "SEF 300 Factory",
    brand: "Sherco",
    tag: "Enduro / Factory",
    image:
      "https://funbike.mg/wp-content/uploads/2026/02/01-300-SEF-FACTORY-2026-3679x2456-1-1920x1080-1.jpg",
    alt: "Sherco SEF 300 Factory 2026 en action",
    bikeId: "sherco-sef-300-factory-2026",
    order: 1,
    enabled: true,
  },
  {
    id: "slide-xx-125",
    short: "XX 125 Off-Road",
    brand: "Fantic",
    tag: "Cross / 125 cc",
    image: "https://funbike.mg/wp-content/uploads/2026/02/7b566adac57a4b5dbfd74d4f768e6fdb.jpg",
    alt: "Fantic XX 125 2026 sur piste",
    bikeId: "xx-125-2026",
    order: 2,
    enabled: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Produits « Atelier / Essentiels » (anciennement codés dans Home)   */
/* ------------------------------------------------------------------ */

const ATELIER_PRODUCT_IDS = [
  "tvs-part-tyre-front",
  "tvs-part-chain-kit",
  "tvs-helmet-raider",
  "tvs-jacket-tech-core",
];

/* ------------------------------------------------------------------ */
/*  Nouveautés : image résolue (produit lié + image de secours)        */
/* ------------------------------------------------------------------ */

const TLD_IMAGE =
  "https://troyleedesigns.eu/cdn/shop/files/TLD_M26D2_GPPRO_PULSE_BLACK_01.jpg?v=1785777688&width=533";

const partById = new Map(ALL_PARTS.map((p) => [p.id, p]));
const bikeById = new Map(BIKES.map((b) => [b.id, b]));

const NEW_ARRIVALS = content.accueil.nouveautes.items.map((item) => {
  const part = partById.get(item.id);
  const bike = bikeById.get(item.id);
  const image = bike?.image ?? part?.image ?? TLD_IMAGE;
  // L'ancienne référence « tld » (collection) est rattachée au produit t1 (GP Pro Pulse).
  const productId = item.id === "tld" ? "t1" : item.id;
  return {
    id: item.id === "tld" ? "new-tld-gp-pro" : `new-${item.id}`,
    badge: item.badge,
    surTitre: item.surTitre,
    titre: item.titre,
    description: item.description,
    alt: item.alt,
    points: [...item.points],
    prix: item.prix,
    productId,
    image,
    order: 0,
  };
}).map((item, index) => ({ ...item, order: index }));

/* ------------------------------------------------------------------ */
/*  Document seed                                                      */
/* ------------------------------------------------------------------ */

const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const seed = {
  settings: {
    siteName: content.site.nom,
    siteFullName: content.site.nomComplet,
    logoUrl: LOGO,
    logoAlt: content.site.logoAlt,
    country: content.site.pays,
    city: content.site.ville,
    address: content.site.adresse,
    addressFull: content.site.adresseComplete,
    phoneDisplay: content.site.telephoneAffiche,
    phoneLink: content.site.telephoneLien,
    email: content.site.email,
    hours: content.site.horaires,
    hoursShort: content.site.horairesCourts,
  },

  home: {
    hero: {
      localisation: content.accueil.hero.localisation,
      titreLigne1: content.accueil.hero.titreLigne1,
      titreLigne2: content.accueil.hero.titreLigne2,
      description: content.accueil.hero.description,
      sloganPrefix: content.accueil.hero.sloganPrefix,
      usages: [...content.accueil.hero.usages],
      boutonCatalogue: content.accueil.hero.boutonCatalogue,
      aLaUne: content.accueil.hero.aLaUne,
      annee: content.accueil.hero.annee,
    },
    heroSlides: HERO_SLIDES,
    univers: {
      surTitre: content.accueil.univers.surTitre,
      titre: content.accueil.univers.titre,
    },
    sherco: {
      surTitre: content.accueil.sherco.surTitre,
      titreLigne1: content.accueil.sherco.titreLigne1,
      titreLigne2: content.accueil.sherco.titreLigne2,
      description: content.accueil.sherco.description,
      bouton: content.accueil.sherco.bouton,
      image: "https://www.sherco.com/wp-content/uploads/SHERCO50ccV2-32.jpg",
      imageAlt: content.accueil.sherco.imageAlt,
    },
    distributeur: {
      surTitre: content.accueil.distributeur.surTitre,
      titre: content.accueil.distributeur.titre,
      boutonToutVoir: content.accueil.distributeur.boutonToutVoir,
      boutonToutesMotos: content.accueil.distributeur.boutonToutesMotos,
    },
    nouveautes: {
      surTitre: content.accueil.nouveautes.surTitre,
      titre: content.accueil.nouveautes.titre,
      description: content.accueil.nouveautes.description,
      tarif: content.accueil.nouveautes.tarif,
      boutonCatalogue: content.accueil.nouveautes.boutonCatalogue,
      decouvrirPrefix: content.accueil.nouveautes.decouvrirPrefix,
      items: NEW_ARRIVALS,
    },
    motos: {
      numero: content.accueil.motos.numero,
      titre: content.accueil.motos.titre,
      description: content.accueil.motos.description,
      bouton: content.accueil.motos.bouton,
    },
    atelier: {
      surTitre: content.accueil.atelier.surTitre,
      titre: content.accueil.atelier.titre,
      description: content.accueil.atelier.description,
      bouton: content.accueil.atelier.bouton,
      productIds: ATELIER_PRODUCT_IDS,
    },
    partenaires: {
      titre: content.accueil.partenaires.titre,
      description: content.accueil.partenaires.description,
    },
    exclusiveBrands: EXCLUSIVE_BRANDS.map((brand, index) => ({
      id: `excl-${slug(brand.key)}`,
      key: brand.key,
      name: brand.name,
      tagline: brand.tagline,
      image: brand.image,
      order: index,
    })),
  },

  brands: BRANDS.map((brand, index) => ({
    id: `brand-${slug(brand.name)}`,
    name: brand.name,
    src: brand.src,
    order: index,
  })),

  categories: CATEGORIES.map((category, index) => ({
    id: `cat-${slug(category.title)}`,
    title: category.title,
    desc: category.desc,
    src: category.src,
    to: category.to,
    brand: category.brand ?? null,
    order: index,
  })),

  bikes: BIKES.map((bike, index) => ({
    ...bike,
    tag: bike.tag ?? null,
    gallery: bike.gallery ?? [],
    specs: bike.specs,
    order: index,
  })),

  parts: ALL_PARTS.map((part, index) => ({
    id: part.id,
    name: part.name,
    price: part.price,
    image: part.image,
    kind: part.kind,
    category: part.category ?? null,
    compatibleBrand: part.compatibleBrand ?? null,
    partType: part.partType ?? null,
    sourceUrl: part.sourceUrl ?? null,
    gallery: part.gallery ?? [],
    desc: part.desc ?? null,
    specs: part.specs ?? [],
    order: index,
  })),

  dealers: DEALERS.map((dealer, index) => ({
    ...dealer,
    id: `dealer-${slug(dealer.key)}`,
    services: dealer.services,
    order: index,
  })),
};

const outDir = join(__dirname, "..", "data");
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, "seed.json");
writeFileSync(outFile, JSON.stringify(seed, null, 2), "utf8");

const counts = {
  bikes: seed.bikes.length,
  parts: seed.parts.length,
  brands: seed.brands.length,
  categories: seed.categories.length,
  dealers: seed.dealers.length,
  heroSlides: seed.home.heroSlides.length,
  newArrivals: seed.home.nouveautes.items.length,
};
console.log("seed.json généré :", outFile);
console.log(counts);
