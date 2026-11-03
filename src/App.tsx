import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Footer, Header, type Route } from "./components/Layout";
import CatChat from "./components/CatChat";
import CookieConsent, { readConsent } from "./components/CookieConsent";
import { RouteProgress, SplashLoader } from "./components/Loaders";
import Home from "./pages/Home";
import { Catalogue, Equipements, Spares } from "./pages/Catalog";
import Product from "./pages/Product";
import AccessoryDetail from "./pages/AccessoryDetail";
import Contact from "./pages/Contact";
import Dealers from "./pages/Dealers";
import { SiteProvider, useSite } from "./lib/store";
import { findBike, findPart } from "./lib/catalog";
import AdminApp from "./admin/AdminApp";

function sameRoute(a: Route, b: Route) {
  return a.page === b.page && (a.id ?? "") === (b.id ?? "");
}

function routeLabel(route: Route): string {
  switch (route.page) {
    case "home":
      return "Accueil";
    case "catalogue":
      return "Catalogue";
    case "motos":
      return "Motos";
    case "equipements":
      return "Équipements";
    case "spares":
      return "Pièces détachées";
    case "product": {
      const bike = findBike(route.id);
      return bike ? bike.name : "Fiche moto";
    }
    case "accessory": {
      const part = findPart(route.id);
      return part ? part.name : "Fiche produit";
    }
    case "revendeurs":
      return "Revendeurs";
    case "contact":
      return "Contact";
    default:
      return "Page précédente";
  }
}

/** Détecte /admin dans l'URL (le dashboard partage le même serveur de dev). */
function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(
    () => window.location.pathname.replace(/\/+$/, "").startsWith("/admin"),
  );
  useEffect(() => {
    const onPop = () =>
      setIsAdmin(window.location.pathname.replace(/\/+$/, "").startsWith("/admin"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return isAdmin;
}

function PublicSite() {
  const { data, loading, error, reload } = useSite();
  const [dark, setDark] = useState(
    () => localStorage.getItem("fb-theme") !== "light",
  );
  const [history, setHistory] = useState<Route[]>([{ page: "home" }]);
  const [booting, setBooting] = useState(true);
  const [cookieOpen, setCookieOpen] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const route = history[history.length - 1];
  const canGoBack = history.length > 1;
  const previousRoute = canGoBack ? history[history.length - 2] : null;
  const backLabel = useMemo(
    () => (previousRoute ? routeLabel(previousRoute) : "Accueil"),
    [previousRoute?.page, previousRoute?.id],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("fb-theme", dark ? "dark" : "light");
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", dark ? "#141513" : "#ffffff");
  }, [dark]);

  // Splash court : attend le chargement des données GraphQL (min 650 ms, max 2 s)
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => setBooting(false), 250);
    return () => window.clearTimeout(timer);
  }, [loading]);

  // Cookie banner appears once the splash is gone, only if no choice was saved
  useEffect(() => {
    if (booting || readConsent()) return;
    const timer = window.setTimeout(() => setCookieOpen(true), 500);
    return () => window.clearTimeout(timer);
  }, [booting]);

  const go = useCallback((page: string, id?: string) => {
    const next: Route = { page, id };
    setHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && sameRoute(last, next)) return prev;
      // Garde un historique raisonnable (50 dernières pages)
      const grown = [...prev, next];
      return grown.length > 50 ? grown.slice(grown.length - 50) : grown;
    });
    setProgressKey((k) => k + 1);
    // Retour en haut instantané : le défilement fluide se fait
    // interrompre par le changement de page et laisse l'utilisateur en bas.
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);

  // Sécurité : après chaque changement de page, forcer le haut
  // (les images qui chargent décalent la mise en page vers le bas).
  useEffect(() => {
    window.scrollTo(0, 0);
    const t = window.setTimeout(() => window.scrollTo(0, 0), 60);
    return () => window.clearTimeout(t);
  }, [route.page, route.id]);

  /** Retour réel : revient là où on était juste avant, jamais vers une page imposée. */
  const back = useCallback(
    (fallback: Route = { page: "home" }) => {
      let didGoBack = false;
      setHistory((prev) => {
        if (prev.length > 1) {
          didGoBack = true;
          return prev.slice(0, -1);
        }
        return prev;
      });
      // Si aucun historique, on va vers le fallback demandé
      if (!didGoBack) {
        setHistory((prev) => {
          const last = prev[prev.length - 1];
          if (last && sameRoute(last, fallback)) return prev;
          return [...prev, fallback];
        });
      }
      setProgressKey((k) => k + 1);
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    },
    [],
  );

  if (error && !loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-[#171816] dark:bg-[#141513] dark:text-[#f2f0ea]">
        <div className="max-w-md text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#98741b] dark:text-[#ffd100]">
            Funbike / Madagascar
          </p>
          <h1 className="mt-3 font-display text-2xl font-semibold">Impossible de charger le site</h1>
          <p className="mt-3 text-sm text-black/55 dark:text-white/55">
            Le serveur de données (API GraphQL) ne répond pas. Vérifiez qu'il est démarré, puis réessayez.
          </p>
          <p className="mt-2 break-all text-xs text-black/40 dark:text-white/40">{error}</p>
          <button
            onClick={reload}
            className="mt-6 bg-[#ffd100] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#171816] transition hover:bg-white"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Tant que les données GraphQL ne sont pas arrivées, on ne monte aucune page.
  if (!data) {
    return <SplashLoader show />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <SplashLoader show={booting} />
      {progressKey > 0 && <RouteProgress key={progressKey} />}

      <div className="min-h-screen bg-white text-[#171816] transition-colors duration-300 dark:bg-[#141513] dark:text-[#f2f0ea]">
        <Header route={route} go={go} dark={dark} toggle={() => setDark((d) => !d)} />
        <main>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${route.page}-${route.id ?? ""}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {route.page === "home" && <Home go={go} />}
              {route.page === "catalogue" && <Catalogue go={go} />}
              {route.page === "motos" && <Catalogue go={go} motosOnly initialQuery={route.id} />}
              {route.page === "equipements" && <Equipements go={go} initialBrand={route.id} />}
              {route.page === "spares" && <Spares go={go} initialBrand={route.id} />}
              {route.page === "product" && (
                <Product id={route.id} go={go} back={back} canGoBack={canGoBack} backLabel={backLabel} />
              )}
              {route.page === "accessory" && (
                <AccessoryDetail id={route.id} go={go} back={back} canGoBack={canGoBack} backLabel={backLabel} />
              )}
              {route.page === "revendeurs" && <Dealers go={go} initialCity={route.id} />}
              {route.page === "contact" && <Contact inquiryId={route.id} />}
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer go={go} onCookies={() => setCookieOpen(true)} />
        <CatChat go={go} hiddenOnMobile={cookieOpen} />
        <CookieConsent open={cookieOpen} onClose={() => setCookieOpen(false)} />
      </div>
    </MotionConfig>
  );
}

function Shell() {
  const isAdmin = useIsAdmin();
  return isAdmin ? <AdminApp /> : <PublicSite />;
}

export default function App() {
  return (
    <SiteProvider>
      <Shell />
    </SiteProvider>
  );
}
