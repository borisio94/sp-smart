/**
 * Suivi financier du « marché » : le devis (ou la proforma) auquel une facture
 * est rattachée, et tout ce qui a été facturé puis encaissé dessus.
 *
 * Une facture d'acompte ne porte que sa propre part (ex. 780 000 sur un marché
 * de 1 300 000) : sans ce recoupement, ni le client ni l'émetteur ne voient ce
 * qui reste dû sur l'ensemble. C'est cette lacune que ce module comble.
 *
 * Règle de gestion (cf. demande client) : les acomptes suivants ne donnent PAS
 * lieu à une nouvelle facture — ils s'enregistrent en paiements sur la facture
 * d'acompte initiale, qui devient le registre du marché. Le montant de
 * référence pour l'encaissement est donc celui du marché (`dueAmount`), et le
 * détail des versements (`advances`) est rappelé sur la facture. Quand plus
 * rien ne reste dû, la saisie se clôt et une facture définitive est générée.
 *
 * Module volontairement « pur » (aucun import Node) : il est partagé par le
 * PDF, la fiche admin et la page publique. La lecture en base vit dans
 * `settlement-query.ts`, et la page du lien privé obtient les mêmes agrégats
 * par la RPC `get_document_by_token` (cf. migration 0018).
 */

import type { PaymentMethod } from "./types";

/** Un acompte encaissé sur le marché (paiement réel, jamais saisi à la main). */
export interface SettlementAdvance {
  /** Montant versé (FCFA). */
  amount: number;
  /** Date de versement (ISO `AAAA-MM-JJ`). */
  date: string;
  /** Moyen de paiement, null si inconnu. */
  method: PaymentMethod | null;
  /** Référence du versement (n° de transaction, de chèque…). */
  reference: string | null;
}

export interface Settlement {
  /**
   * Cotation de rattachement (devis, proforma, bon de commande). null côté
   * page publique : la RPC n'expose que le numéro, jamais l'identifiant.
   */
  quotationId: string | null;
  quotationNumber: string | null;
  /** Montant total du marché = total de la cotation. */
  marketTotal: number;
  /** Somme des factures émises sur ce marché (hors annulées). */
  invoicedTotal: number;
  /** Somme réellement encaissée sur ces factures. */
  settledTotal: number;
  /** Reste à payer sur le marché = marché − encaissé (jamais négatif). */
  remaining: number;
  /**
   * Détail des acomptes encaissés, du plus ancien au plus récent. Vide côté
   * page publique : la RPC ne renvoie que des agrégats.
   */
  advances: SettlementAdvance[];
  /**
   * Facture définitive déjà générée sur ce marché (le règlement est alors
   * définitivement clos). null tant qu'elle n'existe pas.
   */
  finalInvoiceId: string | null;
}

/**
 * Faut-il rappeler le suivi du marché sur un document de ce montant ?
 *
 * Deux cas le justifient :
 *  - la facture ne couvre qu'une part du marché (acompte) — le reste dû ne se
 *    lit nulle part ailleurs ;
 *  - un encaissement existe déjà sur le marché — une facture définitive au
 *    montant plein doit alors rappeler ce qui a été versé et le solde réel.
 *
 * Dans les autres cas (facture unique couvrant tout le marché, rien d'encaissé)
 * le rappel n'apprendrait rien : facture et marché se confondent.
 */
export function shouldShowSettlement(
  settlement: Settlement | null,
  documentTotal: number,
): settlement is Settlement {
  if (!settlement) return false;
  return (
    settlement.marketTotal > documentTotal || settlement.settledTotal > 0
  );
}

/**
 * La facture n'est-elle qu'un acompte sur un marché plus large ?
 * C'est le seul cas où l'encaissement se suit au niveau du marché et non au
 * niveau de la facture.
 */
export function isAdvanceOnMarket(
  settlement: Settlement | null,
  documentTotal: number,
): settlement is Settlement {
  return settlement !== null && settlement.marketTotal > documentTotal;
}

/**
 * Montant de référence pour l'encaissement d'une facture.
 *
 * Facture d'acompte → le marché entier : les versements suivants s'ajoutent sur
 * cette même facture jusqu'au solde du marché. Sinon → le montant de la facture
 * (cas courant : la cotation et la facture se confondent).
 */
export function dueAmount(
  settlement: Settlement | null,
  documentTotal: number,
): number {
  const total = Number(documentTotal) || 0;
  return isAdvanceOnMarket(settlement, total) ? settlement.marketTotal : total;
}

/**
 * Montant déjà encaissé à retenir face à `dueAmount`.
 *
 * Dès qu'un marché existe, c'est son encaissé qui fait foi : les acomptes
 * s'enregistrent sur une seule facture, et une facture définitive émise à la
 * clôture n'a aucun paiement propre alors que tout est réglé. Sans marché
 * rattaché, seuls comptent les paiements de la facture elle-même.
 */
export function settledAmount(
  settlement: Settlement | null,
  paidOnDocument: number,
): number {
  return settlement ? settlement.settledTotal : Number(paidOnDocument) || 0;
}

/**
 * Assemble un `Settlement` à partir de montants déjà lus (base ou RPC).
 * Renvoie null quand il n'y a pas de marché à recouper.
 */
export function buildSettlement(input: {
  quotationId?: string | null;
  quotationNumber: string | null;
  marketTotal: number | null | undefined;
  invoicedTotal: number | null | undefined;
  settledTotal: number | null | undefined;
  advances?: SettlementAdvance[];
  finalInvoiceId?: string | null;
}): Settlement | null {
  const marketTotal = Number(input.marketTotal) || 0;
  // Aucun marché rattaché — ou RPC pas encore migrée (champs absents).
  if (marketTotal <= 0) return null;

  const settledTotal = Number(input.settledTotal) || 0;
  return {
    quotationId: input.quotationId ?? null,
    quotationNumber: input.quotationNumber,
    marketTotal,
    invoicedTotal: Number(input.invoicedTotal) || 0,
    settledTotal,
    remaining: Math.max(0, marketTotal - settledTotal),
    advances: input.advances ?? [],
    finalInvoiceId: input.finalInvoiceId ?? null,
  };
}
