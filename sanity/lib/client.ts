import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

/**
 * Sanity exige un projectId composé uniquement de [a-z0-9-].
 * Tant que `.env.local` contient le placeholder « A_REMPLIR » (invalide),
 * on utilise un identifiant factice valide pour éviter une erreur au
 * chargement du module. Aucun appel réseau réel n'est fait dans ce cas
 * (voir le garde-fou `isSanityConfigured` dans fetch.ts).
 */
const isValidProjectId = /^[a-z0-9-]+$/.test(projectId);
const safeProjectId = isValidProjectId ? projectId : "placeholder";

/**
 * Client Sanity en lecture seule pour le site public.
 * `useCdn: true` = réponses mises en cache (rapide, contenu publié).
 */
export const client = createClient({
  projectId: safeProjectId,
  dataset,
  apiVersion,
  // En production : CDN (rapide). En développement : lecture directe
  // pour voir immédiatement les changements de contenu.
  useCdn: process.env.NODE_ENV === "production",
  perspective: "published",
});
