import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/billing/page-header";
import { ClientForm } from "@/components/billing/client-form";

/** Création d'un nouveau client. */
export default async function NewClientPage() {
  const t = await getTranslations("Admin");
  return (
    <div>
      <PageHeader title={t("clients.new")} subtitle={t("clients.newSubtitle")} />
      <ClientForm />
    </div>
  );
}
