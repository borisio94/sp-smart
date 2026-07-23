import { getTranslations } from "next-intl/server";

import {
  listClients,
  listCategories,
  getOrganization,
  listQuotations,
} from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { FactureForm } from "@/components/billing/facture-form";

/** Création d'une facture (page dédiée, saisie simplifiée en une vue). */
export default async function NewFacturePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const t = await getTranslations("Admin");
  const { client } = await searchParams;

  const [clients, categories, organization, quotations] = await Promise.all([
    listClients(),
    listCategories(true),
    getOrganization(),
    listQuotations(),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader
        title={t("documents.factureNew")}
        subtitle={t("documents.factureNewSubtitle")}
      />
      <FactureForm
        clients={clients}
        categories={categories}
        quotations={quotations}
        defaultIssueDate={today}
        defaultPaymentTerms={organization?.default_payment_terms}
        defaultDeliveryTerms={organization?.default_delivery_terms}
        defaultTaxRate={organization?.default_tax_rate ?? 0}
        defaultClientId={client}
      />
    </div>
  );
}
