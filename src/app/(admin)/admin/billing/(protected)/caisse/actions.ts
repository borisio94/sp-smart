"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import {
  expenseSchema,
  cashEntrySchema,
  type ExpenseInput,
  type CashEntryInput,
} from "@/lib/billing/validation";
import { getCashOverview } from "@/lib/billing/queries";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Résultat d'une dépense : `needsConfirm` signale que l'opération franchit la
 * ligne rouge — le client réaffiche alors un avertissement et renvoie la
 * dépense avec `confirmed: true` pour la forcer.
 */
export type ExpenseResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      needsConfirm?: boolean;
      projected?: number;
      redLine?: number;
    };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/** Enregistre une dépense (sortie de caisse). Description obligatoire. */
export async function createExpense(values: ExpenseInput): Promise<ExpenseResult> {
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;
  const amount = Math.round(v.amount);

  // Garde-fou ligne rouge : avertissement + confirmation explicite.
  const overview = await getCashOverview();
  const projected = overview.balance - amount;
  if (projected < overview.redLine && !v.confirmed) {
    return {
      ok: false,
      error: "La dépense franchit la ligne rouge.",
      needsConfirm: true,
      projected,
      redLine: overview.redLine,
    };
  }

  const { error } = await supabase.from("cash_movements").insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    direction: "out",
    amount,
    occurred_at: v.occurred_at,
    description: v.description.trim(),
    category_id: nz(v.category_id),
    method: nz(v.method),
    reference: nz(v.reference),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/caisse");
  return { ok: true };
}

/** Enregistre une entrée en caisse (liée à un document OU détaillée). */
export async function createEntry(values: CashEntryInput): Promise<ActionResult> {
  const parsed = cashEntrySchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { error } = await supabase.from("cash_movements").insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    direction: "in",
    amount: Math.round(v.amount),
    occurred_at: v.occurred_at,
    description: nz(v.description),
    document_id: nz(v.document_id),
    method: nz(v.method),
    reference: nz(v.reference),
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/caisse");
  return { ok: true };
}

/**
 * Supprime un mouvement de caisse SAISI MANUELLEMENT. Un mouvement issu d'un
 * paiement de facture (`payment_id` renseigné) ne peut pas être supprimé ici :
 * il faut supprimer le paiement depuis la facture (la suppression cascade).
 */
export async function deleteMovement(id: string): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { data: mv } = await supabase
    .from("cash_movements")
    .select("payment_id")
    .eq("id", id)
    .maybeSingle();

  if (mv && (mv as { payment_id: string | null }).payment_id) {
    return {
      ok: false,
      error:
        "Ce mouvement provient d'un paiement : supprimez le paiement depuis la facture.",
    };
  }

  const { error } = await supabase.from("cash_movements").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/caisse");
  return { ok: true };
}
