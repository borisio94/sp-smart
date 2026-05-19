import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";

const isValidProjectId = /^[a-z0-9-]+$/.test(projectId);
const safeProjectId = isValidProjectId ? projectId : "placeholder";

/** Vrai si l'écriture Sanity est réellement configurée. */
export const canWriteToSanity =
  isValidProjectId && Boolean(writeToken) && writeToken !== "A_REMPLIR";

const writeClient = createClient({
  projectId: safeProjectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: writeToken,
});

/**
 * Crée un document dans Sanity de façon tolérante : si l'écriture n'est
 * pas configurée (token manquant) ou échoue, on log et on renvoie false
 * sans faire planter le formulaire.
 */
export async function createSanityDocument(
  doc: Record<string, unknown> & { _type: string },
): Promise<boolean> {
  if (!canWriteToSanity) {
    console.warn(
      "[Sanity] Écriture non configurée (SANITY_API_WRITE_TOKEN). Document non enregistré :",
      doc._type,
    );
    return false;
  }
  try {
    await writeClient.create(doc);
    return true;
  } catch (error) {
    console.error("[Sanity] Échec de création du document :", error);
    return false;
  }
}
