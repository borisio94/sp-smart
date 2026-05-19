/**
 * Liste des liens de navigation principaux (hors méga-menu services).
 * Les libellés sont des clés de traduction du namespace "Nav".
 */
export const MAIN_LINKS = [
  { key: "home", href: "/" },
  { key: "realisations", href: "/realisations" },
  { key: "promotions", href: "/promotions" },
  { key: "blog", href: "/blog" },
  { key: "about", href: "/a-propos" },
  { key: "contact", href: "/contact" },
] as const;

export type ServiceLink = {
  id: string;
  title: string;
  slug: string;
  icon?: string;
};
