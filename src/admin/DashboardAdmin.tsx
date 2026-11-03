/** Vue d'ensemble du dashboard (/admin). */
import type { SiteData } from "../lib/api";
import { AdminButton, Panel } from "./ui";

type AdminPageProps = { data: SiteData; refresh: () => void; token: string };

export default function DashboardAdmin({ data, refresh }: AdminPageProps) {
  const stats = [
    { label: "Motos", value: data.bikes.length, note: "au catalogue" },
    { label: "Produits", value: data.parts.length, note: "pièces & équipements" },
    { label: "Produits mis en avant", value: data.home.heroSlides.filter((s) => s.enabled).length, note: "sur l'accueil" },
    { label: "Revendeurs", value: data.dealers.length, note: "adresses actives" },
    { label: "Marques", value: data.brands.length, note: "partenaires" },
    { label: "Nouveautés", value: data.home.nouveautes.items.length, note: "cartes à l'accueil" },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#98741b] dark:text-[#ffd100]">
            Dashboard Funbike
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-[#171816] dark:text-[#f2f0ea]">
            Tableau de bord
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/55 dark:text-white/55">
            Gérez le contenu du site : l'accueil, le catalogue et le réseau de revendeurs.
            Chaque modification est visible immédiatement sur le site public.
          </p>
        </div>
        <AdminButton variant="ghost" onClick={refresh}>
          Actualiser
        </AdminButton>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-[#191a17]"
          >
            <p className="font-display text-3xl font-semibold text-[#171816] dark:text-[#f2f0ea]">{s.value}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.1em] text-black/55 dark:text-white/55">
              {s.label}
            </p>
            <p className="text-[10px] text-black/35 dark:text-white/35">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Accueil — produits mis en avant" description="Le carrousel du haut du site et la grille « Motos ».">
          <ul className="space-y-2">
            {data.home.heroSlides.map((slide) => (
              <li key={slide.id} className="flex items-center gap-3 rounded-xl border border-black/8 p-2.5 dark:border-white/8">
                <img src={slide.image} alt="" className="h-11 w-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#171816] dark:text-[#f2f0ea]">{slide.short}</p>
                  <p className="text-[11px] text-black/45 dark:text-white/45">{slide.brand}</p>
                </div>
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] " +
                    (slide.enabled
                      ? "bg-[#ffd100]/20 text-[#98741b] dark:text-[#ffd100]"
                      : "bg-black/5 text-black/40 dark:bg-white/10 dark:text-white/40")
                  }
                >
                  {slide.enabled ? "Affiché" : "Masqué"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Raccourcis" description="Accès rapides aux sections du dashboard.">
          <div className="grid grid-cols-2 gap-3">
            <AdminButton onClick={() => window.location.assign("/admin/accueil")}>Modifier l'accueil</AdminButton>
            <AdminButton variant="ghost" onClick={() => window.location.assign("/admin/motos")}>
              Gérer les motos
            </AdminButton>
            <AdminButton variant="ghost" onClick={() => window.location.assign("/admin/produits")}>
              Gérer les produits
            </AdminButton>
            <AdminButton variant="ghost" onClick={() => window.location.assign("/admin/parametres")}>
              Paramètres du site
            </AdminButton>
          </div>
        </Panel>
      </div>
    </div>
  );
}
