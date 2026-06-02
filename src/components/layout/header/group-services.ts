import type { ServiceLink } from "./nav-links";

/**
 * Regroupe les services en 3 familles métier pour les menus de navigation.
 * Le rattachement se fait par mots-clés présents dans le slug (et, en repli,
 * dans le titre) — aucun champ Sanity requis. Les services non reconnus
 * tombent dans « other ».
 */
export type ServiceFamilyKey = "automation" | "security" | "energy" | "other";

/** Ordre d'affichage des familles. */
export const FAMILY_ORDER: ServiceFamilyKey[] = [
  "automation",
  "security",
  "energy",
  "other",
];

/** Mots-clés (dans le slug ou le titre) rattachant un service à une famille. */
const FAMILY_KEYWORDS: Record<Exclude<ServiceFamilyKey, "other">, string[]> = {
  automation: ["portail", "volet", "grille", "motoris", "automat"],
  security: [
    "video", "vidéo", "surveillance", "incendie", "intrusion", "alarme",
    "acces", "accès", "cloture", "clôture", "securite", "sécurité",
  ],
  energy: ["electric", "électric", "solaire", "solar", "energie", "énergie"],
};

/** Détermine la famille d'un service à partir de son slug/titre. */
function familyOf(service: ServiceLink): ServiceFamilyKey {
  const haystack = `${service.slug} ${service.title}`.toLowerCase();
  for (const family of ["automation", "security", "energy"] as const) {
    if (FAMILY_KEYWORDS[family].some((kw) => haystack.includes(kw))) {
      return family;
    }
  }
  return "other";
}

export interface ServiceGroup {
  key: ServiceFamilyKey;
  services: ServiceLink[];
}

/**
 * Renvoie les services regroupés par famille, dans l'ordre FAMILY_ORDER,
 * en ignorant les familles vides.
 */
export function groupServices(services: ServiceLink[]): ServiceGroup[] {
  const buckets = new Map<ServiceFamilyKey, ServiceLink[]>();
  for (const s of services) {
    const f = familyOf(s);
    if (!buckets.has(f)) buckets.set(f, []);
    buckets.get(f)!.push(s);
  }
  return FAMILY_ORDER.filter((k) => buckets.has(k)).map((key) => ({
    key,
    services: buckets.get(key)!,
  }));
}
