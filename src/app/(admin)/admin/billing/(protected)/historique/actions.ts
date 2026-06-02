"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import { historicalSchema, type HistoricalInput } from "@/lib/billing/validation";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Enregistre un document historique (antérieur au site) avec is_historical=true.
 * Numéro manuel possible (reproduit les anciens numéros). Si le statut est
 * « terminé », le trigger DB incrémente automatiquement category_stats.
 */
export async function createHistoricalDocument(
  values: HistoricalInput,
): Promise<ActionResult> {
  const parsed = historicalSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      organization_id: profile.organization_id,
      created_by: profile.id,
      client_id: v.client_id,
      category_id: nz(v.category_id),
      type: v.type,
      number: nz(v.number), // si fourni, le trigger respecte le numéro manuel
      issue_date: v.issue_date,
      title: nz(v.title),
      body_mode: "text",
      total_amount: Math.round(v.total_amount),
      status: v.status,
      payment_status: v.payment_status,
      is_historical: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/billing/historique");
  revalidatePath("/admin/billing/documents");
  return { ok: true, id: data.id };
}
