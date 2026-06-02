import { getTranslations } from "next-intl/server";

import { listRecentPayments, listUnpaidInvoices } from "@/lib/billing/queries";
import {
  formatMoney,
  formatDate,
  PAYMENT_METHOD_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/lib/billing/format";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { PaymentBadge } from "@/components/billing/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Suivi global : factures impayées + derniers paiements reçus. */
export default async function PaymentsPage() {
  const t = await getTranslations("Admin");
  const [unpaid, recent] = await Promise.all([
    listUnpaidInvoices(),
    listRecentPayments(50),
  ]);

  return (
    <div>
      <PageHeader title={t("payments.pageTitle")} subtitle={t("payments.pageSubtitle")} />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Factures impayées */}
        <Card>
          <CardHeader>
            <CardTitle>{t("payments.unpaidTitle")}</CardTitle>
            <CardDescription>{t("payments.unpaidHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            {unpaid.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("payments.noUnpaid")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {unpaid.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <AdminLink
                      href={`/admin/billing/documents/${d.id}`}
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                    >
                      {d.number ?? "—"}
                    </AdminLink>
                    <span className="flex items-center gap-3 text-muted-foreground">
                      <span>{d.client?.name ?? "—"}</span>
                      <span className="tabular-nums">{formatMoney(d.total_amount)}</span>
                      <PaymentBadge status={d.payment_status} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Derniers paiements */}
        <Card>
          <CardHeader>
            <CardTitle>{t("payments.recentTitle")}</CardTitle>
            <CardDescription>{t("payments.recentHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("payments.noRecent")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {recent.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      {p.document ? (
                        <AdminLink
                          href={`/admin/billing/documents/${p.document.id}`}
                          variant="link"
                          size="sm"
                          className="h-auto px-0"
                        >
                          {p.document.number ?? DOCUMENT_TYPE_LABELS[p.document.type]}
                        </AdminLink>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {p.document?.client?.name ?? ""}
                      </span>
                    </div>
                    <span className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {PAYMENT_METHOD_LABELS[p.method]}
                      </span>
                      <span className="text-muted-foreground">{formatDate(p.received_at)}</span>
                      <span
                        className={
                          p.amount < 0
                            ? "font-medium text-destructive tabular-nums"
                            : "font-medium tabular-nums"
                        }
                      >
                        {formatMoney(p.amount)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
