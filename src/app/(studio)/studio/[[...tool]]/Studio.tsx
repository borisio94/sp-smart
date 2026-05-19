"use client";

/**
 * Composant client isolant le Sanity Studio.
 * Indispensable : la config Sanity utilise React.createContext et ne doit
 * pas être évaluée côté serveur (sinon erreur à la collecte des pages).
 */
import { NextStudio } from "next-sanity/studio";

import config from "../../../../../sanity.config";

export function Studio() {
  return <NextStudio config={config} />;
}
