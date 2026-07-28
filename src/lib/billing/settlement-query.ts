import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildSettlement, type Settlement } from "./settlement";

/**
 * Lit en base le suivi du marché d'un document (cf. `settlement.ts`).
 *
 * Clé service role : le rendu PDF sert aussi bien la fiche admin que le lien
 * privé du client, où aucune session n'existe. Seuls des agrégats en sortent.
 *
 * Renvoie null quand il n'y a rien à recouper : document sans cotation de
 * rattachement (facture isolée, devis, rapport…) ou cotation introuvable.
 */
export async function getSettlement(
  documentId: string,
): Promise<Settlement | null> {
  const admin = createSupabaseAdminClient();

  const { data: doc } = await admin
    .from("documents")
    .select("id, type, linked_document_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return null;

  // Un reçu pointe vers sa facture : on remonte d'un cran pour trouver la
  // cotation, sinon le reçu n'aurait aucun suivi de marché.
  let quotationId: string | null = doc.linked_document_id;
  if (doc.type === "recu" && quotationId) {
    const { data: invoice } = await admin
      .from("documents")
      .select("linked_document_id")
      .eq("id", quotationId)
      .maybeSingle();
    quotationId = invoice?.linked_document_id ?? null;
  }
  if (!quotationId) return null;

  const { data: quotation } = await admin
    .from("documents")
    .select("id, number, total_amount")
    .eq("id", quotationId)
    .maybeSingle();
  if (!quotation) return null;

  // Factures rattachées au même marché (une annulée ne compte plus).
  const { data: invoices } = await admin
    .from("documents")
    .select("id, total_amount")
    .eq("linked_document_id", quotationId)
    .eq("type", "facture")
    .neq("status", "annule");

  const invoiceIds = (invoices ?? []).map((i) => i.id);
  const invoicedTotal = (invoices ?? []).reduce(
    (sum, i) => sum + (Number(i.total_amount) || 0),
    0,
  );

  let settledTotal = 0;
  if (invoiceIds.length > 0) {
    const { data: payments } = await admin
      .from("payments")
      .select("amount")
      .in("document_id", invoiceIds);
    settledTotal = (payments ?? []).reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );
  }

  return buildSettlement({
    quotationId: quotation.id,
    quotationNumber: quotation.number,
    marketTotal: quotation.total_amount,
    invoicedTotal,
    settledTotal,
  });
}
