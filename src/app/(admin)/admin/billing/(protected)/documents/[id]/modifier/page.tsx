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
import { FactureForm } from "@/components/billing/facture-form";

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

  // Une facture utilise la page dédiée (saisie simplifiée) ; les autres types
  // gardent le formulaire multi-étapes générique.
  const isFacture = document.type === "facture";

  return (
    <div>
      <PageHeader
        title={isFacture ? t("documents.factureEdit") : t("documents.edit")}
        subtitle={document.number ?? undefined}
      />
      {isFacture ? (
        <FactureForm
          clients={clients}
          categories={categories}
          defaultIssueDate={document.issue_date}
          defaultPaymentTerms={organization?.default_payment_terms}
          defaultDeliveryTerms={organization?.default_delivery_terms}
          defaultTaxRate={organization?.default_tax_rate ?? 0}
          document={document}
        />
      ) : (
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
      )}
    </div>
  );
}
