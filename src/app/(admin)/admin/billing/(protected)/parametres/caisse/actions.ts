"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import {
  cashSettingsSchema,
  expenseCategorySchema,
  type CashSettingsInput,
} from "@/lib/billing/validation";
import type { ExpenseCategory } from "@/lib/billing/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/** Met à jour les réglages de caisse (fonds initial + ligne rouge). */
export async function updateCashSettings(
  values: CashSettingsInput,
): Promise<ActionResult> {
  const parsed = cashSettingsSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { error } = await supabase.from("cash_settings").upsert(
    {
      organization_id: profile.organization_id,
      opening_balance: Math.round(v.opening_balance),
      red_line: Math.round(v.red_line),
      opening_note: nz(v.opening_note),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/parametres/caisse");
  revalidatePath("/admin/billing/caisse");
  return { ok: true };
}

export type CreateExpenseCategoryResult =
  | { ok: true; category: ExpenseCategory }
  | { ok: false; error: string };

/**
 * Crée une catégorie de dépense (depuis les réglages OU en création rapide
 * dans le formulaire de dépense). Renvoie l'objet créé pour la sélection.
 */
export async function createExpenseCategory(
  name: string,
): Promise<CreateExpenseCategoryResult> {
  const parsed = expenseCategorySchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Nom invalide." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("expense_categories")
    .select("id", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("expense_categories")
    .insert({
      organization_id: profile.organization_id,
      name: parsed.data.name,
      order: (count ?? 0) + 1,
      active: true,
    })
    .select("*")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/parametres/caisse");
  revalidatePath("/admin/billing/caisse/nouveau");
  return { ok: true, category: data as ExpenseCategory };
}

/** Active ou désactive une catégorie de dépense. */
export async function toggleExpenseCategory(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("expense_categories")
    .update({ active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/parametres/caisse");
  return { ok: true };
}

/**
 * Supprime une catégorie de dépense. Les mouvements qui l'utilisaient voient
 * leur `category_id` mis à NULL (ON DELETE SET NULL) : ils sont conservés.
 */
export async function deleteExpenseCategory(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expense_categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/billing/parametres/caisse");
  return { ok: true };
}
