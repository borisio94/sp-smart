import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildSettlement, type Settlement, type SettlementAdvance } from "./settlement";
import type { PaymentMethod } from "./types";

/**
 * Variante tolérante de `getSettlement` : ne lève jamais (clé service role
 * absente, base injoignable…). Utilisée par la page publique du lien privé, qui
 * doit rester affichable même sans ce détail.
 */
export async function tryGetSettlement(
  documentId: string,
): Promise<Settlement | null> {
  try {
    return await getSettlement(documentId);
  } catch {
    return null;
  }
}

/**
 * Lit en base le suivi du marché d'un document (cf. `settlement.ts`).
 *
 * Clé service role : le rendu PDF sert aussi bien la fiche admin que le lien
 * privé du client, où aucune session n'existe. Seuls des agrégats et le détail
 * des acomptes du marché en sortent.
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
    .select("id, total_amount, issue_date, invoice_data")
    .eq("linked_document_id", quotationId)
    .eq("type", "facture")
    .neq("status", "annule")
    .order("issue_date", { ascending: true });

  const rows =
    (invoices as
      | {
          id: string;
          total_amount: number;
          issue_date: string;
          invoice_data: { kind?: string } | null;
        }[]
      | null) ?? [];

  // Une facture définitive solde le marché : elle reprend le montant complet et
  // déduit les acomptes. L'additionner aux factures d'acompte compterait deux
  // fois le même chiffre d'affaires — dans ce cas elle seule fait foi.
  const finals = rows.filter((r) => r.invoice_data?.kind === "definitive");
  const counted = finals.length > 0 ? finals : rows;
  const invoicedTotal = counted.reduce(
    (sum, i) => sum + (Number(i.total_amount) || 0),
    0,
  );

  const invoiceIds = rows.map((i) => i.id);
  let settledTotal = 0;
  let advances: SettlementAdvance[] = [];
  if (invoiceIds.length > 0) {
    const { data: payments } = await admin
      .from("payments")
      .select("amount, received_at, method, reference")
      .in("document_id", invoiceIds)
      .order("received_at", { ascending: true })
      .order("created_at", { ascending: true });

    const list =
      (payments as
        | {
            amount: number;
            received_at: string;
            method: PaymentMethod | null;
            reference: string | null;
          }[]
        | null) ?? [];

    settledTotal = list.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    advances = list.map((p) => ({
      amount: Number(p.amount) || 0,
      date: p.received_at,
      method: p.method,
      reference: p.reference,
    }));
  }

  return buildSettlement({
    quotationId: quotation.id,
    quotationNumber: quotation.number,
    marketTotal: quotation.total_amount,
    invoicedTotal,
    settledTotal,
    advances,
    finalInvoiceId: finals[0]?.id ?? null,
  });
}
