/**
 * Dashboard admin Funbike — accessible sur /admin (même serveur que le site).
 *
 * Permet de modifier l'accueil (textes + produits mis en avant), le catalogue
 * (motos, pièces, équipements), les revendeurs et les paramètres du site.
 * Les modifications sont écrites dans le backend GraphQL et apparaissent
 * aussitôt sur le site public.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  adminLogin,
  clearAdminSession,
  fetchSiteData,
  getAdminToken,
  getAdminUser,
  type SiteData,
} from "../lib/api";
import { FALLBACK_LOGO } from "../lib/constants";
import { AdminButton, inputCls, labelCls } from "./ui";
import DashboardAdmin from "./DashboardAdmin";
import AccueilEditor from "./AccueilEditor";
import MotosAdmin from "./MotosAdmin";
import ProduitsAdmin from "./ProduitsAdmin";
import RevendeursAdmin from "./RevendeursAdmin";
import ParametresAdmin from "./ParametresAdmin";

const SECTIONS = [
  { key: "", label: "Tableau de bord", icon: "▦" },
  { key: "accueil", label: "Accueil", icon: "★" },
  { key: "motos", label: "Motos", icon: "🏍" },
  { key: "produits", label: "Produits", icon: "⚙" },
  { key: "revendeurs", label: "Revendeurs", icon: "⌖" },
  { key: "parametres", label: "Paramètres", icon: "⚑" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function currentSection(): SectionKey {
  const path = window.location.pathname.replace(/\/+$/, "");
  const rest = path.replace(/^\/admin\/?/, "");
  return (SECTIONS.some((s) => s.key === rest) ? rest : "") as SectionKey;
}

/* ------------------------------------------------------------------ */
/*  Connexion                                                          */
/* ------------------------------------------------------------------ */

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const token = await adminLogin(username, password);
      onLogin(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#141513] px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-7 shadow-2xl">
        <img src={FALLBACK_LOGO} alt="Funbike" className="mx-auto h-11 w-auto object-contain" />
        <h1 className="mt-5 text-center font-display text-xl font-semibold tracking-[-0.03em] text-[#171816]">
          Dashboard Funbike
        </h1>
        <p className="mt-1.5 text-center text-xs text-black/50">
          Connectez-vous pour gérer le contenu du site.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className={labelCls}>Utilisateur</span>
            <input
              className={inputCls}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className={labelCls}>Mot de passe</span>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        </div>

        {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-[#ffd100] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#171816] transition hover:bg-[#ffe36b] disabled:opacity-50"
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>

        <p className="mt-4 text-center text-[10px] text-black/35">
          Identifiants par défaut : admin / funbike2026 (à changer via les variables d'environnement).
        </p>
        <a
          href="/"
          className="mt-3 block text-center text-[11px] font-bold uppercase tracking-[0.12em] text-black/45 hover:text-[#98741b]"
        >
          ← Retour au site
        </a>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Coque admin                                                        */
/* ------------------------------------------------------------------ */

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [section, setSection] = useState<SectionKey>(() => currentSection());
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useCallback((key: SectionKey) => {
    const path = key ? `/admin/${key}` : "/admin";
    window.history.pushState({}, "", path);
    setSection(key);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onPop = () => setSection(currentSection());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const site = await fetchSiteData();
      setData(site);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const page = useMemo<ReactNode>(() => {
    if (!data || !token) return null;
    const props = { data, refresh: () => void refresh(), token };
    switch (section) {
      case "accueil":
        return <AccueilEditor key="accueil" {...props} />;
      case "motos":
        return <MotosAdmin key="motos" {...props} />;
      case "produits":
        return <ProduitsAdmin key="produits" {...props} />;
      case "revendeurs":
        return <RevendeursAdmin key="revendeurs" {...props} />;
      case "parametres":
        return <ParametresAdmin key="parametres" {...props} />;
      default:
        return <DashboardAdmin key="dashboard" {...props} />;
    }
  }, [data, token, section, refresh]);

  if (!token) {
    return (
      <LoginScreen
        onLogin={(t) => {
          setToken(t);
          void refresh();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f5f2] text-[#171816] dark:bg-[#121310] dark:text-[#f2f0ea]">
      <div className="mx-auto flex min-h-screen max-w-[1400px]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-black/10 bg-[#171816] px-4 py-6 text-white lg:flex dark:border-white/10">
          <button onClick={() => navigate("")} className="flex items-center gap-2.5 px-2 text-left">
            <img src={FALLBACK_LOGO} alt="" className="h-8 w-auto object-contain" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd100]">Funbike</p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-white/45">Dashboard</p>
            </div>
          </button>

          <nav className="mt-8 space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => navigate(s.key)}
                className={
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold transition " +
                  (section === s.key
                    ? "bg-[#ffd100] text-[#171816]"
                    : "text-white/70 hover:bg-white/10 hover:text-white")
                }
              >
                <span className="w-4 text-center">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
            <a
              href="/"
              className="block rounded-lg px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 transition hover:text-[#ffd100]"
            >
              ↗ Voir le site
            </a>
            <button
              onClick={() => {
                clearAdminSession();
                setToken(null);
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-white/45 transition hover:text-white"
            >
              ⎋ Se déconnecter
            </button>
            <p className="px-3 text-[9px] uppercase tracking-[0.12em] text-white/30">
              Connecté : {getAdminUser() ?? "admin"}
            </p>
          </div>
        </aside>

        {/* Contenu */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Barre mobile */}
          <div className="flex items-center gap-2 overflow-x-auto border-b border-black/10 bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-[#191a17]">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => navigate(s.key)}
                className={
                  "shrink-0 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] transition " +
                  (section === s.key
                    ? "bg-[#ffd100] text-[#171816]"
                    : "text-black/55 hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10")
                }
              >
                {s.label}
              </button>
            ))}
          </div>

          <main className="flex-1 px-4 py-7 sm:px-8">
            {loading && (
              <p className="py-16 text-center text-sm text-black/45 dark:text-white/45">Chargement du dashboard…</p>
            )}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                {error}{" "}
                <AdminButton variant="ghost" className="ml-2" onClick={() => void refresh()}>
                  Réessayer
                </AdminButton>
              </div>
            )}
            {!loading && !error && page}
          </main>
        </div>
      </div>
    </div>
  );
}
