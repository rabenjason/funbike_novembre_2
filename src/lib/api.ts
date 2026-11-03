/**
 * Client GraphQL du frontend Funbike.
 *
 * Toutes les données du site proviennent du backend (/graphql, proxy Vite).
 * Les fichiers src/data.ts et src/constants/content.ts ne servent qu'à
 * générer le seed du backend (server/scripts/build-seed.ts).
 */

/* ------------------------------------------------------------------ */
/*  Types (miroir du schéma GraphQL)                                    */
/* ------------------------------------------------------------------ */

export interface Spec {
  label: string;
  value: string;
}

export interface Bike {
  id: string;
  name: string;
  brand: string;
  family: string;
  price: string;
  tag: string | null;
  alt: string;
  image: string;
  gallery: string[];
  specs: Spec[];
  desc: string;
  order: number;
}

export interface Part {
  id: string;
  name: string;
  price: string;
  image: string;
  kind: string;
  category: string | null;
  compatibleBrand: string | null;
  partType: string | null;
  sourceUrl: string | null;
  gallery: string[];
  desc: string | null;
  specs: Spec[];
  order: number;
}

export interface Brand {
  id: string;
  name: string;
  src: string;
  order: number;
}

export interface Category {
  id: string;
  title: string;
  desc: string;
  src: string;
  to: string;
  brand: string | null;
  order: number;
}

export interface Dealer {
  id: string;
  key: string;
  city: string;
  name: string;
  kind: string;
  address: string;
  hours: string;
  phone: string;
  email: string;
  desc: string;
  lat: number;
  lon: number;
  services: string[];
  order: number;
}

export interface ExclusiveBrand {
  id: string;
  key: string;
  name: string;
  tagline: string;
  image: string;
  order: number;
}

export interface HeroSlide {
  id: string;
  short: string;
  brand: string;
  tag: string;
  image: string;
  alt: string;
  bikeId: string | null;
  order: number;
  enabled: boolean;
}

export interface NewArrival {
  id: string;
  badge: string;
  surTitre: string;
  titre: string;
  description: string;
  alt: string;
  points: string[];
  prix: string;
  productId: string | null;
  image: string;
  order: number;
}

export interface HeroContent {
  localisation: string;
  titreLigne1: string;
  titreLigne2: string;
  description: string;
  sloganPrefix: string;
  usages: string[];
  boutonCatalogue: string;
  aLaUne: string;
  annee: string;
}

export interface UniversSection {
  surTitre: string;
  titre: string;
}

export interface ShercoSection {
  surTitre: string;
  titreLigne1: string;
  titreLigne2: string;
  description: string;
  bouton: string;
  image: string;
  imageAlt: string;
}

export interface DistributeurSection {
  surTitre: string;
  titre: string;
  boutonToutVoir: string;
  boutonToutesMotos: string;
}

export interface NouveautesSection {
  surTitre: string;
  titre: string;
  description: string;
  tarif: string;
  boutonCatalogue: string;
  decouvrirPrefix: string;
  items: NewArrival[];
}

export interface MotosSection {
  numero: string;
  titre: string;
  description: string;
  bouton: string;
}

export interface AtelierSection {
  surTitre: string;
  titre: string;
  description: string;
  bouton: string;
  productIds: string[];
}

export interface PartenairesSection {
  titre: string;
  description: string;
}

export interface HomeContent {
  hero: HeroContent;
  heroSlides: HeroSlide[];
  univers: UniversSection;
  sherco: ShercoSection;
  distributeur: DistributeurSection;
  nouveautes: NouveautesSection;
  motos: MotosSection;
  atelier: AtelierSection;
  partenaires: PartenairesSection;
  exclusiveBrands: ExclusiveBrand[];
}

export interface SiteSettings {
  siteName: string;
  siteFullName: string;
  logoUrl: string;
  logoAlt: string;
  country: string;
  city: string;
  address: string;
  addressFull: string;
  phoneDisplay: string;
  phoneLink: string;
  email: string;
  hours: string;
  hoursShort: string;
}

