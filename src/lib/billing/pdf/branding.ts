import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Télécharge un fichier du bucket privé `branding` et le convertit en Data URI
 * base64 (utilisable par <Image src> de react-pdf). Renvoie null si absent.
 * `path` est le chemin stocké dans organizations (ex. "logo.png").
 */
export async function fetchBrandingDataUri(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.storage.from("branding").download(path);
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
