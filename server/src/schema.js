/**
 * Schéma GraphQL du backend Funbike.
 *
 * Le modèle est calqué sur les données statiques du site
 * (src/data.ts, src/types/index.ts, src/constants/content.ts) :
 *   Bike (moto), Part (pièce/équipement), Brand, Category, Dealer,
 *   HomeContent (accueil entièrement modifiable depuis /admin),
 *   HeroSlide (produits présentés sur l'accueil — choisis dans le dashboard),
 *   SiteSettings (coordonnées du site).
 *
 * Stockage : MySQL (phpMyAdmin) via la couche db.js — repli SQLite local
 * si le serveur MySQL est injoignable (dev hors-ligne).
 */
import { makeExecutableSchema } from "@graphql-tools/schema";
import { GraphQLError } from "graphql";
import { getCollection, setCollection } from "./db.js";
import { authFromHeader, changePassword, login } from "./auth.js";

/* ------------------------------------------------------------------ */
/*  SDL                                                               */
/* ------------------------------------------------------------------ */

const typeDefs = /* GraphQL */ `
  type Spec {
    label: String!
    value: String!
  }

  input SpecInput {
    label: String!
    value: String!
  }

  "Moto / véhicule du catalogue."
  type Bike {
    id: ID!
    name: String!
    brand: String!
    "Off-road | Urbain | 3 roues"
    family: String!
    price: String!
    tag: String
    alt: String!
    image: String!
    gallery: [String!]!
    specs: [Spec!]!
    desc: String!
    order: Int!
  }

  input BikeInput {
    id: ID
    name: String!
    brand: String!
    family: String!
    price: String!
    tag: String
    alt: String!
    image: String!
    gallery: [String!]
    specs: [SpecInput!]
    desc: String!
    order: Int
  }

  "Pièce détachée ou équipement pilote."
  type Part {
    id: ID!
    name: String!
    price: String!
    image: String!
    "piece | tld | gaerne | mt | tvs"
    kind: String!
    "Casques | Blousons | Gants | Bottes | Pièces"
    category: String
    "Universal | TVS | Sherco | Fantic"
    compatibleBrand: String
    "Pneus | Freinage | Transmission | Filtration | Pièces moteur | Consommables"
    partType: String
    sourceUrl: String
    gallery: [String!]!
    desc: String
    specs: [Spec!]!
    order: Int!
  }

  input PartInput {
    id: ID
    name: String!
    price: String!
    image: String!
    kind: String!
    category: String
    compatibleBrand: String
    partType: String
    sourceUrl: String
    gallery: [String!]
    desc: String
    specs: [SpecInput!]
    order: Int
  }

  type Brand {
    id: ID!
    name: String!
    src: String!
    order: Int!
  }

  input BrandInput {
    id: ID
    name: String!
    src: String!
    order: Int
  }

  type Category {
    id: ID!
    title: String!
    desc: String!
    src: String!
    to: String!
    brand: String
    order: Int!
  }

  type Dealer {
    id: ID!
    key: String!
    city: String!
    name: String!
    kind: String!
    address: String!
    hours: String!
    phone: String!
    email: String!
    desc: String!
    lat: Float!
    lon: Float!
    services: [String!]!
    order: Int!
  }

  input DealerInput {
    id: ID
    key: String!
    city: String!
    name: String!
    kind: String!
    address: String!
    hours: String!
    phone: String!
    email: String!
    desc: String!
    lat: Float!
    lon: Float!
    services: [String!]
    order: Int
  }

  "Marque exclusive présentée sur l'accueil."
  type ExclusiveBrand {
    id: ID!
    key: String!
    name: String!
    tagline: String!
    image: String!
    order: Int!
  }

  input ExclusiveBrandInput {
    id: ID
    key: String!
    name: String!
    tagline: String!
    image: String!
    order: Int
  }

  "Slide du carrousel du haut de l'accueil (produits présentés sur le site)."
  type HeroSlide {
    id: ID!
    short: String!
    brand: String!
    tag: String!
    image: String!
    alt: String!
    "Produit du catalogue lié — null si slide personnalisée."
    bikeId: String
    order: Int!
    enabled: Boolean!
  }

  input HeroSlideInput {
    id: ID
    short: String!
    brand: String!
    tag: String!
    image: String!
    alt: String!
    bikeId: String
    order: Int
    enabled: Boolean
  }

  "Carte « Nouveautés / Arrivages » sur l'accueil."
  type NewArrival {
    id: ID!
    badge: String!
    surTitre: String!
    titre: String!
    description: String!
    alt: String!
    points: [String!]!
    prix: String!
    "Produit lié (id de moto ou de pièce)."
    productId: String
    image: String!
    order: Int!
  }

  input NewArrivalInput {
    id: ID
    badge: String!
    surTitre: String!
    titre: String!
    description: String!
    alt: String!
    points: [String!]
    prix: String!
    productId: String
    image: String!
    order: Int
  }

  "Textes de la grande image (hero) en haut de l'accueil."
  type HeroContent {
    localisation: String!
    titreLigne1: String!
    titreLigne2: String!
    description: String!
    sloganPrefix: String!
    usages: [String!]!
    boutonCatalogue: String!
    aLaUne: String!
    annee: String!
  }

  input HeroContentInput {
    localisation: String!
    titreLigne1: String!
    titreLigne2: String!
    description: String!
    sloganPrefix: String!
    usages: [String!]
    boutonCatalogue: String!
    aLaUne: String!
    annee: String!
  }

  type UniversSection {
    surTitre: String!
    titre: String!
  }

  input UniversSectionInput {
    surTitre: String!
    titre: String!
  }

  type ShercoSection {
    surTitre: String!
    titreLigne1: String!
    titreLigne2: String!
    description: String!
    bouton: String!
    image: String!
    imageAlt: String!
  }

  input ShercoSectionInput {
    surTitre: String!
    titreLigne1: String!
    titreLigne2: String!
    description: String!
    bouton: String!
    image: String!
    imageAlt: String!
  }

  type DistributeurSection {
    surTitre: String!
    titre: String!
    boutonToutVoir: String!
    boutonToutesMotos: String!
  }

  input DistributeurSectionInput {
    surTitre: String!
    titre: String!
    boutonToutVoir: String!
    boutonToutesMotos: String!
  }

  type NouveautesSection {
    surTitre: String!
    titre: String!
    description: String!
    tarif: String!
    boutonCatalogue: String!
    decouvrirPrefix: String!
    items: [NewArrival!]!
  }

  input NouveautesSectionInput {
    surTitre: String!
    titre: String!
    description: String!
    tarif: String!
    boutonCatalogue: String!
    decouvrirPrefix: String!
    items: [NewArrivalInput!]
  }

  type MotosSection {
    numero: String!
    titre: String!
    description: String!
    bouton: String!
  }

  input MotosSectionInput {
    numero: String!
    titre: String!
    description: String!
    bouton: String!
  }

  type AtelierSection {
    surTitre: String!
    titre: String!
    description: String!
    bouton: String!
    "Produits affichés dans la bande « Atelier / Essentiels »."
    productIds: [String!]!
  }

  input AtelierSectionInput {
    surTitre: String!
    titre: String!
    description: String!
    bouton: String!
    productIds: [String!]
  }

  type PartenairesSection {
    titre: String!
    description: String!
  }

  input PartenairesSectionInput {
    titre: String!
    description: String!
  }

  "Contenu complet de la page d'accueil (modifiable dans /admin)."
  type HomeContent {
    hero: HeroContent!
    heroSlides: [HeroSlide!]!
    univers: UniversSection!
    sherco: ShercoSection!
    distributeur: DistributeurSection!
    nouveautes: NouveautesSection!
    motos: MotosSection!
    atelier: AtelierSection!
    partenaires: PartenairesSection!
    exclusiveBrands: [ExclusiveBrand!]!
  }

  input HomeInput {
    hero: HeroContentInput!
    heroSlides: [HeroSlideInput!]
    univers: UniversSectionInput!
    sherco: ShercoSectionInput!
    distributeur: DistributeurSectionInput!
    nouveautes: NouveautesSectionInput!
    motos: MotosSectionInput!
    atelier: AtelierSectionInput!
    partenaires: PartenairesSectionInput!
    exclusiveBrands: [ExclusiveBrandInput!]
  }

  "Coordonnées et identité du site (footer, contact…)."
  type SiteSettings {
    siteName: String!
    siteFullName: String!
    logoUrl: String!
    logoAlt: String!
    country: String!
    city: String!
    address: String!
    addressFull: String!
    phoneDisplay: String!
    phoneLink: String!
    email: String!
    hours: String!
    hoursShort: String!
  }

  input SiteSettingsInput {
    siteName: String!
    siteFullName: String!
    logoUrl: String!
    logoAlt: String!
    country: String!
    city: String!
    address: String!
    addressFull: String!
    phoneDisplay: String!
    phoneLink: String!
    email: String!
    hours: String!
    hoursShort: String!
  }

  type DashboardStats {
    bikes: Int!
    parts: Int!
    brands: Int!
    dealers: Int!
    heroSlides: Int!
  }

  type AuthPayload {
    token: String!
    email: String!
  }

  type Query {
    siteSettings: SiteSettings!
    home: HomeContent!
    bikes(brand: String, family: String, search: String): [Bike!]!
    bike(id: ID!): Bike
    parts(kind: String, category: String, partType: String, compatibleBrand: String, search: String): [Part!]!
    part(id: ID!): Part
    brands: [Brand!]!
    categories: [Category!]!
    dealers: [Dealer!]!
    dashboardStats: DashboardStats!
  }

  type Mutation {
    "Connexion administrateur (e-mail + mot de passe) — renvoie un jeton JWT."
    login(email: String!, password: String!): AuthPayload!
    "Change le mot de passe du compte connecté."
    changeAdminPassword(currentPassword: String!, newPassword: String!): Boolean!
    updateSiteSettings(input: SiteSettingsInput!): SiteSettings!
    "Met à jour l'intégralité du contenu de l'accueil (textes, slides, sélections)."
    updateHome(input: HomeInput!): HomeContent!
    upsertBike(input: BikeInput!): Bike!
    deleteBike(id: ID!): Boolean!
    upsertPart(input: PartInput!): Part!
    deletePart(id: ID!): Boolean!
    upsertBrand(input: BrandInput!): Brand!
    deleteBrand(id: ID!): Boolean!
    upsertDealer(input: DealerInput!): Dealer!
    deleteDealer(id: ID!): Boolean!
  }
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function requireAuth(ctx) {
  if (!ctx.auth) {
    throw new GraphQLError("Authentification requise.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.auth;
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function nextId(prefix, name, existing) {
  const base = `${prefix}-${slugify(name) || "item"}`;
  let id = base;
  let i = 2;
  while (existing.some((x) => x.id === id)) {
    id = `${base}-${i++}`;
  }
  return id;
}

const withOrder = (list) =>
  [...list].map((item, index) => ({ order: index, ...item })).sort((a, b) => a.order - b.order);

/* ------------------------------------------------------------------ */
/*  Resolvers                                                         */
/* ------------------------------------------------------------------ */

const resolvers = {
  Query: {
    siteSettings: async () => getCollection("settings"),
    home: async () => getCollection("home"),

    bikes: async (_r, { brand, family, search }) => {
      let list = (await getCollection("bikes")) ?? [];
      if (brand) list = list.filter((b) => b.brand.toLowerCase() === brand.toLowerCase());
      if (family) list = list.filter((b) => b.family === family);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            b.brand.toLowerCase().includes(q) ||
            (b.desc ?? "").toLowerCase().includes(q),
        );
      }
      return withOrder(list);
    },
    bike: async (_r, { id }) => (await getCollection("bikes")).find((b) => b.id === id) ?? null,

    parts: async (_r, { kind, category, partType, compatibleBrand, search }) => {
      let list = (await getCollection("parts")) ?? [];
      if (kind) list = list.filter((p) => p.kind === kind);
      if (category) list = list.filter((p) => p.category === category);
      if (partType) list = list.filter((p) => p.partType === partType);
      if (compatibleBrand) list = list.filter((p) => p.compatibleBrand === compatibleBrand);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(q));
      }
      return withOrder(list);
    },
    part: async (_r, { id }) => (await getCollection("parts")).find((p) => p.id === id) ?? null,

    brands: async () => withOrder((await getCollection("brands")) ?? []),
    categories: async () => withOrder((await getCollection("categories")) ?? []),
    dealers: async () => withOrder((await getCollection("dealers")) ?? []),

    dashboardStats: async () => {
      const home = (await getCollection("home")) ?? {};
      return {
        bikes: ((await getCollection("bikes")) ?? []).length,
        parts: ((await getCollection("parts")) ?? []).length,
        brands: ((await getCollection("brands")) ?? []).length,
        dealers: ((await getCollection("dealers")) ?? []).length,
        heroSlides: (home.heroSlides ?? []).filter((s) => s.enabled).length,
      };
    },
  },

  Mutation: {
    login: async (_r, { email, password }) => {
      try {
        const token = await login(email, password);
        return { token, email };
      } catch (e) {
        throw new GraphQLError(e.message, { extensions: { code: "UNAUTHENTICATED" } });
      }
    },

    changeAdminPassword: async (_r, { currentPassword, newPassword }, ctx) => {
      const auth = requireAuth(ctx);
      try {
        return await changePassword(auth.email, currentPassword, newPassword);
      } catch (e) {
        throw new GraphQLError(e.message, { extensions: { code: "BAD_USER_INPUT" } });
      }
    },

    updateSiteSettings: async (_r, { input }, ctx) => {
      requireAuth(ctx);
      await setCollection("settings", input);
      return input;
    },

    updateHome: async (_r, { input }, ctx) => {
      requireAuth(ctx);
      const current = (await getCollection("home")) ?? {};
      const home = {
        hero: { ...input.hero, usages: input.hero.usages ?? [] },
        // Listes omises dans l'input → conservées en l'état.
        heroSlides: withOrder(input.heroSlides ?? current.heroSlides ?? []).map((s) => ({
          ...s,
          enabled: s.enabled ?? true,
          bikeId: s.bikeId ?? null,
        })),
        univers: input.univers,
        sherco: input.sherco,
        distributeur: input.distributeur,
        nouveautes: {
          ...input.nouveautes,
          items: withOrder(input.nouveautes.items ?? current.nouveautes?.items ?? []).map((n) => ({
            ...n,
            points: n.points ?? [],
            productId: n.productId ?? null,
          })),
        },
        motos: input.motos,
        atelier: {
          ...input.atelier,
          productIds: input.atelier.productIds ?? current.atelier?.productIds ?? [],
        },
        partenaires: input.partenaires,
        exclusiveBrands: withOrder(input.exclusiveBrands ?? current.exclusiveBrands ?? []),
      };
      await setCollection("home", home);
      return home;
    },

    upsertBike: async (_r, { input }, ctx) => {
      requireAuth(ctx);
      const bikes = (await getCollection("bikes")) ?? [];
      const id = input.id || nextId("bike", input.name, bikes);
      const bike = {
        id,
        name: input.name,
        brand: input.brand,
        family: input.family,
        price: input.price,
        tag: input.tag ?? null,
        alt: input.alt,
        image: input.image,
        gallery: input.gallery ?? [],
        specs: input.specs ?? [],
        desc: input.desc,
        order: input.order ?? bikes.length,
      };
      const index = bikes.findIndex((b) => b.id === id);
      if (index >= 0) bikes[index] = bike;
      else bikes.push(bike);
      await setCollection("bikes", bikes);
      return bike;
    },

    deleteBike: async (_r, { id }, ctx) => {
      requireAuth(ctx);
      const bikes = (await getCollection("bikes")) ?? [];
      const next = bikes.filter((b) => b.id !== id);
      await setCollection("bikes", next);
      return next.length !== bikes.length;
    },

    upsertPart: async (_r, { input }, ctx) => {
      requireAuth(ctx);
      const parts = (await getCollection("parts")) ?? [];
      const id = input.id || nextId("part", input.name, parts);
      const part = {
        id,
        name: input.name,
        price: input.price,
        image: input.image,
        kind: input.kind,
        category: input.category ?? null,
        compatibleBrand: input.compatibleBrand ?? null,
        partType: input.partType ?? null,
        sourceUrl: input.sourceUrl ?? null,
        gallery: input.gallery ?? [],
        desc: input.desc ?? null,
        specs: input.specs ?? [],
        order: input.order ?? parts.length,
      };
      const index = parts.findIndex((p) => p.id === id);
      if (index >= 0) parts[index] = part;
      else parts.push(part);
      await setCollection("parts", parts);
      return part;
    },

    deletePart: async (_r, { id }, ctx) => {
      requireAuth(ctx);
      const parts = (await getCollection("parts")) ?? [];
      const next = parts.filter((p) => p.id !== id);
      await setCollection("parts", next);
      return next.length !== parts.length;
    },

    upsertBrand: async (_r, { input }, ctx) => {
      requireAuth(ctx);
      const brands = (await getCollection("brands")) ?? [];
      const id = input.id || nextId("brand", input.name, brands);
      const brand = { id, name: input.name, src: input.src, order: input.order ?? brands.length };
      const index = brands.findIndex((b) => b.id === id);
      if (index >= 0) brands[index] = brand;
      else brands.push(brand);
      await setCollection("brands", brands);
      return brand;
    },

    deleteBrand: async (_r, { id }, ctx) => {
      requireAuth(ctx);
      const brands = (await getCollection("brands")) ?? [];
      const next = brands.filter((b) => b.id !== id);
      await setCollection("brands", next);
      return next.length !== brands.length;
    },

    upsertDealer: async (_r, { input }, ctx) => {
      requireAuth(ctx);
      const dealers = (await getCollection("dealers")) ?? [];
      const id = input.id || nextId("dealer", input.key || input.name, dealers);
      const dealer = {
        id,
        key: input.key,
        city: input.city,
        name: input.name,
        kind: input.kind,
        address: input.address,
        hours: input.hours,
        phone: input.phone,
        email: input.email,
        desc: input.desc,
        lat: input.lat,
        lon: input.lon,
        services: input.services ?? [],
        order: input.order ?? dealers.length,
      };
      const index = dealers.findIndex((d) => d.id === id);
      if (index >= 0) dealers[index] = dealer;
      else dealers.push(dealer);
      await setCollection("dealers", dealers);
      return dealer;
    },

    deleteDealer: async (_r, { id }, ctx) => {
      requireAuth(ctx);
      const dealers = (await getCollection("dealers")) ?? [];
      const next = dealers.filter((d) => d.id !== id);
      await setCollection("dealers", next);
      return next.length !== dealers.length;
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
