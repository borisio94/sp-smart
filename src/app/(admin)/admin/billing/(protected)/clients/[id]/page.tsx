import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getClient, listDocuments } from "@/lib/billing/queries";
import {
  CLIENT_TYPE_LABELS,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  formatMoney,
  formatDate,
} from "@/lib/billing/format";
import { deleteClient } from "../actions";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { DeleteButton } from "@/components/billing/delete-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Fiche client : coordonnées + documents associés. */
export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("Admin");
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const documents = await listDocuments({ client_id: id });

  const rows: { label: string; value: string | null }[] = [
    { label: t("clients.contactPerson"), value: client.contact_person },
    { label: t("clients.email"), value: client.email },
    { label: t("clients.phone"), value: client.phone },
    { label: t("clients.whatsapp"), value: client.whatsapp },
    { label: t("clients.address"), value: client.address },
    { label: t("clients.notes"), value: client.notes },
  ];

  return (
    <div>
      <PageHeader
        title={client.name}
        subtitle={
          client.ref
            ? `${client.ref} · ${CLIENT_TYPE_LABELS[client.type]}`
            : CLIENT_TYPE_LABELS[client.type]
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <AdminLink href={`/admin/billing/clients/${id}/modifier`} variant="outline" size="sm">
          {t("common.edit")}
        </AdminLink>
        <DeleteButton
          id={id}
          action={deleteClient}
          redirectTo="/admin/billing/clients"
        />
        <AdminLink
          href={`/admin/billing/documents/nouveau?client=${id}`}
          variant="secondary"
          size="sm"
        >
          {t("clients.newDocument")}
        </AdminLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("clients.contactInfo")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {rows.map((r) => (
                <div key={r.label} className="flex gap-3">
                  <dt className="w-32 shrink-0 text-muted-foreground">{r.label}</dt>
                  <dd className="whitespace-pre-wrap">{r.value || "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("clients.documents")}</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("clients.noDocuments")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2">
                    <AdminLink
                      href={`/admin/billing/documents/${d.id}`}
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                    >
                      {d.number ?? DOCUMENT_TYPE_LABELS[d.type]}
                    </AdminLink>
                    <span className="flex items-center gap-3 text-muted-foreground">
                      <span>{formatDate(d.issue_date)}</span>
                      <span>{formatMoney(d.total_amount)}</span>
                      <Badge tone="neutral">{DOCUMENT_STATUS_LABELS[d.status]}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
