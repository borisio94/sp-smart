import type { LucideIcon } from "lucide-react";
import {
  Home,
  LayoutGrid,
  Star,
  BadgePercent,
  Newspaper,
  Info,
  Phone,
} from "lucide-react";

/**
 * Liste des liens de navigation principaux (hors méga-menu services).
 * Les libellés sont des clés de traduction du namespace "Nav".
 * `icon` est utilisé par le menu mobile.
 */
export const MAIN_LINKS: { key: string; href: string; icon: LucideIcon }[] = [
  { key: "home", href: "/", icon: Home },
  { key: "realisations", href: "/realisations", icon: Star },
  { key: "promotions", href: "/promotions", icon: BadgePercent },
  { key: "blog", href: "/blog", icon: Newspaper },
  { key: "about", href: "/a-propos", icon: Info },
  { key: "contact", href: "/contact", icon: Phone },
];

/** Icône de la section Services (réutilisée dans le menu mobile). */
export const SERVICES_ICON: LucideIcon = LayoutGrid;

export type ServiceLink = {
  id: string;
  title: string;
  slug: string;
  icon?: string;
};
