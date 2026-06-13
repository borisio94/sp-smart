import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import {
  getDocument,
  listClients,
  listCategories,
  getOrganization,
  listCustomDocumentTypes,
} from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { DocumentForm } from "@/components/billing/document-form";

/** Édition d'un document existant. */
export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("Admin");
  const { id } = await params;

  const [document, clients, categories, organization, customTypes] =
    await Promise.all([
      getDocument(id),
      listClients(),
      listCategories(false),
      getOrganization(),
      listCustomDocumentTypes(false),
    ]);

  if (!document) notFound();

  return (
    <div>
      <PageHeader
        title={t("documents.edit")}
        subtitle={document.number ?? undefined}
      />
      <DocumentForm
        clients={clients}
        categories={categories}
        customTypes={customTypes}
        defaultIssueDate={document.issue_date}
        defaultPaymentTerms={organization?.default_payment_terms}
        defaultDeliveryTerms={organization?.default_delivery_terms}
        defaultTaxRate={organization?.default_tax_rate ?? 0}
        document={document}
      />
    </div>
  );
}
