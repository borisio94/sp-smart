import { getTranslations } from "next-intl/server";

import { getDashboardStats } from "@/lib/billing/queries";
import { documentTypeLabel, formatMoney } from "@/lib/billing/format";
import { StatusBadge } from "@/components/billing/status-badge";
import { AdminLink } from "@/components/billing/admin-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Tableau de bord du module Billing : KPIs et activité récente calculés
 * à partir des données réelles (Server Component, toujours à jour après
 * chaque action grâce au rafraîchissement des routes).
 */
export default async function BillingDashboardPage() {
  const t = await getTranslations("Admin");
  const stats = await getDashboardStats();

  const kpis = [
    { key: "docsMonth", label: t("dashboard.kpiDocsMonth"), value: String(stats.docsThisMonth) },
    { key: "revenue", label: t("dashboard.kpiRevenueMonth"), value: formatMoney(stats.revenueConfirmedMonth) },
    { key: "pending", label: t("dashboard.kpiPending"), value: String(stats.pendingCount) },
    { key: "unpaid", label: t("dashboard.kpiUnpaid"), value: formatMoney(stats.unpaidAmount) },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.subtitle")}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.key} size="sm">
            <CardHeader>
              <CardDescription>{kpi.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{kpi.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {t("dashboard.recentEmpty")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <AdminLink
                      href={`/admin/billing/documents/${d.id}`}
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                    >
                      {`${documentTypeLabel(d)} ${d.number ?? ""}`.trim()}
                    </AdminLink>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.client?.name ?? "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={d.status} />
                    <span className="tabular-nums text-sm">{formatMoney(d.total_amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
