/** CRUD des motos (/admin/motos). */
import { useState } from "react";
import type { Bike, Spec } from "../lib/api";
import { deleteBike, upsertBike } from "../lib/api";
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

type AdminPageProps = { data: { bikes: Bike[] }; refresh: () => void; token: string };

const EMPTY: Bike = {
  id: "",
  name: "",
  brand: "Sherco",
  family: "Off-road",
  price: "Sur devis",
  tag: "",
  alt: "",
  image: "",
  gallery: [],
  specs: [],
  desc: "",
  order: 0,
};

export default function MotosAdmin({ data, refresh, token }: AdminPageProps) {
  const [form, setForm] = useState<Bike | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = (value: Partial<Bike>) => setForm((f) => (f ? { ...f, ...value } : f));

  async function save() {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      await upsertBike(
        {
          id: form.id || undefined,
          name: form.name,
          brand: form.brand,
          family: form.family,
          price: form.price,
          tag: form.tag || null,
          alt: form.alt,
          image: form.image,
          gallery: form.gallery,
          specs: form.specs,
          desc: form.desc,
          order: form.order,
        },
        token,
      );
      setMsg("✅ Moto enregistrée.");
      setForm(null);
      refresh();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Erreur."}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(bike: Bike) {
    if (!window.confirm(`Supprimer « ${bike.name} » ? Cette action est définitive.`)) return;
    try {
      await deleteBike(bike.id, token);
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
            Motos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/55 dark:text-white/55">
            {data.bikes.length} modèle(s) au catalogue. Les fiches alimentent les pages Motos, l'accueil et le chat.
          </p>
        </div>
        <AdminButton onClick={() => setForm({ ...EMPTY, order: data.bikes.length })}>+ Ajouter une moto</AdminButton>
      </div>

      {msg && <p className="mb-4 text-sm font-semibold">{msg}</p>}

      {form && (
        <Panel
          title={form.id ? `Modifier — ${form.name}` : "Nouvelle moto"}
          description="Renseignez la fiche produit telle qu'elle apparaîtra sur le site."
          right={
            <AdminButton variant="ghost" onClick={() => setForm(null)}>
              Fermer
            </AdminButton>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom du modèle">
              <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Marque">
              <TextInput value={form.brand} onChange={(e) => set({ brand: e.target.value })} />
            </Field>
            <Field label="Famille">
              <Select value={form.family} onChange={(e) => set({ family: e.target.value })}>
                <option>Off-road</option>
                <option>Urbain</option>
                <option>3 roues</option>
              </Select>
            </Field>
            <Field label="Prix affiché">
              <TextInput value={form.price} onChange={(e) => set({ price: e.target.value })} />
            </Field>
            <Field label="Étiquette (optionnelle)" hint="Ex. « Nouveauté 2026 », « Best-seller ».">
              <TextInput value={form.tag ?? ""} onChange={(e) => set({ tag: e.target.value })} />
            </Field>
            <Field label="Texte alternatif (accessibilité)">
              <TextInput value={form.alt} onChange={(e) => set({ alt: e.target.value })} />
            </Field>
            <ImageField label="Image principale" value={form.image} onChange={(v) => set({ image: v })} />
            <Field label="Galerie (une URL par ligne)">
              <TextArea
                value={form.gallery.join("\n")}
                onChange={(e) => set({ gallery: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <TextArea value={form.desc} onChange={(e) => set({ desc: e.target.value })} />
            </Field>
            <Field label="Caractéristiques (label / valeur)" className="sm:col-span-2">
              <div className="space-y-2">
                {form.specs.map((spec, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <TextInput
                      placeholder="Label (ex. Cylindrée)"
                      value={spec.label}
                      onChange={(e) =>
                        set({
                          specs: form.specs.map((s, i) => (i === index ? { ...s, label: e.target.value } : s)),
                        })
                      }
                    />
                    <TextInput
                      placeholder="Valeur (ex. 250 cc)"
                      value={spec.value}
                      onChange={(e) =>
                        set({
                          specs: form.specs.map((s, i) => (i === index ? { ...s, value: e.target.value } : s)),
                        })
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

      <Panel title="Toutes les motos">
        <ul className="divide-y divide-black/8 dark:divide-white/8">
          {data.bikes.map((bike) => (
            <li key={bike.id} className="flex flex-wrap items-center gap-3 py-3">
              <img
                src={bike.image}
                alt=""
                className="h-12 w-16 rounded-lg border border-black/8 bg-white object-contain dark:border-white/8 dark:bg-white/5"
              />
              <div className="min-w-[150px] flex-1">
                <p className="text-sm font-semibold text-[#171816] dark:text-[#f2f0ea]">{bike.name}</p>
                <p className="text-[11px] text-black/45 dark:text-white/45">
                  {bike.brand} · {bike.family} · {bike.price}
                </p>
              </div>
              <AdminButton variant="ghost" onClick={() => setForm(structuredClone(bike))}>
                Modifier
              </AdminButton>
              <AdminButton variant="danger" onClick={() => void remove(bike)}>
                Supprimer
              </AdminButton>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
