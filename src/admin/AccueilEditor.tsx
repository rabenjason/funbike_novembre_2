/**
 * Éditeur de la page d'accueil (/admin/accueil).
 *
 * Permet de modifier, section par section, tout ce qui s'affiche sur
 * l'accueil du site — en particulier les PRODUITS MIS EN AVANT (le
 * carrousel du haut + la grille « Motos »), choisis librement dans le
 * catalogue. Chaque bloc correspond exactement à une zone visible du site.
 */
import { useMemo, useRef, useState, type ReactNode } from "react";
import type {
  ExclusiveBrand,
  HeroSlide,
  HomeInput,
  NewArrival,
  Part,
  SiteData,
  Bike,
} from "../lib/api";
import { mutateHome } from "../lib/api";
import {
  AdminButton,
  Field,
  ImageField,
  ListControls,
  Panel,
  SaveBar,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "./ui";

type AdminPageProps = { data: SiteData; refresh: () => void; token: string };

/* ------------------------------------------------------------------ */
/*  Sélecteur de produit (moto ou pièce du catalogue)                  */
/* ------------------------------------------------------------------ */

type ProductOption = { id: string; label: string; group: "Motos" | "Produits" };

function productOptions(data: SiteData): ProductOption[] {
  return [
    ...data.bikes.map((b) => ({
      id: b.id,
      label: `${b.name} · ${b.brand}`,
      group: "Motos" as const,
    })),
    ...data.parts.map((p) => ({
      id: p.id,
      label: `${p.name} (${p.kind === "piece" ? "pièce" : "équipement"})`,
      group: "Produits" as const,
    })),
  ];
}

function ProductSelect({
  value,
  onChange,
  options,
  allowEmpty = "Aucun (produit personnalisé)",
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  options: ProductOption[];
  allowEmpty?: string | null;
}) {
  return (
    <Select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      {allowEmpty !== null && <option value="">{allowEmpty}</option>}
      <optgroup label="Motos">
        {options
          .filter((o) => o.group === "Motos")
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
      </optgroup>
      <optgroup label="Produits">
        {options
          .filter((o) => o.group === "Produits")
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
      </optgroup>
    </Select>
  );
}

/** Pré-remplit un slide depuis le produit choisi. */
function autofillSlide(product: Bike | Part | undefined): Partial<HeroSlide> {
  if (!product) return {};
  const isBike = "family" in product;
  return {
    short: product.name,
    brand: isBike ? product.brand : product.kind === "tld" ? "Troy Lee Designs" : product.kind === "mt" ? "MT Helmets" : product.kind === "gaerne" ? "Gaerne" : product.kind === "tvs" ? "TVS" : product.compatibleBrand ?? "Universel",
    tag: isBike ? product.tag ?? product.family : product.category ?? "Équipement",
    image: product.image,
    alt: isBike ? product.alt : product.name,
  };
}

function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const target = index + dir;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/* ------------------------------------------------------------------ */
/*  Éditeur principal                                                  */
/* ------------------------------------------------------------------ */

export default function AccueilEditor({ data, refresh, token }: AdminPageProps) {
  const initial = useMemo<HomeInput>(() => structuredClone(data.home) as HomeInput, [data]);
  const [home, setHome] = useState<HomeInput>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const originalRef = useRef(JSON.stringify(initial));

  // Recharge l'édition quand les données fraîches arrivent (post-save/refetch)
  const [lastData, setLastData] = useState(data);
  if (lastData !== data) {
    setLastData(data);
    const fresh = structuredClone(data.home) as HomeInput;
    setHome(fresh);
    originalRef.current = JSON.stringify(fresh);
    setMsg(null);
  }

  const dirty = JSON.stringify(home) !== originalRef.current;
  const options = useMemo(() => productOptions(data), [data]);

  const patch = <K extends keyof HomeInput>(key: K, value: Partial<HomeInput[K]>) => {
    setHome((h) => ({ ...h, [key]: { ...(h[key] as object), ...value } as HomeInput[K] }));
    setMsg(null);
  };

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await mutateHome(home, token);
      originalRef.current = JSON.stringify(home);
      setMsg("✅ Enregistré — l'accueil du site est à jour.");
      refresh();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Erreur lors de l'enregistrement."}`);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------- Slides (produits mis en avant) ---------------- */

  const slides = home.heroSlides ?? [];
  const setSlides = (list: HeroSlide[]) => {
    setHome((h) => ({ ...h, heroSlides: list.map((s, i) => ({ ...s, order: i })) }));
    setMsg(null);
  };

  const updateSlide = (index: number, value: Partial<HeroSlide>) => {
    setSlides(slides.map((s, i) => (i === index ? { ...s, ...value } : s)));
  };

  const onSlideProduct = (index: number, productId: string | null) => {
    const product =
      data.bikes.find((b) => b.id === productId) ?? data.parts.find((p) => p.id === productId);
    updateSlide(index, { bikeId: productId, ...autofillSlide(product) });
  };

  /* ---------------- Nouveautés ---------------- */

  const items = home.nouveautes.items ?? [];
  const setItems = (list: NewArrival[]) => {
    patch("nouveautes", { items: list.map((n, i) => ({ ...n, order: i })) });
  };

  /* ---------------- Marques exclusives ---------------- */

  const brands = home.exclusiveBrands ?? [];
  const setBrands = (list: ExclusiveBrand[]) => {
    setHome((h) => ({ ...h, exclusiveBrands: list.map((b, i) => ({ ...b, order: i })) }));
    setMsg(null);
  };

  return (
    <div>
      <PageTitle
        title="Modifier l'accueil"
        description="Tout ce qui s'affiche sur la page d'accueil du site se règle ici : textes de la grande image, produits mis en avant, nouveautés et sections."
      />

      <div className="space-y-6">
        {/* ---------------------------------------------------------- */}
        <Panel
          title="1 · Grande image (hero)"
          description="Visible tout en haut de l'accueil : le grand visuel, le titre, la description et les boutons."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sur-titre (localisation)" hint="Ex. « Madagascar / Motos, équipement, liberté »">
              <TextInput value={home.hero.localisation} onChange={(e) => patch("hero", { localisation: e.target.value })} />
            </Field>
            <Field label="Texte du bouton principal">
              <TextInput value={home.hero.boutonCatalogue} onChange={(e) => patch("hero", { boutonCatalogue: e.target.value })} />
            </Field>
            <Field label="Titre — ligne 1">
              <TextInput value={home.hero.titreLigne1} onChange={(e) => patch("hero", { titreLigne1: e.target.value })} />
            </Field>
            <Field label="Titre — ligne 2">
              <TextInput value={home.hero.titreLigne2} onChange={(e) => patch("hero", { titreLigne2: e.target.value })} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <TextArea value={home.hero.description} onChange={(e) => patch("hero", { description: e.target.value })} />
            </Field>
            <Field label="Slogan — début de phrase" hint="Suivi des mots animés (champ suivant).">
              <TextInput value={home.hero.sloganPrefix} onChange={(e) => patch("hero", { sloganPrefix: e.target.value })} />
            </Field>
            <Field label="Mots animés (séparés par des virgules)" hint="Ex. « la ville, le travail, le cross… »">
              <TextInput
                value={home.hero.usages.join(", ")}
                onChange={(e) =>
                  patch("hero", {
                    usages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
            </Field>
            <Field label="Libellé « À la une »" hint="Petit label au-dessus du produit présenté.">
              <TextInput value={home.hero.aLaUne} onChange={(e) => patch("hero", { aLaUne: e.target.value })} />
            </Field>
            <Field label="Année affichée" hint="Affichée à côté du produit présenté (ex. 2026).">
              <TextInput value={home.hero.annee} onChange={(e) => patch("hero", { annee: e.target.value })} />
            </Field>
          </div>
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel
          title="2 · Produits mis en avant"
          description="Choisissez les produits qui présentent le site : ils défilent dans la grande image, alimentent le bouton secondaire et la grille « Motos » en bas de l'accueil. Cochez/ décochez pour les afficher ou non."
          right={
            <AdminButton
              type="button"
              onClick={() =>
                setSlides([
                  ...slides,
                  {
                    id: `slide-${Date.now()}`,
                    short: "Nouveau produit",
                    brand: "",
                    tag: "",
                    image: "",
                    alt: "",
                    bikeId: null,
                    order: slides.length,
                    enabled: true,
                  },
                ])
              }
            >
              + Ajouter un produit
            </AdminButton>
          }
        >
          {slides.length === 0 && (
            <p className="rounded-xl border border-dashed border-black/15 p-6 text-center text-sm text-black/45 dark:border-white/15 dark:text-white/45">
              Aucun produit mis en avant pour l'instant. Ajoutez-en un pour remplir la grande image.
            </p>
          )}
          <div className="space-y-4">
            {slides.map((slide, index) => (
              <div key={slide.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ffd100] text-xs font-bold text-[#171816]">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-[#171816] dark:text-[#f2f0ea]">
                      {slide.short || "Sans nom"}
                    </p>
                    <Toggle
                      checked={slide.enabled}
                      onChange={(v) => updateSlide(index, { enabled: v })}
                      label={slide.enabled ? "Affiché" : "Masqué"}
                    />
                  </div>
                  <ListControls
                    index={index}
                    count={slides.length}
                    onMove={(dir) => setSlides(moveItem(slides, index, dir))}
                    onRemove={() => setSlides(slides.filter((_, i) => i !== index))}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Produit lié (catalogue)"
                    hint="Sélectionnez une moto ou un produit : les champs ci-dessous sont pré-remplis et modifiables."
                    className="sm:col-span-2"
                  >
                    <ProductSelect
                      value={slide.bikeId}
                      onChange={(id) => onSlideProduct(index, id)}
                      options={options}
                    />
                  </Field>
                  <Field label="Nom court affiché">
                    <TextInput value={slide.short} onChange={(e) => updateSlide(index, { short: e.target.value })} />
                  </Field>
                  <Field label="Marque affichée">
                    <TextInput value={slide.brand} onChange={(e) => updateSlide(index, { brand: e.target.value })} />
                  </Field>
                  <Field label="Étiquette" hint="Ex. « Enduro / Factory ».">
                    <TextInput value={slide.tag} onChange={(e) => updateSlide(index, { tag: e.target.value })} />
                  </Field>
                  <Field label="Texte alternatif (accessibilité)">
                    <TextInput value={slide.alt} onChange={(e) => updateSlide(index, { alt: e.target.value })} />
                  </Field>
                  <ImageField
                    label="Image du slide (plein écran)"
                    value={slide.image}
                    onChange={(v) => updateSlide(index, { image: v })}
                    hint="Préférez une image paysage haute résolution (≥ 1600 px de large)."
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel
          title="3 · Nouveautés / Arrivages"
          description="Les trois cartes « Nouveautés » de l'accueil. Associez un produit du catalogue ou personnalisez librement."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sur-titre de la section">
              <TextInput value={home.nouveautes.surTitre} onChange={(e) => patch("nouveautes", { surTitre: e.target.value })} />
            </Field>
            <Field label="Titre de la section">
              <TextInput value={home.nouveautes.titre} onChange={(e) => patch("nouveautes", { titre: e.target.value })} />
            </Field>
            <Field label="Description de la section" className="sm:col-span-2">
              <TextArea value={home.nouveautes.description} onChange={(e) => patch("nouveautes", { description: e.target.value })} />
            </Field>
          </div>

          <div className="mt-5 space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-black/8 text-xs font-bold dark:bg-white/10">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-[#171816] dark:text-[#f2f0ea]">{item.titre || "Sans titre"}</p>
                  </div>
                  <ListControls
                    index={index}
                    count={items.length}
                    onMove={(dir) => setItems(moveItem(items, index, dir))}
                    onRemove={() => setItems(items.filter((_, i) => i !== index))}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Produit lié (catalogue)" className="sm:col-span-2">
                    <ProductSelect
                      value={item.productId}
                      onChange={(id) => {
                        const product =
                          data.bikes.find((b) => b.id === id) ?? data.parts.find((p) => p.id === id);
                        setItems(
                          items.map((it, i) =>
                            i === index
                              ? {
                                  ...it,
                                  productId: id,
                                  image: product?.image ?? it.image,
                                  alt: product && "alt" in product ? product.alt : it.alt,
                                }
                              : it,
                          ),
                        );
                      }}
                      options={options}
                    />
                  </Field>
                  <Field label="Badge">
                    <TextInput value={item.badge} onChange={(e) => setItems(items.map((it, i) => (i === index ? { ...it, badge: e.target.value } : it)))} />
                  </Field>
                  <Field label="Sur-titre (carte)">
                    <TextInput value={item.surTitre} onChange={(e) => setItems(items.map((it, i) => (i === index ? { ...it, surTitre: e.target.value } : it)))} />
                  </Field>
                  <Field label="Titre">
                    <TextInput value={item.titre} onChange={(e) => setItems(items.map((it, i) => (i === index ? { ...it, titre: e.target.value } : it)))} />
                  </Field>
                  <Field label="Prix affiché">
                    <TextInput value={item.prix} onChange={(e) => setItems(items.map((it, i) => (i === index ? { ...it, prix: e.target.value } : it)))} />
                  </Field>
                  <Field label="Description" className="sm:col-span-2">
                    <TextArea value={item.description} onChange={(e) => setItems(items.map((it, i) => (i === index ? { ...it, description: e.target.value } : it)))} />
                  </Field>
                  <Field label="Points clés (un par ligne)" className="sm:col-span-2">
                    <TextArea
                      value={item.points.join("\n")}
                      onChange={(e) =>
                        setItems(
                          items.map((it, i) =>
                            i === index ? { ...it, points: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) } : it,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Texte alternatif (accessibilité)">
                    <TextInput value={item.alt} onChange={(e) => setItems(items.map((it, i) => (i === index ? { ...it, alt: e.target.value } : it)))} />
                  </Field>
                  <ImageField
                    label="Image de la carte"
                    value={item.image}
                    onChange={(v) => setItems(items.map((it, i) => (i === index ? { ...it, image: v } : it)))}
                  />
                </div>
              </div>
            ))}
            <AdminButton
              type="button"
              variant="ghost"
              onClick={() =>
                setItems([
                  ...items,
                  {
                    id: `new-${Date.now()}`,
                    badge: "Nouveauté",
                    surTitre: "",
                    titre: "Nouvelle carte",
                    description: "",
                    alt: "",
                    points: [],
                    prix: "Sur devis",
                    productId: null,
                    image: "",
                    order: items.length,
                  },
                ])
              }
            >
              + Ajouter une carte nouveauté
            </AdminButton>
          </div>
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel title="4 · Bande Sherco" description="La grande bannière sombre « La première piste est la plus belle. »">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sur-titre">
              <TextInput value={home.sherco.surTitre} onChange={(e) => patch("sherco", { surTitre: e.target.value })} />
            </Field>
            <Field label="Texte du bouton">
              <TextInput value={home.sherco.bouton} onChange={(e) => patch("sherco", { bouton: e.target.value })} />
            </Field>
            <Field label="Titre — ligne 1">
              <TextInput value={home.sherco.titreLigne1} onChange={(e) => patch("sherco", { titreLigne1: e.target.value })} />
            </Field>
            <Field label="Titre — ligne 2">
              <TextInput value={home.sherco.titreLigne2} onChange={(e) => patch("sherco", { titreLigne2: e.target.value })} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <TextArea value={home.sherco.description} onChange={(e) => patch("sherco", { description: e.target.value })} />
            </Field>
            <Field label="Texte alternatif de l'image">
              <TextInput value={home.sherco.imageAlt} onChange={(e) => patch("sherco", { imageAlt: e.target.value })} />
            </Field>
            <ImageField label="Image de fond" value={home.sherco.image} onChange={(v) => patch("sherco", { image: v })} />
          </div>
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel
          title="5 · Marques exclusives"
          description="Les trois marques présentées dans la section « Distributeur exclusif »."
          right={
            <AdminButton
              type="button"
              onClick={() =>
                setBrands([
                  ...brands,
                  {
                    id: `excl-${Date.now()}`,
                    key: "nouvelle-marque",
                    name: "Nouvelle marque",
                    tagline: "",
                    image: "",
                    order: brands.length,
                  },
                ])
              }
            >
              + Ajouter
            </AdminButton>
          }
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {brands.map((brand, index) => (
              <div key={brand.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#171816] dark:text-[#f2f0ea]">{brand.name}</p>
                  <ListControls
                    index={index}
                    count={brands.length}
                    onMove={(dir) => setBrands(moveItem(brands, index, dir))}
                    onRemove={() => setBrands(brands.filter((_, i) => i !== index))}
                  />
                </div>
                <div className="space-y-3">
                  <Field label="Nom">
                    <TextInput value={brand.name} onChange={(e) => setBrands(brands.map((b, i) => (i === index ? { ...b, name: e.target.value } : b)))} />
                  </Field>
                  <Field label="Signature (sous le nom)">
                    <TextInput value={brand.tagline} onChange={(e) => setBrands(brands.map((b, i) => (i === index ? { ...b, tagline: e.target.value } : b)))} />
                  </Field>
                  <ImageField label="Logo" value={brand.image} onChange={(v) => setBrands(brands.map((b, i) => (i === index ? { ...b, image: v } : b)))} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* ---------------------------------------------------------- */}
        <Panel title="6 · Autres sections de l'accueil" description="Textes des blocs « univers », « distributeur », « motos », « atelier » et « partenaires ».">
          <div className="space-y-6">
            <SubBlock title="Choisir son univers (liste de liens)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sur-titre">
                  <TextInput value={home.univers.surTitre} onChange={(e) => patch("univers", { surTitre: e.target.value })} />
                </Field>
                <Field label="Titre">
                  <TextInput value={home.univers.titre} onChange={(e) => patch("univers", { titre: e.target.value })} />
                </Field>
              </div>
            </SubBlock>

            <SubBlock title="Distributeur exclusif (marques)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sur-titre">
                  <TextInput value={home.distributeur.surTitre} onChange={(e) => patch("distributeur", { surTitre: e.target.value })} />
                </Field>
                <Field label="Titre">
                  <TextInput value={home.distributeur.titre} onChange={(e) => patch("distributeur", { titre: e.target.value })} />
                </Field>
                <Field label="Bouton (desktop)">
                  <TextInput value={home.distributeur.boutonToutVoir} onChange={(e) => patch("distributeur", { boutonToutVoir: e.target.value })} />
                </Field>
                <Field label="Bouton (mobile)">
                  <TextInput value={home.distributeur.boutonToutesMotos} onChange={(e) => patch("distributeur", { boutonToutesMotos: e.target.value })} />
                </Field>
              </div>
            </SubBlock>

            <SubBlock title="Grille « Motos »">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Numéro de section">
                  <TextInput value={home.motos.numero} onChange={(e) => patch("motos", { numero: e.target.value })} />
                </Field>
                <Field label="Titre">
                  <TextInput value={home.motos.titre} onChange={(e) => patch("motos", { titre: e.target.value })} />
                </Field>
                <Field label="Description">
                  <TextInput value={home.motos.description} onChange={(e) => patch("motos", { description: e.target.value })} />
                </Field>
                <Field label="Bouton">
                  <TextInput value={home.motos.bouton} onChange={(e) => patch("motos", { bouton: e.target.value })} />
                </Field>
              </div>
            </SubBlock>

            <SubBlock title="Bande Atelier (produits choisis)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sur-titre">
                  <TextInput value={home.atelier.surTitre} onChange={(e) => patch("atelier", { surTitre: e.target.value })} />
                </Field>
                <Field label="Titre">
                  <TextInput value={home.atelier.titre} onChange={(e) => patch("atelier", { titre: e.target.value })} />
                </Field>
                <Field label="Description">
                  <TextInput value={home.atelier.description} onChange={(e) => patch("atelier", { description: e.target.value })} />
                </Field>
                <Field label="Bouton">
                  <TextInput value={home.atelier.bouton} onChange={(e) => patch("atelier", { bouton: e.target.value })} />
                </Field>
                <Field
                  label="Produits affichés (dans l'ordre)"
                  hint="Choisissez les produits de la bande « Prêt pour la suite. »"
                  className="sm:col-span-2"
                >
                  <div className="space-y-2">
                    {home.atelier.productIds.map((pid, index) => (
                      <div key={`${pid}-${index}`} className="flex items-center gap-2">
                        <ProductSelect
                          value={pid}
                          onChange={(id) =>
                            patch("atelier", {
                              productIds: home.atelier.productIds.map((v, i) => (i === index ? (id ?? "") : v)),
                            })
                          }
                          options={options}
                          allowEmpty="— choisir —"
                        />
                        <AdminButton
                          type="button"
                          variant="ghost"
                          className="!min-h-9 !px-2.5"
                          onClick={() =>
                            patch("atelier", {
                              productIds: moveItem(home.atelier.productIds, index, -1),
                            })
                          }
                          disabled={index === 0}
                        >
                          ↑
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="ghost"
                          className="!min-h-9 !px-2.5"
                          onClick={() =>
                            patch("atelier", {
                              productIds: moveItem(home.atelier.productIds, index, 1),
                            })
                          }
                          disabled={index >= home.atelier.productIds.length - 1}
                        >
                          ↓
                        </AdminButton>
                        <AdminButton
                          type="button"
                          variant="danger"
                          className="!min-h-9 !px-2.5"
                          onClick={() =>
                            patch("atelier", {
                              productIds: home.atelier.productIds.filter((_, i) => i !== index),
                            })
                          }
                        >
                          ✕
                        </AdminButton>
                      </div>
                    ))}
                    <AdminButton
                      type="button"
                      variant="ghost"
                      onClick={() => patch("atelier", { productIds: [...home.atelier.productIds, ""] })}
                    >
                      + Ajouter un produit
                    </AdminButton>
                  </div>
                </Field>
              </div>
            </SubBlock>

            <SubBlock title="Bande Partenaires (défilement de logos)">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Titre">
                  <TextInput value={home.partenaires.titre} onChange={(e) => patch("partenaires", { titre: e.target.value })} />
                </Field>
                <Field label="Sous-texte">
                  <TextInput value={home.partenaires.description} onChange={(e) => patch("partenaires", { description: e.target.value })} />
                </Field>
              </div>
            </SubBlock>
          </div>
        </Panel>
      </div>

      <SaveBar onSave={() => void save()} saving={saving} message={msg} dirty={dirty} />
    </div>
  );
}

function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#98741b] dark:text-[#ffd100]">
        Accueil du site
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-[#171816] dark:text-[#f2f0ea]">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-black/55 dark:text-white/55">{description}</p>
    </div>
  );
}

function SubBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-black/8 p-4 dark:border-white/8">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-black/50 dark:text-white/50">{title}</p>
      {children}
    </div>
  );
}
