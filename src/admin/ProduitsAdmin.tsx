/** CRUD des pièces & équipements (/admin/produits). */
import { useState } from "react";
import type { Part, Spec } from "../lib/api";
import { deletePart, upsertPart } from "../lib/api";
import {
  AdminButton,
  Field,
  ImageField,
  Panel,
  SaveBar,
  Select,
  TextArea,
  TextInput,
} from "./ui";

type AdminPageProps = { data: { parts: Part[] }; refresh: () => void; token: string };

const EMPTY: Part = {
  id: "",
  name: "",
  price: "Sur devis",
  image: "",
  kind: "piece",
  category: null,
  compatibleBrand: "Universal",
  partType: null,
  sourceUrl: null,
  gallery: [],
  desc: null,
  specs: [],
  order: 0,
};

export default function ProduitsAdmin({ data, refresh, token }: AdminPageProps) {
  const [form, setForm] = useState<Part | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = (value: Partial<Part>) => setForm((f) => (f ? { ...f, ...value } : f));

  async function save() {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      await upsertPart(
        {
          id: form.id || undefined,
          name: form.name,
          price: form.price,
          image: form.image,
          kind: form.kind,
          category: form.category,
          compatibleBrand: form.compatibleBrand,
          partType: form.partType,
          sourceUrl: form.sourceUrl,
          gallery: form.gallery,
          desc: form.desc,
          specs: form.specs,
          order: form.order,
        },
        token,
      );
      setMsg("✅ Produit enregistré.");
      setForm(null);
      refresh();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Erreur."}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(part: Part) {
    if (!window.confirm(`Supprimer « ${part.name} » ? Cette action est définitive.`)) return;
    try {
      await deletePart(part.id, token);
      refresh();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Erreur."}`);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#98741b] dark:text-[#ffd100]">
            Catalogue
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-[#171816] dark:text-[#f2f0ea]">
            Pièces & équipements
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/55 dark:text-white/55">
            {data.parts.length} référence(s) : pièces détachées et équipements pilote.
          </p>
        </div>
        <AdminButton onClick={() => setForm({ ...EMPTY, order: data.parts.length })}>+ Ajouter un produit</AdminButton>
      </div>

      {msg && <p className="mb-4 text-sm font-semibold">{msg}</p>}

      {form && (
        <Panel
          title={form.id ? `Modifier — ${form.name}` : "Nouveau produit"}
          description="Pièce détachée (atelier) ou équipement pilote (casque, blouson, bottes…)."
          right={
            <AdminButton variant="ghost" onClick={() => setForm(null)}>
              Fermer
            </AdminButton>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du produit">
              <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Prix affiché">
              <TextInput value={form.price} onChange={(e) => set({ price: e.target.value })} />
            </Field>
            <Field label="Nature">
              <Select value={form.kind} onChange={(e) => set({ kind: e.target.value })}>
                <option value="piece">Pièce détachée</option>
                <option value="tld">Équipement — Troy Lee Designs</option>
                <option value="gaerne">Équipement — Gaerne</option>
                <option value="mt">Équipement — MT Helmets</option>
                <option value="tvs">Équipement — TVS</option>
              </Select>
            </Field>
            <Field label="Catégorie">
              <Select value={form.category ?? ""} onChange={(e) => set({ category: e.target.value || null })}>
                <option value="">— aucune —</option>
                <option>Casques</option>
                <option>Blousons</option>
                <option>Gants</option>
                <option>Bottes</option>
                <option>Pièces</option>
              </Select>
            </Field>
            <Field label="Compatibilité (pièces)">
              <Select
                value={form.compatibleBrand ?? ""}
                onChange={(e) => set({ compatibleBrand: e.target.value || null })}
              >
                <option value="">— non précisé —</option>
                <option>Universal</option>
                <option>TVS</option>
                <option>Sherco</option>
                <option>Fantic</option>
              </Select>
            </Field>
            <Field label="Type de pièce">
              <Select value={form.partType ?? ""} onChange={(e) => set({ partType: e.target.value || null })}>
                <option value="">— non précisé —</option>
                <option>Pneus</option>
                <option>Freinage</option>
                <option>Transmission</option>
                <option>Filtration</option>
                <option>Pièces moteur</option>
                <option>Consommables</option>
              </Select>
            </Field>
            <Field label="Lien source (optionnel)">
              <TextInput value={form.sourceUrl ?? ""} onChange={(e) => set({ sourceUrl: e.target.value || null })} />
            </Field>
            <ImageField label="Image principale" value={form.image} onChange={(v) => set({ image: v })} />
            <Field label="Galerie (une URL par ligne)">
              <TextArea
                value={form.gallery.join("\n")}
                onChange={(e) => set({ gallery: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
              />
            </Field>
            <Field label="Description (optionnelle)" className="sm:col-span-2">
              <TextArea value={form.desc ?? ""} onChange={(e) => set({ desc: e.target.value || null })} />
            </Field>
            <Field label="Caractéristiques (label / valeur)" className="sm:col-span-2">
              <div className="space-y-2">
                {form.specs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <TextInput
                      placeholder="Label"
                      value={spec.label}
                      onChange={(e) =>
                        set({ specs: form.specs.map((s, i) => (i === index ? { ...s, label: e.target.value } : s)) })
                      }
                    />
                    <TextInput
                      placeholder="Valeur"
                      value={spec.value}
                      onChange={(e) =>
                        set({ specs: form.specs.map((s, i) => (i === index ? { ...s, value: e.target.value } : s)) })
                      }
                    />
                    <AdminButton
                      type="button"
                      variant="danger"
                      className="!min-h-9 !px-2.5"
                      onClick={() => set({ specs: form.specs.filter((_, i) => i !== index) })}
                    >
                      ✕
                    </AdminButton>
                  </div>
                ))}
                <AdminButton
                  type="button"
                  variant="ghost"
                  onClick={() => set({ specs: [...form.specs, { label: "", value: "" } as Spec] })}
                >
                  + Ajouter une caractéristique
                </AdminButton>
              </div>
            </Field>
          </div>
          <SaveBar onSave={() => void save()} saving={saving} message={msg} dirty />
        </Panel>
      )}

      <Panel title="Tous les produits">
        <ul className="divide-y divide-black/8 dark:divide-white/8">
          {data.parts.map((part) => (
            <li key={part.id} className="flex flex-wrap items-center gap-3 py-3">
              <img
                src={part.image}
                alt=""
                className="h-12 w-16 rounded-lg border border-black/8 bg-white object-contain dark:border-white/8 dark:bg-white/5"
              />
              <div className="min-w-[150px] flex-1">
                <p className="text-sm font-semibold text-[#171816] dark:text-[#f2f0ea]">{part.name}</p>
                <p className="text-[11px] text-black/45 dark:text-white/45">
                  {part.kind === "piece" ? "Pièce détachée" : "Équipement"} · {part.category ?? "sans catégorie"} ·{" "}
                  {part.price}
                </p>
              </div>
              <AdminButton variant="ghost" onClick={() => setForm(structuredClone(part))}>
                Modifier
              </AdminButton>
              <AdminButton variant="danger" onClick={() => void remove(part)}>
                Supprimer
              </AdminButton>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