export interface DashboardStats {
  bikes: number;
  parts: number;
  brands: number;
  dealers: number;
  heroSlides: number;
}

export interface SiteData {
  settings: SiteSettings;
  home: HomeContent;
  bikes: Bike[];
  parts: Part[];
  brands: Brand[];
  categories: Category[];
  dealers: Dealer[];
}

/* ------------------------------------------------------------------ */
/*  Client GraphQL                                                     */
/* ------------------------------------------------------------------ */

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch("/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok && res.status !== 200) {
    throw new Error(`Erreur réseau (${res.status}).`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message ?? "Erreur GraphQL.");
  }
  return json.data as T;
}

/* ------------------------------------------------------------------ */
/*  Jeton admin (localStorage)                                         */
/* ------------------------------------------------------------------ */

const TOKEN_KEY = "fb-admin-token";
const USER_KEY = "fb-admin-user";

export function getAdminToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAdminUser(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function setAdminSession(token: string, username: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, username);
  } catch {
    /* stockage indisponible */
  }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    /* stockage indisponible */
  }
}

export async function adminLogin(username: string, password: string): Promise<string> {
  const data = await gql<{ login: { token: string; username: string } }>(
    `mutation($u: String!, $p: String!) {
      login(username: $u, password: $p) { token username }
    }`,
    { u: username, p: password },
  );
  setAdminSession(data.login.token, data.login.username);
  return data.login.token;
}

/* ------------------------------------------------------------------ */
/*  Requêtes publiques                                                 */
/* ------------------------------------------------------------------ */

export const SITE_QUERY = /* GraphQL */ `
  query SiteData {
    settings: siteSettings {
      siteName siteFullName logoUrl logoAlt country city address addressFull
      phoneDisplay phoneLink email hours hoursShort
    }
    home {
      hero { localisation titreLigne1 titreLigne2 description sloganPrefix usages boutonCatalogue aLaUne annee }
      heroSlides { id short brand tag image alt bikeId order enabled }
      univers { surTitre titre }
      sherco { surTitre titreLigne1 titreLigne2 description bouton image imageAlt }
      distributeur { surTitre titre boutonToutVoir boutonToutesMotos }
      nouveautes {
        surTitre titre description tarif boutonCatalogue decouvrirPrefix
        items { id badge surTitre titre description alt points prix productId image order }
      }
      motos { numero titre description bouton }
      atelier { surTitre titre description bouton productIds }
      partenaires { titre description }
      exclusiveBrands { id key name tagline image order }
    }
    bikes { id name brand family price tag alt image gallery specs { label value } desc order }
    parts { id name price image kind category compatibleBrand partType sourceUrl gallery desc specs { label value } order }
    brands { id name src order }
    categories { id title desc src to brand order }
    dealers { id key city name kind address hours phone email desc lat lon services order }
  }
`;

export async function fetchSiteData(): Promise<SiteData> {
  const data = await gql<SiteData>(SITE_QUERY);
  return data;
}

/* ------------------------------------------------------------------ */
/*  Mutations admin                                                    */
/* ------------------------------------------------------------------ */

export interface HomeInput {
  hero: HeroContent;
  heroSlides: HeroSlide[];
  univers: UniversSection;
  sherco: ShercoSection;
  distributeur: DistributeurSection;
  nouveautes: NouveautesSection;
  motos: MotosSection;
  atelier: AtelierSection;
  partenaires: PartenairesSection;
  exclusiveBrands: ExclusiveBrand[];
}

