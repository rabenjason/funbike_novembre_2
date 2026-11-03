/** Paramètres du site (/admin/parametres) : identité, coordonnées, logo. */
import { useRef, useState } from "react";
import type { SiteSettings } from "../lib/api";
import { mutateSiteSettings } from "../lib/api";
import { Field, ImageField, Panel, SaveBar, TextArea, TextInput } from "./ui";

type AdminPageProps = { data: { settings: SiteSettings }; refresh: () => void; token: string };

export default function ParametresAdmin({ data, refresh, token }: AdminPageProps) {
  const [settings, setSettings] = useState<SiteSettings>(() => structuredClone(data.settings));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const originalRef = useRef(JSON.stringify(data.settings));

  const [lastData, setLastData] = useState(data);
  if (lastData !== data) {
    setLastData(data);
    const fresh = structuredClone(data.settings);
    setSettings(fresh);
    originalRef.current = JSON.stringify(fresh);
    setMsg(null);
  }

  const dirty = JSON.stringify(settings) !== originalRef.current;
  const set = (value: Partial<SiteSettings>) => {
    setSettings((s) => ({ ...s, ...value }));
    setMsg(null);
  };

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await mutateSiteSettings(settings, token);
      originalRef.current = JSON.stringify(settings);
      setMsg("✅ Paramètres enregistrés.");
      refresh();
    } catch (e) {
      setMsg(`❌ ${e instanceof Error ? e.message : "Erreur."}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#98741b] dark:text-[#ffd100]">
          Configuration
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-[#171816] dark:text-[#f2f0ea]">
          Paramètres du site
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-black/55 dark:text-white/55">
          Identité, logo et coordonnées affichées dans le footer et la page Contact.
        </p>
      </div>

      <Panel title="Identité">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du site">
            <TextInput value={settings.siteName} onChange={(e) => set({ siteName: e.target.value })} />
          </Field>
          <Field label="Nom complet">
            <TextInput value={settings.siteFullName} onChange={(e) => set({ siteFullName: e.target.value })} />
          </Field>
          <ImageField label="Logo" value={settings.logoUrl} onChange={(v) => set({ logoUrl: v })} />
          <Field label="Texte alternatif du logo">
            <TextInput value={settings.logoAlt} onChange={(e) => set({ logoAlt: e.target.value })} />
          </Field>
        </div>
      </Panel>

      <div className="mt-6">
        <Panel title="Coordonnées">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Pays">
              <TextInput value={settings.country} onChange={(e) => set({ country: e.target.value })} />
            </Field>
            <Field label="Ville">
              <TextInput value={settings.city} onChange={(e) => set({ city: e.target.value })} />
            </Field>
            <Field label="Adresse courte">
              <TextInput value={settings.address} onChange={(e) => set({ address: e.target.value })} />
            </Field>
            <Field label="Adresse complète">
              <TextArea value={settings.addressFull} onChange={(e) => set({ addressFull: e.target.value })} />
            </Field>
            <Field label="Téléphone (affiché)">
              <TextInput value={settings.phoneDisplay} onChange={(e) => set({ phoneDisplay: e.target.value })} />
            </Field>
            <Field label="Téléphone (lien)" hint="Format tel:+261…">
              <TextInput value={settings.phoneLink} onChange={(e) => set({ phoneLink: e.target.value })} />
            </Field>
            <Field label="Email">
              <TextInput value={settings.email} onChange={(e) => set({ email: e.target.value })} />
            </Field>
            <Field label="Horaires (affichés)">
              <TextInput value={settings.hours} onChange={(e) => set({ hours: e.target.value })} />
            </Field>
            <Field label="Horaires courts">
              <TextInput value={settings.hoursShort} onChange={(e) => set({ hoursShort: e.target.value })} />
            </Field>
          </div>
        </Panel>
      </div>

      <SaveBar onSave={() => void save()} saving={saving} message={msg} dirty={dirty} />
    </div>
  );
}
