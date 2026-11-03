/**
 * Briques UI du dashboard admin Funbike.
 * Styles sobres, accent jaune de la marque (#ffd100).
 */
import { useRef, useState, type ReactNode } from "react";
import { uploadImage, getAdminToken } from "../lib/api";

export const inputCls =
  "w-full rounded-lg border border-black/12 bg-white px-3 py-2.5 text-sm text-[#171816] outline-none transition placeholder:text-black/30 focus:border-[#ffd100] focus:ring-2 focus:ring-[#ffd100]/25 dark:border-white/12 dark:bg-[#1b1c19] dark:text-[#f2f0ea] dark:placeholder:text-white/25";

export const labelCls =
  "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-black/55 dark:text-white/55";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelCls}>{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] leading-4 text-black/40 dark:text-white/40">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputCls} min-h-24 resize-y leading-6 ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} cursor-pointer ${props.className ?? ""}`} />;
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="inline-flex items-center gap-2.5 text-sm text-[#171816] dark:text-[#f2f0ea]"
    >
      <span
        className={
          "relative h-6 w-11 rounded-full transition " +
          (checked ? "bg-[#ffd100]" : "bg-black/15 dark:bg-white/20")
        }
      >
        <span
          className={
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " +
            (checked ? "left-[22px]" : "left-0.5")
          }
        />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-black/60 dark:text-white/60">{label}</span>
    </button>
  );
}

export function AdminButton({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "dark";
}) {
  const styles = {
    primary:
      "bg-[#ffd100] text-[#171816] hover:bg-[#ffe36b] disabled:opacity-50",
    dark: "bg-[#171816] text-white hover:bg-black/80 disabled:opacity-50 dark:bg-[#f2f0ea] dark:text-[#171816]",
    ghost:
      "border border-black/12 text-[#171816] hover:border-[#ffd100] hover:text-[#98741b] disabled:opacity-50 dark:border-white/15 dark:text-[#f2f0ea] dark:hover:text-[#ffd100]",
    danger:
      "border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/30",
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition active:scale-[0.98] ${styles[variant]} ${props.className ?? ""}`}
    />
  );
}

export function Panel({
  title,
  description,
  children,
  right,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-[#191a17]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-black/8 pb-4 dark:border-white/8">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-[-0.03em] text-[#171816] dark:text-[#f2f0ea]">
            {title}
          </h2>
          {description && (
            <p className="mt-1 max-w-2xl text-xs leading-5 text-black/50 dark:text-white/50">{description}</p>
          )}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** Champ image : URL + upload + aperçu. */
export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const token = getAdminToken();
      if (!token) throw new Error("Session expirée — reconnectez-vous.");
      const url = await uploadImage(file, token);
      onChange(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="min-w-[90px]">
          {value ? (
            <img
              src={value}
              alt=""
              className="h-14 w-20 rounded-lg border border-black/10 bg-white object-contain dark:border-white/10 dark:bg-white/5"
            />
          ) : (
            <div className="grid h-14 w-20 place-items-center rounded-lg border border-dashed border-black/15 text-[9px] text-black/35 dark:border-white/15 dark:text-white/35">
              Aperçu
            </div>
          )}
        </div>
        <TextInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… ou /uploads/…"
          className="min-w-[180px] flex-1"
        />
        <AdminButton type="button" variant="ghost" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? "Envoi…" : "Téléverser"}
        </AdminButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {err && <span className="mt-1 block text-[11px] text-red-600 dark:text-red-400">{err}</span>}
    </Field>
  );
}

/** Barre d'enregistrement collante. */
export function SaveBar({
  onSave,
  saving,
  message,
  dirty,
}: {
  onSave: () => void;
  saving: boolean;
  message: string | null;
  dirty: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-black/10 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 dark:border-white/10 dark:bg-[#191a17]/95">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-semibold text-black/50 dark:text-white/50">
          {message ??
            (dirty
              ? "Modifications non enregistrées."
              : "Tout est à jour — les changements apparaissent aussitôt sur le site.")}
        </p>
        <AdminButton onClick={onSave} disabled={saving || !dirty}>
          {saving ? "Enregistrement…" : "Enregistrer les modifications"}
        </AdminButton>
      </div>
    </div>
  );
}

/** Liste réordonnable générique (haut / bas / supprimer). */
export function ListControls({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <AdminButton type="button" variant="ghost" className="!min-h-8 !px-2.5" onClick={() => onMove(-1)} disabled={index === 0}>
        ↑
      </AdminButton>
      <AdminButton
        type="button"
        variant="ghost"
        className="!min-h-8 !px-2.5"
        onClick={() => onMove(1)}
        disabled={index >= count - 1}
      >
        ↓
      </AdminButton>
      <AdminButton type="button" variant="danger" className="!min-h-8 !px-2.5" onClick={onRemove}>
        Supprimer
      </AdminButton>
    </div>
  );
}
