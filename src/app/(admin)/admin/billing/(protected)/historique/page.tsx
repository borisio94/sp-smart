import { getTranslations } from "next-intl/server";

import { listClients, listCategories } from "@/lib/billing/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DOCUMENT_TYPE_LABELS, formatMoney } from "@/lib/billing/format";
import type { BillingDocument } from "@/lib/billing/types";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { HistoricalForm } from "@/components/billing/historical-form";
import { StatusBadge } from "@/components/billing/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type HistoricalRow = Pick<
  BillingDocument,
  "id" | "type" | "number" | "issue_date" | "total_amount" | "status"
> & { client: { name: string } | null };

/** Module de saisie des documents antérieurs au site. */
export default async function HistoriquePage() {
  const t = await getTranslations("Admin");

  const [clients, categories] = await Promise.all([
    listClients(),
    listCategories(true),
  ]);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("documents")
    .select("id, type, number, issue_date, total_amount, status, client:clients(name)")
    .eq("is_historical", true)
    .order("issue_date", { ascending: false })
    .limit(30);
  const historical = (data as HistoricalRow[] | null) ?? [];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title={t("historical.title")} subtitle={t("historical.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <Card>
          <CardHeader>
            <CardTitle>{t("historical.formTitle")}</CardTitle>
            <CardDescription>{t("historical.formHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            {clients.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("historical.needClient")}{" "}
                <AdminLink
                  href="/admin/billing/clients/nouveau"
                  variant="link"
                  size="sm"
                  className="h-auto px-0"
                >
                  {t("documents.createClientLink")}
                </AdminLink>
              </p>
            ) : (
              <HistoricalForm clients={clients} categories={categories} defaultDate={today} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("historical.listTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            {historical.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("historical.empty")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {historical.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2.5">
                    <AdminLink
                      href={`/admin/billing/documents/${d.id}`}
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                    >
                      {d.number ?? DOCUMENT_TYPE_LABELS[d.type]}
                    </AdminLink>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span>{d.client?.name ?? "—"}</span>
                      <span className="tabular-nums">{formatMoney(d.total_amount)}</span>
                      <StatusBadge status={d.status} />
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
