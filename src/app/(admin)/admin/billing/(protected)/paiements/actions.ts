"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/billing/auth";
import { paymentSchema, type PaymentInput } from "@/lib/billing/validation";
import {
  canReceivePayment,
  computePaymentStatus,
  sumPayments,
} from "@/lib/billing/payments";
import type { Payment } from "@/lib/billing/types";

export type ActionResult =
  | { ok: true; receiptId?: string }
  | { ok: false; error: string };

function nz(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
}

/**
 * Recalcule et persiste le statut de paiement d'une facture à partir de
 * l'ensemble de ses paiements. Renvoie le total payé et le total dû.
 */
async function recomputePaymentStatus(documentId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: payments }, { data: doc }] = await Promise.all([
    supabase.from("payments").select("amount").eq("document_id", documentId),
    supabase.from("documents").select("total_amount").eq("id", documentId).maybeSingle(),
  ]);

  const list = (payments as Pick<Payment, "amount">[] | null) ?? [];
  const total = Number(doc?.total_amount ?? 0);
  const status = computePaymentStatus(list, total);

  await supabase.from("documents").update({ payment_status: status }).eq("id", documentId);

  return { status, paid: sumPayments(list), total };
}

/**
 * Enregistre un paiement sur une facture, recalcule le statut de paiement,
 * et génère automatiquement un reçu lié si la facture devient soldée.
 */
export async function recordPayment(
  documentId: string,
  values: PaymentInput,
): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const profile = await requireProfile();
  const supabase = await createSupabaseServerClient();
  const v = parsed.data;

  // Vérifie que le document existe, est une facture, et récupère le contexte.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, type, status, total_amount, client_id, category_id, payment_status")
    .eq("id", documentId)
    .maybeSingle();

  if (!doc) return { ok: false, error: "Document introuvable." };
  if (!canReceivePayment(doc.type, doc.status)) {
    return {
      ok: false,
      error: "Ce document doit d'abord être confirmé pour recevoir un paiement.",
    };
  }

  const { error: insertError } = await supabase.from("payments").insert({
    document_id: documentId,
    amount: Math.round(v.amount),
    method: v.method,
    reference: nz(v.reference),
    received_at: v.received_at,
    recorded_by: profile.id,
    notes: nz(v.notes),
  });
  if (insertError) return { ok: false, error: insertError.message };

  const { status } = await recomputePaymentStatus(documentId);

  revalidatePath("/admin/billing/paiements");
  revalidatePath(`/admin/billing/documents/${documentId}`);
  // Le paiement a généré une entrée en caisse (trigger DB) → rafraîchir la caisse.
  revalidatePath("/admin/billing/caisse");

  // Génération automatique d'un reçu quand la facture devient soldée
  // (et qu'aucun reçu n'a déjà été émis pour cette facture).
  let receiptId: string | undefined;
  if (status === "paye_total") {
    const { data: existingReceipt } = await supabase
      .from("documents")
      .select("id")
      .eq("type", "recu")
      .eq("linked_document_id", documentId)
      .maybeSingle();

    if (!existingReceipt) {
      const { data: receipt } = await supabase
        .from("documents")
        .insert({
          organization_id: profile.organization_id,
          created_by: profile.id,
          client_id: doc.client_id,
          category_id: doc.category_id,
          type: "recu",
          issue_date: v.received_at,
          title: "Reçu de paiement",
          subject: "Règlement intégral du document",
          body_mode: "text",
          body_text: "Reçu généré automatiquement au paiement intégral du document.",
          materials_subtotal: 0,
          labor_amount: 0,
          discount_amount: 0,
          total_amount: doc.total_amount,
          status: "termine",
          payment_status: "paye_total",
          linked_document_id: documentId,
        })
        .select("id")
        .single();
      receiptId = receipt?.id;
      if (receiptId) revalidatePath("/admin/billing/documents");
    }
  }

  return { ok: true, receiptId };
}

/** Supprime un paiement et recalcule le statut de paiement de la facture. */
export async function deletePayment(
  paymentId: string,
  documentId: string,
): Promise<ActionResult> {
  await requireProfile();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) return { ok: false, error: error.message };

  await recomputePaymentStatus(documentId);
  revalidatePath("/admin/billing/paiements");
  revalidatePath(`/admin/billing/documents/${documentId}`);
  // Le mouvement de caisse lié a été supprimé en cascade → rafraîchir la caisse.
  revalidatePath("/admin/billing/caisse");
  return { ok: true };
}
