/**
 * Sélection de la bonne langue dans un champ bilingue Sanity.
 * FR par défaut, repli sur EN (et inversement) si une langue manque.
 */
export type LocaleField = { fr?: string | null; en?: string | null } | null | undefined;

export function pickLocale(
  field: LocaleField,
  locale: string,
  fallback = "",
): string {
  if (!field) return fallback;
  if (locale === "en") return field.en || field.fr || fallback;
  return field.fr || field.en || fallback;
}

/**
 * Variante pour les champs de contenu riche (tableaux Portable Text).
 */
export function pickLocaleBlock<T>(
  field: { fr?: T[]; en?: T[] } | null | undefined,
  locale: string,
): T[] {
  if (!field) return [];
  if (locale === "en") return field.en ?? field.fr ?? [];
  return field.fr ?? field.en ?? [];
}
