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

/** Translittère un libellé en slug (minuscules, sans accents, tirets). */
function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "") // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export type CreateCategoryQuickResult =
  | { ok: true; category: { id: string; name_fr: string } }
  | { ok: false; error: string };

/**
 * Création rapide d'une catégorie à partir d'un simple nom (depuis le
 * formulaire de document). Le slug et le nom EN sont déduits automatiquement.
 */
export async function createCategoryQuick(
  name: string,
): Promise<CreateCategoryQuickResult> {
  const clean = (name ?? "").trim();
  if (clean.length < 2) return { ok: false, error: "Nom de catégorie trop court." };

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  // Slug unique dans l'organisation (ajoute -2, -3… si déjà pris).
  const base = slugify(clean) || "categorie";
  const { data: existing } = await supabase.from("categories").select("slug");
  const taken = new Set((existing ?? []).map((c) => (c as { slug: string }).slug));
  let slug = base;
  let i = 2;
  while (taken.has(slug)) slug = `${base}-${i++}`;

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("categories")
    .insert({
      organization_id: profile.organization_id,
      slug,
      name_fr: clean,
      name_en: clean,
      lucide_icon: null,
      color: null,
      order: (count ?? 0) + 1,
      active: true,
    })
    .select("id, name_fr")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/documents/nouveau");
  return { ok: true, category: data as { id: string; name_fr: string } };
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
