import { getTranslations } from "next-intl/server";

import { listDocuments, listCategories } from "@/lib/billing/queries";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatMoney,
  formatDate,
} from "@/lib/billing/format";
import type { DocumentStatus, PaymentStatus } from "@/lib/billing/types";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { StatusBadge, PaymentBadge } from "@/components/billing/status-badge";
import { Select } from "@/components/ui/select";

const STATUSES = Object.keys(DOCUMENT_STATUS_LABELS) as DocumentStatus[];
const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[];

/** Liste filtrable de tous les documents commerciaux. */
export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    payment_status?: string;
    category_id?: string;
    q?: string;
  }>;
}) {
  const t = await getTranslations("Admin");
  const sp = await searchParams;

  const [documents, categories] = await Promise.all([
    listDocuments({
      type: sp.type,
      status: sp.status,
      payment_status: sp.payment_status,
      category_id: sp.category_id,
      search: sp.q,
    }),
    listCategories(false),
  ]);

  return (
    <div>
      <PageHeader
        title={t("documents.title")}
        subtitle={t("documents.subtitle")}
        actionLabel={t("documents.new")}
        actionHref="/admin/billing/documents/nouveau"
      />

      {/* Filtres (GET, sans JS) */}
      <form
        action="/admin/billing/documents"
        method="get"
        className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder={t("documents.searchPlaceholder")}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Select name="type" defaultValue={sp.type ?? ""}>
          <option value="">{t("documents.allTypes")}</option>
          {DOCUMENT_TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {DOCUMENT_TYPE_LABELS[ty]}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={sp.status ?? ""}>
          <option value="">{t("documents.allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {DOCUMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select name="payment_status" defaultValue={sp.payment_status ?? ""}>
          <option value="">{t("documents.allPayments")}</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select name="category_id" defaultValue={sp.category_id ?? ""}>
          <option value="">{t("documents.allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_fr}
            </option>
          ))}
        </Select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          >
            {t("documents.filter")}
          </button>
          <AdminLink href="/admin/billing/documents" variant="ghost" size="default">
            {t("documents.resetFilters")}
          </AdminLink>
        </div>
      </form>

      {documents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          {t("documents.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("documents.number")}</th>
                <th className="px-4 py-2.5 font-medium">{t("documents.type")}</th>
                <th className="px-4 py-2.5 font-medium">{t("documents.client")}</th>
                <th className="px-4 py-2.5 font-medium">{t("documents.date")}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t("documents.total")}</th>
                <th className="px-4 py-2.5 font-medium">{t("documents.status")}</th>
                <th className="px-4 py-2.5 font-medium">{t("documents.payment")}</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5">
                    <AdminLink
                      href={`/admin/billing/documents/${d.id}`}
                      variant="link"
                      size="sm"
                      className="h-auto px-0 font-medium"
                    >
                      {d.number ?? "—"}
                    </AdminLink>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {DOCUMENT_TYPE_LABELS[d.type]}
                  </td>
                  <td className="px-4 py-2.5">{d.client?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatDate(d.issue_date)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(d.total_amount)}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-2.5">
                    {d.type === "facture" ? <PaymentBadge status={d.payment_status} /> : <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
