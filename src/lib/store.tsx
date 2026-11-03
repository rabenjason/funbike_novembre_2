/**
 * Store global du site : charge toutes les données depuis le backend GraphQL
 * au démarrage et les partage avec tous les composants.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchSiteData, type SiteData } from "./api";
import { setCatalog } from "./catalog";

interface SiteState {
  data: SiteData | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const SiteContext = createContext<SiteState>({
  data: null,
  loading: true,
  error: null,
  reload: () => undefined,
});

export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchSiteData()
      .then((site) => {
        if (!alive) return;
        setCatalog({ bikes: site.bikes, parts: site.parts, brands: site.brands });
        setData(site);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Impossible de charger les données du site.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo<SiteState>(
    () => ({ data, loading, error, reload }),
    [data, loading, error, reload],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteState {
  return useContext(SiteContext);
}

/** Accès direct aux données (échoue explicitement si non chargées). */
export function useSiteData(): SiteData {
  const { data, error } = useSite();
  if (!data) {
    throw new Error(error ?? "Données du site non chargées.");
  }
  return data;
}
