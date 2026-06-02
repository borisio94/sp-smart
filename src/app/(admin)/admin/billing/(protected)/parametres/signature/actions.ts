"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Champ d'organisation correspondant à chaque type d'asset. */
type AssetKind = "logo" | "signature" | "stamp";
const FIELD: Record<AssetKind, "logo_url" | "signature_url" | "stamp_url"> = {
  logo: "logo_url",
  signature: "signature_url",
  stamp: "stamp_url",
};

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Téléverse une image de marque dans le bucket privé `branding` (clé service
 * role, serveur uniquement) et enregistre son chemin dans organizations.
 */
export async function uploadBrandingAsset(
  kind: AssetKind,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucun fichier fourni." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "Format non supporté (PNG, JPEG, WEBP ou SVG)." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Fichier trop volumineux (5 Mo max)." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  // Chemin scoupé par organisation : <orgId>/<kind>.<ext>
  const path = `${profile.organization_id}/${kind}.${ext}`;

  const admin = createSupabaseAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage
    .from("branding")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) return { ok: false, error: uploadError.message };

  // Enregistre le chemin (respecte la RLS via le client de session).
  const supabase = await createSupabaseServerClient();
  const { error: dbError } = await supabase
    .from("organizations")
    .update({ [FIELD[kind]]: path })
    .eq("id", profile.organization_id);

  if (dbError) return { ok: false, error: dbError.message };

  revalidatePath("/admin/billing/parametres/signature");
  return { ok: true };
}

/** Supprime une image de marque (oublie simplement la référence). */
export async function removeBrandingAsset(kind: AssetKind): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("organizations")
    .update({ [FIELD[kind]]: null })
    .eq("id", profile.organization_id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/parametres/signature");
  return { ok: true };
}
