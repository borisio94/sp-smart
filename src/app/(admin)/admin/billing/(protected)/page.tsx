import { getTranslations } from "next-intl/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Tableau de bord du module Billing.
 * Phase 1 : structure + KPIs en attente (les données arrivent en Phase 2).
 */
export default async function BillingDashboardPage() {
  const t = await getTranslations("Admin");

  const kpis = [
    { key: "docsThisMonth", label: t("dashboard.kpiDocsMonth") },
    { key: "revenueMonth", label: t("dashboard.kpiRevenueMonth") },
    { key: "pending", label: t("dashboard.kpiPending") },
    { key: "unpaid", label: t("dashboard.kpiUnpaid") },
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
              <CardTitle className="text-2xl">—</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentTitle")}</CardTitle>
          <CardDescription>{t("dashboard.recentEmpty")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            {t("dashboard.phase2Notice")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
