import { getTranslations } from "next-intl/server";

import {
  listClients,
  listCategories,
  getOrganization,
  listCustomDocumentTypes,
} from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { DocumentForm } from "@/components/billing/document-form";

/** Création d'un nouveau document (parcours multi-étapes). */
export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const t = await getTranslations("Admin");
  const { client } = await searchParams;

  const [clients, categories, organization, customTypes] = await Promise.all([
    listClients(),
    listCategories(true),
    getOrganization(),
    listCustomDocumentTypes(true),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title={t("documents.new")} subtitle={t("documents.newSubtitle")} />
      <DocumentForm
        clients={clients}
        categories={categories}
        customTypes={customTypes}
        defaultIssueDate={today}
        defaultPaymentTerms={organization?.default_payment_terms}
        defaultDeliveryTerms={organization?.default_delivery_terms}
        defaultTaxRate={organization?.default_tax_rate ?? 0}
        defaultClientId={client}
      />
    </div>
  );
}