export async function mutateHome(input: HomeInput, token: string): Promise<HomeContent> {
  const data = await gql<{ updateHome: HomeContent }>(
    `mutation($input: HomeInput!) { updateHome(input: $input) {
      hero { localisation titreLigne1 titreLigne2 description sloganPrefix usages boutonCatalogue aLaUne annee }
      heroSlides { id short brand tag image alt bikeId order enabled }
      univers { surTitre titre }
      sherco { surTitre titreLigne1 titreLigne2 description bouton image imageAlt }
      distributeur { surTitre titre boutonToutVoir boutonToutesMotos }
      nouveautes { surTitre titre description tarif boutonCatalogue decouvrirPrefix items { id badge surTitre titre description alt points prix productId image order } }
      motos { numero titre description bouton }
      atelier { surTitre titre description bouton productIds }
      partenaires { titre description }
      exclusiveBrands { id key name tagline image order }
    } }`,
    { input },
    token,
  );
  return data.updateHome;
}

export async function mutateSiteSettings(input: SiteSettings, token: string): Promise<SiteSettings> {
  const data = await gql<{ updateSiteSettings: SiteSettings }>(
    `mutation($input: SiteSettingsInput!) { updateSiteSettings(input: $input) {
      siteName siteFullName logoUrl logoAlt country city address addressFull
      phoneDisplay phoneLink email hours hoursShort
    } }`,
    { input },
    token,
  );
  return data.updateSiteSettings;
}

const BIKE_FIELDS = `id name brand family price tag alt image gallery specs { label value } desc order`;

export async function upsertBike(
  input: Partial<Bike> & { name: string; brand: string; family: string; price: string; alt: string; image: string; desc: string },
  token: string,
): Promise<Bike> {
  const data = await gql<{ upsertBike: Bike }>(
    `mutation($input: BikeInput!) { upsertBike(input: $input) { ${BIKE_FIELDS} } }`,
    { input },
    token,
  );
  return data.upsertBike;
}

export async function deleteBike(id: string, token: string): Promise<boolean> {
  const data = await gql<{ deleteBike: boolean }>(
    `mutation($id: ID!) { deleteBike(id: $id) }`,
    { id },
    token,
  );
  return data.deleteBike;
}

const PART_FIELDS = `id name price image kind category compatibleBrand partType sourceUrl gallery desc specs { label value } order`;

export async function upsertPart(
  input: Partial<Part> & { name: string; price: string; image: string; kind: string },
  token: string,
): Promise<Part> {
  const data = await gql<{ upsertPart: Part }>(
    `mutation($input: PartInput!) { upsertPart(input: $input) { ${PART_FIELDS} } }`,
    { input },
    token,
  );
  return data.upsertPart;
}

export async function deletePart(id: string, token: string): Promise<boolean> {
  const data = await gql<{ deletePart: boolean }>(
    `mutation($id: ID!) { deletePart(id: $id) }`,
    { id },
    token,
  );
  return data.deletePart;
}

const DEALER_FIELDS = `id key city name kind address hours phone email desc lat lon services order`;

export async function upsertDealer(
  input: Partial<Dealer> & { key: string; city: string; name: string; kind: string; address: string; hours: string; phone: string; email: string; desc: string; lat: number; lon: number },
  token: string,
): Promise<Dealer> {
  const data = await gql<{ upsertDealer: Dealer }>(
    `mutation($input: DealerInput!) { upsertDealer(input: $input) { ${DEALER_FIELDS} } }`,
    { input },
    token,
  );
  return data.upsertDealer;
}

export async function deleteDealer(id: string, token: string): Promise<boolean> {
  const data = await gql<{ deleteDealer: boolean }>(
    `mutation($id: ID!) { deleteDealer(id: $id) }`,
    { id },
    token,
  );
  return data.deleteDealer;
}

export async function fetchStats(token: string): Promise<DashboardStats> {
  const data = await gql<{ dashboardStats: DashboardStats }>(
    `{ dashboardStats { bikes parts brands dealers heroSlides } }`,
    undefined,
    token,
  );
  return data.dashboardStats;
}

/* ------------------------------------------------------------------ */
/*  Upload d'images (POST /api/upload)                                 */
/* ------------------------------------------------------------------ */

export async function uploadImage(file: File, token: string): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-File-Name": encodeURIComponent(file.name),
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Échec de l'upload.");
  return json.url as string;
}
