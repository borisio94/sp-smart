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

/** Facture d'acompte telle que lue en base (le strict nécessaire). */
interface AdvanceInvoiceRow {
  id: string;
  number: string | null;
  total_amount: number;
  invoice_data: { kind?: string; advance_payment_id?: string | null } | null;
}

/**
 * Rattache chaque versement à la facture d'acompte qui le matérialise.
 *
 * Deux rapprochements, dans cet ordre :
 *  1. le lien explicite `advance_payment_id`, posé par `generateAdvanceInvoice`
 *     — c'est le cas normal ;
 *  2. à défaut, la facture d'acompte sur laquelle le versement est enregistré,
 *     si elle réclame exactement ce montant et n'est pas déjà prise. Sans ce
 *     repli, les factures d'acompte saisies à la main (avant ce lien, ou créées
 *     depuis le formulaire) se verraient proposer une seconde génération, qui
 *     compterait deux fois le même acompte dans la séquence du marché.
 */
function matchAdvanceInvoices(
  payments: { id: string; amount: number; document_id: string }[],
  invoices: AdvanceInvoiceRow[],
): Map<string, AdvanceInvoiceRow> {
  const byPayment = new Map<string, AdvanceInvoiceRow>();
  const taken = new Set<string>();

  for (const inv of invoices) {
    const paymentId = inv.invoice_data?.advance_payment_id;
    if (paymentId) {
      byPayment.set(paymentId, inv);
      taken.add(inv.id);
    }
  }

  for (const p of payments) {
    if (byPayment.has(p.id)) continue;
    const inv = invoices.find(
      (i) =>
        i.id === p.document_id &&
        !taken.has(i.id) &&
        Math.round(Number(i.total_amount) || 0) === Math.round(Number(p.amount) || 0),
    );
    if (inv) {
      byPayment.set(p.id, inv);
      taken.add(inv.id);
    }
  }

  return byPayment;
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
    .select("id, number, subject, title, total_amount")
    .eq("id", quotationId)
    .maybeSingle();
  if (!quotation) return null;

  // Factures rattachées au même marché (une annulée ne compte plus).
  const { data: invoices } = await admin
    .from("documents")
    .select("id, number, total_amount, issue_date, invoice_data, created_at")
    .eq("linked_document_id", quotationId)
    .eq("type", "facture")
    .neq("status", "annule")
    .order("issue_date", { ascending: true })
    .order("created_at", { ascending: true });

  const rows =
    (invoices as
      | {
          id: string;
          number: string | null;
          total_amount: number;
          issue_date: string;
          invoice_data: { kind?: string; advance_payment_id?: string | null } | null;
          created_at: string;
        }[]
      | null) ?? [];

  // Séquence des acomptes : leur ordre d'émission donne leur rang (n° 1, n° 2…)
  // et, par cumul, ce qui restait à verser avant chacun d'eux.
  const advanceRows = rows.filter((r) => r.invoice_data?.kind === "acompte");
  const advanceInvoices = advanceRows.map((r) => ({
    id: r.id,
    number: r.number,
    amount: Number(r.total_amount) || 0,
    issueDate: r.issue_date,
  }));

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
      .select("id, amount, received_at, method, reference, document_id")
      .in("document_id", invoiceIds)
      .order("received_at", { ascending: true })
      .order("created_at", { ascending: true });

    const list =
      (payments as
        | {
            id: string;
            amount: number;
            received_at: string;
            method: PaymentMethod | null;
            reference: string | null;
            document_id: string;
          }[]
        | null) ?? [];

    settledTotal = list.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Chaque versement peut porter sa propre facture d'acompte : on la rattache
    // ici pour que l'admin sache lesquelles restent à générer.
    const invoiceOf = matchAdvanceInvoices(list, advanceRows);
    advances = list.map((p) => {
      const inv = invoiceOf.get(p.id) ?? null;
      return {
        id: p.id,
        amount: Number(p.amount) || 0,
        date: p.received_at,
        method: p.method,
        reference: p.reference,
        documentId: p.document_id,
        invoiceId: inv?.id ?? null,
        invoiceNumber: inv?.number ?? null,
      };
    });
  }

  return buildSettlement({
    quotationId: quotation.id,
    quotationNumber: quotation.number,
    quotationSubject: quotation.subject ?? quotation.title ?? null,
    marketTotal: quotation.total_amount,
    invoicedTotal,
    settledTotal,
    advances,
    advanceInvoices,
    finalInvoiceId: finals[0]?.id ?? null,
  });
}
