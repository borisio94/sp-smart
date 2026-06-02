/**
 * Lecture centralisée et tolérante des variables d'environnement Supabase.
 * Tant que les clés valent « A_REMPLIR » (ou sont absentes), le module
 * billing est considéré comme non configuré : le site public continue de
 * fonctionner, seules les routes /admin nécessitent une config valide.
 */

const PLACEHOLDER = "A_REMPLIR";

function clean(value: string | undefined): string | undefined {
  if (!value || value.trim() === "" || value === PLACEHOLDER) return undefined;
  return value;
}

/** Renvoie les clés publiques (URL + anon) si elles sont réellement renseignées. */
export function getSupabaseEnv(): { url?: string; anonKey?: string } {
  return {
    url: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

/** `true` si l'URL et la clé anon sont présentes (config minimale). */
export function hasSupabaseEnv(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

/** Variante stricte : lève une erreur explicite si la config manque. */
export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    throw new Error(
      "Configuration Supabase manquante. Renseigne NEXT_PUBLIC_SUPABASE_URL et " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local (cf. ACTIONS_PHASE_1.md).",
    );
  }
  return { url, anonKey };
}

/** Clé service role (serveur uniquement — ne JAMAIS exposer au navigateur). */
export function requireServiceRoleKey(): string {
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante dans .env.local (serveur uniquement).",
    );
  }
  return key;
}
