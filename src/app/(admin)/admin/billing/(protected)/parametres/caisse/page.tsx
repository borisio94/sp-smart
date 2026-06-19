import { getTranslations } from "next-intl/server";

import { getCashSettings, listExpenseCategories } from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { CashSettingsForm } from "@/components/billing/cash-settings-form";
import { ExpenseCategoryCreateForm } from "@/components/billing/expense-category-create-form";
import { ExpenseCategoryRow } from "@/components/billing/expense-category-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Réglages de caisse : fonds initial, ligne rouge, catégories de dépenses. */
export default async function CaisseSettingsPage() {
  const t = await getTranslations("Admin");
  const [settings, categories] = await Promise.all([
    getCashSettings(),
    listExpenseCategories(false),
  ]);

  return (
    <div>
      <PageHeader title={t("caisse.settingsTitle")} subtitle={t("caisse.settingsSubtitle")} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("caisse.settingsCardTitle")}</CardTitle>
            <CardDescription>{t("caisse.settingsCardHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <CashSettingsForm settings={settings} />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>{t("caisse.categoriesTitle")}</CardTitle>
              <CardDescription>{t("caisse.categoriesHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("caisse.categoriesEmpty")}</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {categories.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{c.name}</span>
                        {!c.active ? <Badge tone="warning">{t("categories.inactive")}</Badge> : null}
                      </div>
                      <ExpenseCategoryRow id={c.id} active={c.active} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("caisse.categoryAddTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseCategoryCreateForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
