import { getTranslations } from "next-intl/server";

import { getMarketOverview, getMaintenanceContract } from "@/lib/billing/queries";
import { hasAfterSales } from "@/lib/billing/market";
import { formatMoney, formatDate } from "@/lib/billing/format";
import { cn } from "@/lib/utils";
import { MarketExpenseRow } from "./market-expense-row";
import { MarketExpenseForm } from "./market-expense-form";
import { MarketPayoutForm } from "./market-payout-form";
import { MaintenanceContractForm } from "./maintenance-contract-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Ligne d'un tableau de synthèse : libellé à gauche, montant à droite. */
function Row({
  label,
  value,
  tone = "normal",
  strong = false,
}: {
  label: string;
  value: number;
  tone?: "normal" | "negative" | "positive" | "muted";
  strong?: boolean;
}) {
  return (
    <div className={cn("flex justify-between", strong && "border-t pt-1.5 font-medium")}>
      <dt className={tone === "muted" ? "text-muted-foreground" : undefined}>{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          tone === "negative" && "text-destructive",
          tone === "positive" && "text-primary",
        )}
      >
        {tone === "negative" ? "− " : null}
        {formatMoney(Math.abs(value))}
      </dd>
    </div>
  );
}

/**
 * Bloc « Marché » d'une cotation (Server Component) : rentabilité du chantier,
 * après-vente, trésorerie disponible et contrat de maintenance.
 *
 * La synthèse sépare volontairement les travaux de l'après-vente : une
 * réparation sous garantie ne doit jamais venir masquer la rentabilité du
 * chantier d'origine. Le disponible, lui, additionne tout — l'argent en caisse
 * est le même, d'où qu'il vienne.
 *
 * Contenu strictement INTERNE : rien de tout cela n'atteint le PDF client ni
 * la page du lien privé.
 */
export async function MarketSection({ documentId }: { documentId: string }) {
  const t = await getTranslations("Admin");
  const [overview, contract] = await Promise.all([
    getMarketOverview(documentId),
    getMaintenanceContract(documentId),
  ]);
  if (!overview) return null;

  const today = new Date().toISOString().slice(0, 10);
  const worksExpenses = overview.expenses.filter((e) => e.phase !== "panne");
  const afterSalesExpenses = overview.expenses.filter((e) => e.phase === "panne");
  const showAfterSales = hasAfterSales(overview);
  const availableNegative = overview.available < 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("market.title")}</CardTitle>
          <CardDescription>{t("market.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Synthèse : chantier | après-vente | trésorerie */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("market.worksTitle")}
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row label={t("market.marketTotal")} value={overview.marketTotal} tone="muted" />
                <Row
                  label={t("market.worksCollected")}
                  value={overview.worksCollected}
                  tone="muted"
                />
                <Row
                  label={t("market.clientRemaining")}
                  value={overview.clientRemaining}
                  tone={overview.clientRemaining > 0 ? "negative" : "muted"}
                />
                <Row
                  label={t("market.expenses")}
                  value={overview.worksExpenses}
                  tone="negative"
                />
                <Row
                  label={t("market.worksMargin")}
                  value={overview.worksMargin}
                  tone={overview.worksMargin < 0 ? "negative" : "positive"}
                  strong
                />
              </dl>
            </div>

            <div className={cn("rounded-lg border p-4", !showAfterSales && "opacity-60")}>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("market.afterSalesTitle")}
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row
                  label={t("market.afterSalesCollected")}
                  value={overview.afterSalesCollected}
                  tone="muted"
                />
                <Row
                  label={t("market.expenses")}
                  value={overview.afterSalesExpenses}
                  tone="negative"
                />
                <Row
                  label={t("market.afterSalesResult")}
                  value={overview.afterSalesResult}
                  tone={overview.afterSalesResult < 0 ? "negative" : "positive"}
                  strong
                />
              </dl>
            </div>

            <div className={cn("rounded-lg border p-4", availableNegative && "border-destructive")}>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("market.cashTitle")}
              </p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <Row
                  label={t("market.totalMargin")}
                  value={overview.totalMargin}
                  tone="muted"
                />
                <Row label={t("market.paidOut")} value={overview.paidOut} tone="muted" />
                <Row
                  label={t("market.remainingToPayOut")}
                  value={overview.remainingToPayOut}
                  tone={availableNegative ? "negative" : "positive"}
                  strong
                />
              </dl>
              {availableNegative ? (
                <p className="mt-2 text-xs font-medium text-destructive">
                  {t("market.advancedFunds")}
                </p>
              ) : null}
            </div>
          </div>

          {/* Charges du chantier */}
          <div>
            <h3 className="text-sm font-medium">{t("market.expensesTitle")}</h3>
            {worksExpenses.length > 0 ? (
              <ul className="mt-2 divide-y border-y">
                {worksExpenses.map((e) => (
                  <MarketExpenseRow key={e.id} expense={e} documentId={documentId} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("market.noExpense")}</p>
            )}
            <div className="mt-4">
              <MarketExpenseForm
                documentId={documentId}
                defaultDate={today}
                phase="travaux"
              />
            </div>
          </div>

          {/* Après-vente : charges de panne. Les recettes viennent des factures
              d'intervention rattachées au marché (market_phase = panne). */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium">{t("market.afterSalesExpensesTitle")}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("market.afterSalesHint", { count: overview.afterSalesCount })}
            </p>
            {afterSalesExpenses.length > 0 ? (
              <ul className="mt-2 divide-y border-y">
                {afterSalesExpenses.map((e) => (
                  <MarketExpenseRow key={e.id} expense={e} documentId={documentId} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {t("market.noAfterSalesExpense")}
              </p>
            )}
            <div className="mt-4">
              <MarketExpenseForm
                documentId={documentId}
                defaultDate={today}
                phase="panne"
              />
            </div>
          </div>

          {/* Versements vers la caisse */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium">{t("market.payoutsTitle")}</h3>
            {overview.payouts.length > 0 ? (
              <ul className="mt-2 divide-y border-y">
                {overview.payouts.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="flex-1 font-medium tabular-nums text-primary">
                      {formatMoney(p.amount)}
                    </span>
                    {p.reference ? (
                      <span className="text-xs text-muted-foreground">· {p.reference}</span>
                    ) : null}
                    <span className="text-muted-foreground">{formatDate(p.occurred_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">{t("market.noPayout")}</p>
            )}
            <div className="mt-4">
              <MarketPayoutForm
                documentId={documentId}
                defaultDate={today}
                suggestedAmount={overview.remainingToPayOut}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contrat de maintenance du chantier */}
      <Card>
        <CardHeader>
          <CardTitle>{t("maintenance.title")}</CardTitle>
          <CardDescription>
            {contract?.active && contract.end_date
              ? t("maintenance.activeUntil", { date: formatDate(contract.end_date) })
              : t("maintenance.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceContractForm documentId={documentId} contract={contract} />
        </CardContent>
      </Card>
    </>
  );
}
