import { getTranslations } from "next-intl/server";

import { listClients } from "@/lib/billing/queries";
import { CLIENT_TYPE_LABELS } from "@/lib/billing/format";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { Badge } from "@/components/ui/badge";

/** Liste du carnet de clients (CRM léger), avec recherche par nom. */
export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const t = await getTranslations("Admin");
  const { q } = await searchParams;
  const clients = await listClients(q);

  return (
    <div>
      <PageHeader
        title={t("clients.title")}
        subtitle={t("clients.subtitle")}
        actionLabel={t("clients.new")}
        actionHref="/admin/billing/clients/nouveau"
      />

      <form className="mb-4 max-w-sm" action="/admin/billing/clients" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("clients.searchPlaceholder")}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </form>

      {clients.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          {t("clients.empty")}
        </p>
      ) : (
        <>
        {/* Vue mobile : cartes empilées */}
        <ul className="space-y-3 md:hidden">
          {clients.map((c) => (
            <li key={c.id} className="rounded-xl ring-1 ring-foreground/10">
              <AdminLink
                href={`/admin/billing/clients/${c.id}`}
                variant="ghost"
                size="default"
                className="block h-auto w-full rounded-xl p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{c.name}</span>
                  <Badge tone="neutral">{CLIENT_TYPE_LABELS[c.type]}</Badge>
                </div>
                {c.ref ? (
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{c.ref}</div>
                ) : null}
                <div className="mt-1 text-sm text-muted-foreground">
                  {[c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                </div>
              </AdminLink>
            </li>
          ))}
        </ul>

        {/* Vue desktop : tableau */}
        <div className="hidden overflow-hidden rounded-xl ring-1 ring-foreground/10 md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("clients.ref")}</th>
                <th className="px-4 py-2.5 font-medium">{t("clients.name")}</th>
                <th className="px-4 py-2.5 font-medium">{t("clients.type")}</th>
                <th className="px-4 py-2.5 font-medium">{t("clients.phone")}</th>
                <th className="px-4 py-2.5 font-medium">{t("clients.email")}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border transition-colors hover:bg-muted/40"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {c.ref ?? "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <AdminLink
                      href={`/admin/billing/clients/${c.id}`}
                      variant="link"
                      size="sm"
                      className="h-auto px-0"
                    >
                      {c.name}
                    </AdminLink>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone="neutral">{CLIENT_TYPE_LABELS[c.type]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.phone ?? "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{c.email ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
