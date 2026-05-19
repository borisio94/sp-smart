/**
 * Variables d'environnement Sanity.
 * Renseignées dans `.env.local` (voir `.env.example`).
 */

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Variable d'environnement manquante : NEXT_PUBLIC_SANITY_DATASET",
);

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "Variable d'environnement manquante : NEXT_PUBLIC_SANITY_PROJECT_ID",
);

/** Jeton serveur (lecture du contenu en brouillon / écriture). Jamais côté client. */
export const readToken = process.env.SANITY_API_READ_TOKEN || "";

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage);
  }
  return v;
}
