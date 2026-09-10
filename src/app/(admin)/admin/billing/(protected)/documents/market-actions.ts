"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import { getMarketOverview } from "@/lib/billing/queries";
import { checkPayout } from "@/lib/billing/market";
import {
  marketExpenseSchema,
  marketPayoutSchema,
  maintenanceContractSchema,
  type MarketExpenseInput,
  type MarketPayoutInput,
  type MaintenanceContractInput,
} from "@/lib/billing/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Résultat d'un versement en caisse : `needsConfirm` signale que le montant
 * dépasse le disponible du marché — le client réaffiche un avertissement
 * chiffré et renvoie l'opération avec `confirmed: true` pour la forcer.
 * Même mécanique que le franchissement de la ligne rouge en caisse.
 */
export type PayoutResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      needsConfirm?: boolean;
      available?: number;
      remaining?: number;
    };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/** Rafraîchit la fiche du marché et la caisse, qu'un versement peut modifier. */
function revalidateMarket(documentId: string): void {
  revalidatePath(`/admin/billing/documents/${documentId}`);
  revalidatePath("/admin/billing/caisse");
}

/** Ajoute une charge à un marché (raison obligatoire). */
export async function createMarketExpense(
  documentId: string,
  values: MarketExpenseInput,
): Promise<ActionResult> {
  const parsed = marketExpenseSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { error } = await supabase.from("market_expenses").insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    document_id: documentId,
    reason: v.reason.trim(),
    phase: v.phase,
    amount: Math.round(v.amount),
    occurred_at: v.occurred_at,
  });
  if (error) return { ok: false, error: error.message };

  revalidateMarket(documentId);
  return { ok: true };
}

/** Modifie une charge existante. */
export async function updateMarketExpense(
  id: string,
  documentId: string,
  values: MarketExpenseInput,
): Promise<ActionResult> {
  const parsed = marketExpenseSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { error } = await supabase
    .from("market_expenses")
    .update({
      reason: v.reason.trim(),
      phase: v.phase,
      amount: Math.round(v.amount),
      occurred_at: v.occurred_at,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateMarket(documentId);
  return { ok: true };
}

/** Supprime une charge. */
export async function deleteMarketExpense(
  id: string,
  documentId: string,
): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("market_expenses").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateMarket(documentId);
  return { ok: true };
}

/**
 * Verse en caisse le net d'un marché.
 *
 * Le plafond est le DISPONIBLE (encaissé − charges − déjà versé), jamais la
 * marge : tant que le client n'a versé qu'un acompte, le reste du marché
 * n'existe pas encore en trésorerie. Le dépassement reste possible après
 * confirmation explicite (avance de fonds, correction).
 *
 * Le mouvement créé porte `source = 'marche'` et pointe la cotation : c'est ce
 * couple qui permet de retrouver les versements d'un marché.
 */
export async function payMarketToCash(
  documentId: string,
  values: MarketPayoutInput,
): Promise<PayoutResult> {
  const parsed = marketPayoutSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;
  const amount = Math.round(v.amount);

  const overview = await getMarketOverview(documentId);
  if (!overview) return { ok: false, error: "Marché introuvable." };

  const check = checkPayout(amount, overview);
  if (!check.withinAvailable && !v.confirmed) {
    return {
      ok: false,
      error: "Le versement dépasse le disponible du marché.",
      needsConfirm: true,
      available: overview.available,
      remaining: overview.remainingToPayOut,
    };
  }

  const { error } = await supabase.from("cash_movements").insert({
    organization_id: profile.organization_id,
    created_by: profile.id,
    direction: "in",
    amount,
    occurred_at: v.occurred_at,
    description: "Versement du marché",
    document_id: documentId,
    source: "marche",
    method: nz(v.method),
    reference: nz(v.reference),
  });
  if (error) return { ok: false, error: error.message };

  revalidateMarket(documentId);
  return { ok: true };
}

/**
 * Crée ou met à jour le contrat de maintenance d'un chantier.
 *
 * Un seul contrat par marché (`document_id` est la clé primaire) : renouveler
 * consiste à repousser l'échéance, jamais à empiler une seconde ligne. Le
 * `upsert` traduit exactement cette règle — première activation et
 * modification suivent le même chemin.
 *
 * Désactiver conserve la ligne : l'historique du contrat (dates, montant)
 * reste consultable, et le réactiver ne demande pas de tout ressaisir.
 */
export async function saveMaintenanceContract(
  documentId: string,
  values: MaintenanceContractInput,
): Promise<ActionResult> {
  const parsed = maintenanceContractSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { error } = await supabase.from("maintenance_contracts").upsert(
    {
      document_id: documentId,
      organization_id: profile.organization_id,
      active: v.active,
      start_date: nz(v.start_date),
      end_date: nz(v.end_date),
      amount: Math.round(v.amount),
      periodicity: v.periodicity,
      notes: nz(v.notes),
    },
    { onConflict: "document_id" },
  );
  if (error) return { ok: false, error: error.message };

  revalidateMarket(documentId);
  return { ok: true };
}
