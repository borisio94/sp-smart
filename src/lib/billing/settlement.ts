/**
 * Suivi financier du « marché » : le devis (ou la proforma) auquel une facture
 * est rattachée, et tout ce qui a été facturé puis encaissé dessus.
 *
 * Une facture d'acompte ne porte que sa propre part (ex. 780 000 sur un marché
 * de 1 300 000) : sans ce recoupement, ni le client ni l'émetteur ne voient ce
 * qui reste dû sur l'ensemble. C'est cette lacune que ce module comble.
 *
 * Règle de gestion (cf. demande client) : un marché porte autant de factures
 * d'acompte qu'il y a de versements — acompte n° 1, n° 2… jusqu'au solde. Elles
 * se lisent en séquence (`advanceInvoices`, dans l'ordre d'émission) : chacune
 * part de ce qui restait à verser et en retranche son propre acompte. Le
 * montant de référence pour l'encaissement reste celui du marché (`dueAmount`)
 * et le détail des versements (`advances`) est rappelé sur chaque facture, pour
 * qu'aucune ne laisse croire que le chantier se limite à sa part. Quand plus
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
  /** Identifiant du versement. null côté page publique (aucun id exposé). */
  id?: string | null;
  /** Montant versé (FCFA). */
  amount: number;
  /** Date de versement (ISO `AAAA-MM-JJ`). */
  date: string;
  /** Moyen de paiement, null si inconnu. */
  method: PaymentMethod | null;
  /** Référence du versement (n° de transaction, de chèque…). */
  reference: string | null;
  /**
   * Facture sur laquelle le versement est enregistré. null côté page publique
   * (la RPC n'expose aucun identifiant).
   */
  documentId?: string | null;
  /**
   * Facture d'acompte qui matérialise CE versement (cf. `advance_payment_id`).
   * null tant qu'elle n'a pas été générée — c'est ce qui permet de proposer sa
   * génération, versement par versement.
   */
  invoiceId?: string | null;
  invoiceNumber?: string | null;
}

/**
 * Facture d'acompte émise sur le marché. La liste est ordonnée par date
 * d'émission : le rang d'une facture y est son numéro d'acompte (n° 1, n° 2…),
 * et la somme des précédentes donne ce qui restait à verser avant elle.
 */
export interface SettlementAdvanceInvoice {
  id: string;
  number: string | null;
  /** Montant facturé (l'acompte réclamé). */
  amount: number;
  issueDate: string;
}

export interface Settlement {
  /**
   * Cotation de rattachement (devis, proforma, bon de commande). null côté
   * page publique : la RPC n'expose que le numéro, jamais l'identifiant.
   */
  quotationId: string | null;
  quotationNumber: string | null;
  /**
   * Objet de la cotation : ce que le marché couvre dans son ensemble. Une
   * facture d'acompte l'annonce en tête de tableau (sa propre désignation ne
   * porterait que la part facturée). null côté page publique.
   */
  quotationSubject: string | null;
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
   * Factures d'acompte émises sur ce marché, de la plus ancienne à la plus
   * récente. Vide côté page publique (agrégats seuls).
   */
  advanceInvoices: SettlementAdvanceInvoice[];
  /**
   * Facture définitive déjà générée sur ce marché (le règlement est alors
   * définitivement clos). null tant qu'elle n'existe pas.
   */
  finalInvoiceId: string | null;
}

/**
 * Situation d'une facture d'acompte dans la séquence des acomptes du marché.
 * `rank` vaut 1 pour le premier acompte ; `priorTotal` cumule les acomptes
 * facturés avant celui-ci, d'où découle ce qui restait alors à verser.
 */
export interface AdvancePosition {
  rank: number | null;
  priorTotal: number;
  remainingBefore: number;
  remainingAfter: number;
}

/**
 * Situe une facture d'acompte dans la séquence du marché.
 *
 * Trois lectures, de la plus fidèle à la plus approximative :
 *  1. le versement que cette facture matérialise — ce sont alors les acomptes
 *     REÇUS avant lui qui comptent, qu'ils aient ou non leur propre facture.
 *     C'est la seule lecture juste quand on facture après coup un encaissement
 *     ancien : les versements intermédiaires seraient sinon ignorés ;
 *  2. à défaut, la séquence des factures d'acompte émises (facture établie
 *     avant tout encaissement) ;
 *  3. en dernier recours, l'encaissé global — pour un document hors séquence
 *     (facture isolée, agrégats publics sans détail). Le tableau reste juste.
 */
export function advancePosition(
  settlement: Settlement | null,
  documentId: string,
  documentTotal: number,
): AdvancePosition {
  const amount = Number(documentTotal) || 0;
  if (!settlement) {
    return { rank: null, priorTotal: 0, remainingBefore: 0, remainingAfter: 0 };
  }

  // Un remboursement n'est pas un acompte : il ne prend pas de rang.
  const paid = settlement.advances.filter((a) => a.amount > 0);
  const paidIndex = paid.findIndex((a) => a.invoiceId === documentId);
  const invoiceIndex = settlement.advanceInvoices.findIndex(
    (i) => i.id === documentId,
  );

  const rank =
    paidIndex >= 0 ? paidIndex + 1 : invoiceIndex >= 0 ? invoiceIndex + 1 : null;
  const priorTotal =
    paidIndex >= 0
      ? paid.slice(0, paidIndex).reduce((sum, a) => sum + a.amount, 0)
      : invoiceIndex >= 0
        ? settlement.advanceInvoices
            .slice(0, invoiceIndex)
            .reduce((sum, i) => sum + i.amount, 0)
        : Math.max(0, settlement.settledTotal - amount);

  const remainingBefore = Math.max(0, settlement.marketTotal - priorTotal);
  return {
    rank,
    priorTotal,
    remainingBefore,
    remainingAfter: Math.max(0, remainingBefore - amount),
  };
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
  quotationSubject?: string | null;
  marketTotal: number | null | undefined;
  invoicedTotal: number | null | undefined;
  settledTotal: number | null | undefined;
  advances?: SettlementAdvance[];
  advanceInvoices?: SettlementAdvanceInvoice[];
  finalInvoiceId?: string | null;
}): Settlement | null {
  const marketTotal = Number(input.marketTotal) || 0;
  // Aucun marché rattaché — ou RPC pas encore migrée (champs absents).
  if (marketTotal <= 0) return null;

  const settledTotal = Number(input.settledTotal) || 0;
  return {
    quotationId: input.quotationId ?? null,
    quotationNumber: input.quotationNumber,
    quotationSubject: input.quotationSubject ?? null,
    marketTotal,
    invoicedTotal: Number(input.invoicedTotal) || 0,
    settledTotal,
    remaining: Math.max(0, marketTotal - settledTotal),
    advances: input.advances ?? [],
    advanceInvoices: input.advanceInvoices ?? [],
    finalInvoiceId: input.finalInvoiceId ?? null,
  };
}
