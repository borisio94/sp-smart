import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/billing/page-header";
import { ChangePasswordForm } from "@/components/billing/change-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** Changement du mot de passe de l'utilisateur connecté. */
export default async function MotDePassePage() {
  const t = await getTranslations("Admin");

  return (
    <div>
      <PageHeader title={t("password.title")} subtitle={t("password.subtitle")} />

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>{t("password.cardTitle")}</CardTitle>
          <CardDescription>{t("password.cardSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
