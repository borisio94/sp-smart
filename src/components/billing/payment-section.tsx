import { getTranslations } from "next-intl/server";

import { listPayments } from "@/lib/billing/queries";
import { sumPayments } from "@/lib/billing/payments";
import { getSettlement } from "@/lib/billing/settlement-query";
import {
  dueAmount,
  isAdvanceOnMarket,
  paidAdvances,
  settledAmount,
  shouldShowSettlement,
} from "@/lib/billing/settlement";
import { formatMoney, formatDate } from "@/lib/billing/format";
import type { FactureKind } from "@/lib/billing/types";
import { PaymentRecorder } from "./payment-recorder";
import { PaymentRow } from "./payment-row";
import { FinalInvoiceButton } from "./final-invoice-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Section paiements d'une facture (Server Component) : suivi du marché, barre
 * de progression, formulaire d'enregistrement et historique des versements.
 *
 * Une facture d'acompte ne porte qu'une part du marché : la progression se
 * mesure donc sur le montant de la cotation et sur l'ensemble de ses
 * encaissements, faute de quoi la facture s'afficherait « payée » dès son
 * propre acompte. Le versement proposé, lui, est celui de la facture ouverte.
 * La saisie se clôt dès que le marché est soldé — une facture définitive prend
 * alors le relais.
 *
 * Une facture d'acompte porte TOUS les acomptes du marché : chacun s'y
 * enregistre et s'y imprime, sans qu'il faille émettre une pièce par versement.
 */
export async function PaymentSection({
  documentId,
  totalAmount,
  factureKind = null,
}: {
  documentId: string;
  totalAmount: number;
  /** Nature de la facture ouverte (les acomptes ne se listent que sur une facture d'acompte). */
  factureKind?: FactureKind | null;
}) {
  const t = await getTranslations("Admin");
  const [payments, settlement] = await Promise.all([
    listPayments(documentId),
    getSettlement(documentId),
  ]);
  const market = shouldShowSettlement(settlement, totalAmount) ? settlement : null;
  // Acompte sur un marché plus large → l'encaissement se suit sur le marché.
  const onMarket = isAdvanceOnMarket(settlement, totalAmount);
  const paidOnDoc = sumPayments(payments);
  const due = dueAmount(settlement, totalAmount);
  const paid = settledAmount(settlement, paidOnDoc);
  const remaining = Math.max(0, due - paid);
  // Montant proposé à la saisie : ce que réclame CETTE facture tant qu'elle
  // n'est pas couverte. Son premier acompte encaissé, les versements suivants
  // portent sur le reste du marché — proposer à nouveau son montant inviterait
  // à saisir deux fois le même acompte.
  const ownRemaining = Math.max(0, totalAmount - paidOnDoc);
  const suggested = onMarket && ownRemaining > 0 ? ownRemaining : remaining;
  const pct = due > 0 ? Math.min(100, Math.round((paid / due) * 100)) : 0;
  const today = new Date().toISOString().slice(0, 10);

  // Acomptes encaissés sur le marché, du plus ancien au plus récent : la
  // facture d'acompte ouverte s'imprime pour l'un ou pour l'autre.
  const marketAdvances = paidAdvances(settlement);
  const isAdvanceInvoice = factureKind === "acompte";

  // Règlement clôturé : plus rien à encaisser sur le marché.
  const closed = settlement !== null && settlement.remaining <= 0;
  // La facture définitive n'a pas à se proposer sa propre génération.
  const isFinalInvoice = settlement?.finalInvoiceId === documentId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("payments.sectionTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Suivi du marché : la facture d'acompte ne porte qu'une part du
            devis d'origine — on rappelle ce qui reste dû sur l'ensemble. */}
        {market ? (
          <div className="rounded-xl bg-muted/40 p-4 text-sm">
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              {t("payments.marketTitle")}
              {market.quotationNumber ? ` — ${market.quotationNumber}` : ""}
            </p>
            <dl className="space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("payments.marketTotal")}</dt>
                <dd className="tabular-nums">{formatMoney(market.marketTotal)}</dd>
              </div>
              {/* Montant de la facture : celui qui a été saisi, jamais déduit
                  d'un pourcentage du marché. */}
              {onMarket ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{t("payments.marketThisInvoice")}</dt>
                  <dd className="tabular-nums">{formatMoney(totalAmount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("payments.marketInvoiced")}</dt>
                <dd className="tabular-nums">{formatMoney(market.invoicedTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t("payments.marketSettled")}</dt>
                <dd className="tabular-nums">{formatMoney(market.settledTotal)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
                <dt>{t("payments.marketRemaining")}</dt>
                <dd className="tabular-nums">{formatMoney(market.remaining)}</dd>
              </div>
            </dl>
            {onMarket && !closed ? (
              <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
                {t("payments.marketAdvanceHint")}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Progression payé / montant dû (le marché pour une facture d'acompte) */}
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("payments.paid")} : <span className="tabular-nums text-foreground">{formatMoney(paid)}</span>
            </span>
            <span className="text-muted-foreground">
              {t("payments.remaining")} : <span className="tabular-nums text-foreground">{formatMoney(remaining)}</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Acomptes du marché : cette facture les porte tous et s'imprime pour
            celui que l'on choisit — le plus récent par défaut. */}
        {isAdvanceInvoice && marketAdvances.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
              {t("payments.advancesTitle")}
            </p>
            <p className="mb-2 text-xs text-muted-foreground">
              {t("payments.advancesHint")}
            </p>
            <ul className="divide-y divide-border">
              {marketAdvances.map((a, i) => (
                <li
                  key={a.id ?? i}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm"
                >
                  <span className="font-medium">
                    {t("payments.advanceRank", { rank: i + 1 })}
                    {i === marketAdvances.length - 1 ? (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        {t("payments.advanceLatest")}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums">{formatMoney(a.amount)}</span>
                  <span className="text-muted-foreground">{formatDate(a.date)}</span>
                  <span className="ml-auto flex gap-2">
                    <a
                      href={`/admin/billing/documents/${documentId}/pdf?acompte=${i + 1}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
                    >
                      {t("payments.advancePreview")}
                    </a>
                    <a
                      href={`/admin/billing/documents/${documentId}/pdf?acompte=${i + 1}&dl=1`}
                      className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-medium hover:bg-muted"
                    >
                      {t("payments.advanceDownload")}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Historique des acomptes encaissés sur cette facture */}
        <div>
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
            {t("payments.history")}
          </p>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("payments.none")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {payments.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </ul>
          )}
        </div>

        {/* Enregistrement — ou clôture du règlement */}
        <div className="border-t border-border pt-4">
          {closed ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("payments.closedTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {isFinalInvoice ? t("payments.closedFinal") : t("payments.closedHint")}
              </p>
              {isFinalInvoice ? null : (
                <FinalInvoiceButton
                  documentId={documentId}
                  finalInvoiceId={settlement?.finalInvoiceId ?? null}
                />
              )}
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs font-medium uppercase text-muted-foreground">
                {t("payments.add")}
              </p>
              <PaymentRecorder
                documentId={documentId}
                defaultDate={today}
                suggestedAmount={suggested}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
