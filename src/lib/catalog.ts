/**
 * Cache catalogue partagé (motos, pièces, marques).
 *
 * Remplace les anciennes importations statiques depuis src/data.ts :
 * le store GraphQL remplit ce cache au chargement, et les modules hors React
 * (assistant, recommandeur, chat) y accèdent paresseusement.
 */
import type { Bike, Brand, Part } from "./api";

interface CatalogCache {
  bikes: Bike[];
  parts: Part[];
  brands: Brand[];
}

let cache: CatalogCache = { bikes: [], parts: [], brands: [] };

export function setCatalog(data: Partial<CatalogCache>) {
  cache = {
    bikes: data.bikes ?? cache.bikes,
    parts: data.parts ?? cache.parts,
    brands: data.brands ?? cache.brands,
  };
}

export const getBikes = (): Bike[] => cache.bikes;
export const getParts = (): Part[] => cache.parts;
export const getBrands = (): Brand[] => cache.brands;

export function findBike(id?: string): Bike | undefined {
  if (!id) return undefined;
  return cache.bikes.find((b) => b.id === id);
}

export function findPart(id?: string): Part | undefined {
  if (!id) return undefined;
  return cache.parts.find((p) => p.id === id);
}

/** Libellé marque pour un accessoire. */
export function partBrandLabel(part: Part): string {
  if (part.kind === "tld") return "Troy Lee Designs";
  if (part.kind === "gaerne") return "Gaerne";
  if (part.kind === "mt") return "MT Helmets";
  if (part.kind === "tvs") return "TVS";
  if (part.compatibleBrand && part.compatibleBrand !== "Universal") return part.compatibleBrand;
  return "Universel";
}

/** Famille d'usage : équipement pilote ou pièce moto. */
export function partFamily(part: Part): "Équipement" | "Pièce détachée" {
  return part.kind === "piece" ? "Pièce détachée" : "Équipement";
}

/** Pièces détachées (kind "piece"). */
export const spareParts = (): Part[] => cache.parts.filter((p) => p.kind === "piece");

/** Équipements pilote (hors pièces). */
export const gearItems = (): Part[] => cache.parts.filter((p) => p.kind !== "piece");

/** Équipements d'une marque donnée (clé : tld | gaerne | mt | tvs). */
export const gearByKind = (kind: string): Part[] => cache.parts.filter((p) => p.kind === kind);
