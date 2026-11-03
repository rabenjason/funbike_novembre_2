/** CRUD des revendeurs (/admin/revendeurs). */
import { useState } from "react";
import type { Dealer } from "../lib/api";
import { deleteDealer, upsertDealer } from "../lib/api";
import { AdminButton, Field, Panel, SaveBar, TextArea, TextInput } from "./ui";

type AdminPageProps = { data: { dealers: Dealer[] }; refresh: () => void; token: string };

const EMPTY: Dealer = {
  id: "",
  key: "",
  city: "",
  name: "",
  kind: "Point de vente",
  address: "",
  hours: "",
  phone: "",
  email: "",
  desc: "",
  lat: -18.8792,
  lon: 47.5079,
  services: [],
  order: 0,
};

export default function RevendeursAdmin({ data, refresh, token }: AdminPageProps) {
  const [form, setForm] = useState<Dealer | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const set = (value: Partial<Dealer>) => setForm((f) => (f ? { ...f, ...value } : f));

  async function save() {
    if (!form) return;
    setSaving(true);
    setMsg(null);
    try {
      await upsertDealer(
        {
          id: form.id || undefined,
          key: form.key || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          city: form.city,
          name: form.name,
          kind: form.kind,
          address: form.address,
          hours: form.hours,
          phone: form.phone,
          email: form.email,
          desc: form.desc,
          lat: form.lat,
          lon: form.lon,
          services: form.services,
          order: form.order,
        },
        token,
      );
      setMsg("✅ Revendeur enregistré.");
      setForm(null);
      refresh();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Erreur."}`);
    } finally {
      setSaving(false);
    }
  }

  async function remove(dealer: Dealer) {
    if (!window.confirm(`Supprimer « ${dealer.name} » ?`)) return;
    try {
      await deleteDealer(dealer.id, token);
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
            Réseau
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-[#171816] dark:text-[#f2f0ea]">
            Revendeurs
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/55 dark:text-white/55">
            {data.dealers.length} adresse(s) affichées sur la page Revendeurs (carte et coordonnées).
          </p>
        </div>
        <AdminButton onClick={() => setForm({ ...EMPTY, order: data.dealers.length })}>+ Ajouter un revendeur</AdminButton>
      </div>

      {msg && <p className="mb-4 text-sm font-semibold">{msg}</p>}

      {form && (
        <Panel
          title={form.id ? `Modifier — ${form.name}` : "Nouveau revendeur"}
          right={
            <AdminButton variant="ghost" onClick={() => setForm(null)}>
              Fermer
            </AdminButton>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de l'établissement">
              <TextInput value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Ville">
              <TextInput value={form.city} onChange={(e) => set({ city: e.target.value })} />
            </Field>
            <Field label="Type">
              <TextInput value={form.kind} onChange={(e) => set({ kind: e.target.value })} />
            </Field>
            <Field label="Adresse">
              <TextInput value={form.address} onChange={(e) => set({ address: e.target.value })} />
            </Field>
            <Field label="Horaires">
              <TextInput value={form.hours} onChange={(e) => set({ hours: e.target.value })} />
            </Field>
            <Field label="Téléphone">
              <TextInput value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <TextInput value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Services (séparés par des virgules)" hint="Ex. Motos, Essais, Atelier, Pièces">
              <TextInput
                value={form.services.join(", ")}
                onChange={(e) => set({ services: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
              />
            </Field>
            <Field label="Latitude">
              <TextInput
                type="number"
                value={String(form.lat)}
                onChange={(e) => set({ lat: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Longitude">
              <TextInput
                type="number"
                value={String(form.lon)}
                onChange={(e) => set({ lon: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <TextArea value={form.desc} onChange={(e) => set({ desc: e.target.value })} />
            </Field>
          </div>
          <SaveBar onSave={() => void save()} saving={saving} message={msg} dirty />
        </Panel>
      )}

      <Panel title="Tous les revendeurs">
        <ul className="divide-y divide-black/8 dark:divide-white/8">
          {data.dealers.map((dealer) => (
            <li key={dealer.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-[180px] flex-1">
                <p className="text-sm font-semibold text-[#171816] dark:text-[#f2f0ea]">
                  {dealer.name} <span className="text-black/40">· {dealer.city}</span>
                </p>
                <p className="text-[11px] text-black/45 dark:text-white/45">
                  {dealer.kind} · {dealer.phone}
                </p>
              </div>
              <AdminButton variant="ghost" onClick={() => setForm(structuredClone(dealer))}>
                Modifier
              </AdminButton>
              <AdminButton variant="danger" onClick={() => void remove(dealer)}>
                Supprimer
              </AdminButton>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
