import { getTranslations } from "next-intl/server";

import { getOrganization } from "@/lib/billing/queries";
import { PageHeader } from "@/components/billing/page-header";
import { AdminLink } from "@/components/billing/admin-link";
import { OrganizationForm } from "@/components/billing/organization-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Paramètres : coordonnées de la boutique + accès aux sous-réglages. */
export default async function ParametresPage() {
  const t = await getTranslations("Admin");
  const organization = await getOrganization();

  return (
    <div>
      <PageHeader title={t("settingsPage.title")} subtitle={t("settingsPage.subtitle")} />

      {/* Accès rapides aux autres réglages */}
      <div className="mb-6 flex flex-wrap gap-3">
        <AdminLink href="/admin/billing/parametres/signature" variant="outline" size="sm">
          {t("settingsPage.linkBranding")}
        </AdminLink>
        <AdminLink href="/admin/billing/parametres/categories" variant="outline" size="sm">
          {t("settingsPage.linkCategories")}
        </AdminLink>
        <AdminLink href="/admin/billing/parametres/caisse" variant="outline" size="sm">
          {t("settingsPage.linkCaisse")}
        </AdminLink>
        <AdminLink href="/admin/billing/parametres/mot-de-passe" variant="outline" size="sm">
          {t("settingsPage.linkPassword")}
        </AdminLink>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("organization.title")}</CardTitle>
          <CardDescription>{t("organization.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {organization ? (
            <OrganizationForm organization={organization} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("organization.missing")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
