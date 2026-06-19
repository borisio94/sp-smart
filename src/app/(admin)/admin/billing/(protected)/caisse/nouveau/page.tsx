import { getTranslations } from "next-intl/server";

import {
  listExpenseCategories,
  listLinkableDocuments,
} from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { CashMovementForm } from "@/components/billing/cash-movement-form";

/** Saisie d'une opération de caisse (dépense ou entrée). */
export default async function NewCashMovementPage() {
  const t = await getTranslations("Admin");
  const [categories, documents] = await Promise.all([
    listExpenseCategories(true),
    listLinkableDocuments(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title={t("caisse.newMovement")} subtitle={t("caisse.newMovementSubtitle")} />
      <CashMovementForm
        expenseCategories={categories.map((c) => ({ id: c.id, name: c.name }))}
        documents={documents}
        defaultDate={today}
      />
    </div>
  );
}
