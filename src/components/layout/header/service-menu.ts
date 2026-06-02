import type { LucideIcon } from "lucide-react";
import {
  DoorOpen,
  MoveHorizontal,
  Blinds,
  Fence,
  ArrowBigUpDash,
  Shrink,
  Cctv,
  Flame,
  ShieldAlert,
  Zap,
  ScanFace,
  Plug,
  Sun,
} from "lucide-react";

import type { ServiceFamilyKey } from "./group-services";

/**
 * Taxonomie CURATÉE du menu des services : structure fixe et professionnelle,
 * indépendante des éventuels doublons du contenu Sanity. Chaque sous-branche
 * pointe vers le slug de la page service existante la plus proche (plusieurs
 * sous-branches peuvent mener à la même page). `labelKey` → Nav.serviceItems.
 */
export interface ServiceMenuItem {
  labelKey: string;
  slug: string;
  icon: LucideIcon;
}

export interface ServiceMenuFamily {
  family: ServiceFamilyKey;
  items: ServiceMenuItem[];
}

export const SERVICE_MENU: ServiceMenuFamily[] = [
  {
    family: "automation",
    items: [
      { labelKey: "gateSwing", slug: "portails-automatiques", icon: DoorOpen },
      { labelKey: "gateSliding", slug: "portails-automatiques", icon: MoveHorizontal },
      { labelKey: "shutters", slug: "volets-et-grilles", icon: Blinds },
      { labelKey: "grilles", slug: "volets-et-grilles", icon: Fence },
      { labelKey: "barrierLifting", slug: "automatisation-portails", icon: ArrowBigUpDash },
      { labelKey: "barrierRetractable", slug: "automatisation-portails", icon: Shrink },
    ],
  },
  {
    family: "security",
    items: [
      { labelKey: "videosurveillance", slug: "videosurveillance", icon: Cctv },
      { labelKey: "fire", slug: "securite-incendie", icon: Flame },
      { labelKey: "intrusion", slug: "anti-intrusion", icon: ShieldAlert },
      { labelKey: "electricFence", slug: "cloture-electrique", icon: Zap },
      { labelKey: "accessControl", slug: "controle-acces", icon: ScanFace },
    ],
  },
  {
    family: "energy",
    items: [
      { labelKey: "electricity", slug: "electricite-domestique", icon: Plug },
      { labelKey: "solar", slug: "systemes-solaires", icon: Sun },
    ],
  },
];

/**
 * Filtre la taxonomie pour ne garder que les sous-branches dont la page
 * service existe réellement (slugs publiés dans Sanity) → évite tout lien 404.
 * Si aucun slug n'est connu (Sanity vide), on renvoie la taxonomie complète
 * pour ne pas masquer le menu en développement.
 */
export function buildServiceMenu(existingSlugs: string[]): ServiceMenuFamily[] {
  if (existingSlugs.length === 0) return SERVICE_MENU;
  const known = new Set(existingSlugs);
  return SERVICE_MENU.map((f) => ({
    family: f.family,
    items: f.items.filter((i) => known.has(i.slug)),
  })).filter((f) => f.items.length > 0);
}
