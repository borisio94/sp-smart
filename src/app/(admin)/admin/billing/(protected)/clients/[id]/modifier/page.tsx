import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getClient } from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { ClientForm } from "@/components/billing/client-form";

/** Édition d'un client existant. */
export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("Admin");
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  return (
    <div>
      <PageHeader title={t("clients.edit")} subtitle={client.name} />
      <ClientForm client={client} />
    </div>
  );
}
