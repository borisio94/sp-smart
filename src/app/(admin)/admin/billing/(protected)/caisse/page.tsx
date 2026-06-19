import { getTranslations } from "next-intl/server";

import { getCashOverview, listCashMovements } from "@/lib/billing/queries";
import {
  formatMoney,
  formatDate,
  DOCUMENT_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/billing/format";
import type { PaymentMethod, DocumentType } from "@/lib/billing/types";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { MovementDeleteButton } from "@/components/billing/movement-delete-button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

/** Trésorerie : solde, ligne rouge et registre des mouvements. */
export default async function CaissePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const t = await getTranslations("Admin");
  const { type } = await searchParams;
  const direction = type === "in" || type === "out" ? type : undefined;

  const [overview, movements] = await Promise.all([
    getCashOverview(),
    listCashMovements(direction),
  ]);

  // État de la ligne rouge : sous le seuil = danger.
  const danger = overview.balance <= overview.redLine;

  const methodLabel = (m: string | null) =>
    m ? PAYMENT_METHOD_LABELS[m as PaymentMethod] ?? m : null;

  return (
    <div>
      <PageHeader title={t("caisse.title")} subtitle={t("caisse.subtitle")} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <AdminLink href="/admin/billing/caisse/nouveau" size="sm">
          {t("caisse.newMovement")}
        </AdminLink>
        <AdminLink href="/admin/billing/parametres/caisse" variant="outline" size="sm">
          {t("caisse.manageSettings")}
        </AdminLink>
      </div>

      {/* Synthèse */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={cn(danger && "border-destructive")}>
          <CardHeader className="pb-2">
            <CardDescription>{t("caisse.balance")}</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl tabular-nums",
                danger ? "text-destructive" : "text-primary",
              )}
            >
              {formatMoney(overview.balance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            {t("caisse.openingBalance")} : {formatMoney(overview.openingBalance)}
          </CardContent>
        </Card>

        <Card className={cn(danger && "border-destructive")}>
          <CardHeader className="pb-2">
            <CardDescription>{t("caisse.marginToRedLine")}</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl tabular-nums",
                overview.margin <= 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {formatMoney(overview.margin)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs">
            {danger ? (
              <span className="font-medium text-destructive">{t("caisse.belowRedLine")}</span>
            ) : (
              <span className="text-muted-foreground">
                {t("caisse.redLine")} : {formatMoney(overview.redLine)}
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("caisse.monthIn")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-foreground">
              {formatMoney(overview.monthIn)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("caisse.monthOut")}</CardDescription>
            <CardTitle className="text-2xl tabular-nums text-destructive">
              {formatMoney(overview.monthOut)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Registre */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>{t("caisse.movements")}</CardTitle>
          <div className="flex gap-2 text-xs">
            <FilterLink current={direction} value={undefined} label={t("caisse.filterAll")} />
            <FilterLink current={direction} value="in" label={t("caisse.entry")} />
            <FilterLink current={direction} value="out" label={t("caisse.expense")} />
          </div>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t("caisse.empty")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 font-medium">{t("caisse.date")}</th>
                    <th className="py-2 font-medium">{t("caisse.label")}</th>
                    <th className="py-2 font-medium">{t("caisse.method")}</th>
                    <th className="py-2 text-right font-medium">{t("caisse.amount")}</th>
                    <th className="w-10 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const isIn = m.direction === "in";
                    return (
                      <tr key={m.id} className="border-b border-border/60 align-top">
                        <td className="py-2.5 text-muted-foreground tabular-nums">
                          {formatDate(m.occurred_at)}
                        </td>
                        <td className="py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span>
                              {m.description ??
                                (m.document
                                  ? m.document.number ??
                                    DOCUMENT_TYPE_LABELS[m.document.type as DocumentType]
                                  : "—")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {m.category?.name ??
                                (m.document ? (
                                  <AdminLink
                                    href={`/admin/billing/documents/${m.document.id}`}
                                    variant="link"
                                    size="sm"
                                    className="h-auto px-0 text-xs"
                                  >
                                    {m.document.number ??
                                      DOCUMENT_TYPE_LABELS[m.document.type as DocumentType]}
                                  </AdminLink>
                                ) : (
                                  ""
                                ))}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">
                          {methodLabel(m.method) ?? "—"}
                        </td>
                        <td
                          className={cn(
                            "py-2.5 text-right font-medium tabular-nums",
                            isIn ? "text-primary" : "text-destructive",
                          )}
                        >
                          {isIn ? "+ " : "− "}
                          {formatMoney(m.amount)}
                        </td>
                        <td className="py-2.5 text-right">
                          {m.payment_id ? null : <MovementDeleteButton id={m.id} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Lien de filtre par sens de mouvement. */
function FilterLink({
  current,
  value,
  label,
}: {
  current: "in" | "out" | undefined;
  value: "in" | "out" | undefined;
  label: string;
}) {
  const active = current === value;
  const href = value ? `/admin/billing/caisse?type=${value}` : "/admin/billing/caisse";
  return (
    <AdminLink
      href={href}
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className="h-7"
    >
      {label}
    </AdminLink>
  );
}
