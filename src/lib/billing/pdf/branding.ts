import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Télécharge un fichier d'un bucket privé et le convertit en Data URI base64
 * (utilisable par <Image src> de react-pdf). Renvoie null si absent.
 */
export async function fetchStorageDataUri(
  bucket: string,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from(bucket).download(path);
    if (error || !data) return null;

    const buffer = Buffer.from(await data.arrayBuffer());
    // Devine le type MIME depuis l'extension
    const ext = path.split(".").pop()?.toLowerCase();
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Élément d'identité visuelle de l'organisation (logo, signature, cachet).
 * `path` est le chemin stocké dans organizations (ex. "logo.png").
 */
export function fetchBrandingDataUri(
  path: string | null | undefined,
): Promise<string | null> {
  return fetchStorageDataUri("branding", path);
}

/** Tracé de signature apposé par un client sur son lien privé. */
export function fetchClientSignatureDataUri(
  path: string | null | undefined,
): Promise<string | null> {
  return fetchStorageDataUri("signatures", path);
}
