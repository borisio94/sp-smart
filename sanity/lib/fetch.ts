import { client } from "./client";
import { projectId } from "../env";

/**
 * Vrai uniquement si un vrai projet Sanity est configuré.
 * (Tant que `.env.local` contient « A_REMPLIR », on évite tout appel réseau.)
 */
export const isSanityConfigured =
  Boolean(projectId) && projectId !== "A_REMPLIR";

/**
 * Récupère des données depuis Sanity de façon tolérante aux pannes :
 * si Sanity n'est pas configuré ou si l'appel échoue, on renvoie
 * `fallback` au lieu de faire planter le site.
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: T,
): Promise<T> {
  if (!isSanityConfigured) return fallback;

  try {
    const data = await client.fetch<T>(query, params, {
      next: { revalidate: 60 },
    });
    return data ?? fallback;
  } catch (error) {
    console.error("[Sanity] Échec de la récupération des données :", error);
    return fallback;
  }
}
