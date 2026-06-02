import { getTranslations } from "next-intl/server";

import { listCategories } from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { CategoryCreateForm } from "@/components/billing/category-create-form";
import { CategoryToggle } from "@/components/billing/category-toggle";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Gestion des catégories d'exécution (liste + ajout + activation). */
export default async function CategoriesPage() {
  const t = await getTranslations("Admin");
  const categories = await listCategories(false);

  return (
    <div>
      <PageHeader title={t("categories.title")} subtitle={t("categories.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("categories.listTitle")}</CardTitle>
            <CardDescription>{t("categories.listHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{c.name_fr}</span>
                    <span className="text-xs text-muted-foreground">{c.slug}</span>
                    {!c.active ? <Badge tone="warning">{t("categories.inactive")}</Badge> : null}
                  </div>
                  <CategoryToggle id={c.id} active={c.active} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("categories.addTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryCreateForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
