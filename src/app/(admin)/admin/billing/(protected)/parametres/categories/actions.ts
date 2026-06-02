"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import { categorySchema, type CategoryInput } from "@/lib/billing/validation";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/** Crée une catégorie d'exécution. */
export async function createCategory(values: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Données invalides." };

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  // Place la nouvelle catégorie en fin de liste.
  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("categories")
    .insert({
      organization_id: profile.organization_id,
      slug: v.slug,
      name_fr: v.name_fr,
      name_en: v.name_en,
      lucide_icon: nz(v.lucide_icon),
      color: nz(v.color),
      order: (count ?? 0) + 1,
      active: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/parametres/categories");
  return { ok: true, id: data.id };
}

/** Active ou désactive une catégorie (sans la supprimer). */
export async function toggleCategory(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("categories")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/parametres/categories");
  return { ok: true };
}
