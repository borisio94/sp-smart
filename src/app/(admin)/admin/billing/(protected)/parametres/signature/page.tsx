import { getTranslations } from "next-intl/server";

import { getOrganization } from "@/lib/billing/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/billing/page-header";
import { BrandingUploader } from "@/components/billing/branding-uploader";

/** Génère une URL signée (1h) pour prévisualiser un asset privé du bucket. */
async function signedUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.storage.from("branding").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

/** Paramètres : logo, signature manuscrite et cachet de l'entreprise. */
export default async function SignaturePage() {
  const t = await getTranslations("Admin");
  const org = await getOrganization();

  const [logoUrl, signatureUrl, stampUrl] = await Promise.all([
    signedUrl(org?.logo_url ?? null),
    signedUrl(org?.signature_url ?? null),
    signedUrl(org?.stamp_url ?? null),
  ]);

  return (
    <div>
      <PageHeader title={t("signature.title")} subtitle={t("signature.subtitle")} />

      <div className="grid max-w-4xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <BrandingUploader
          kind="logo"
          title={t("signature.logo")}
          hint={t("signature.logoHint")}
          previewUrl={logoUrl}
        />
        <BrandingUploader
          kind="signature"
          title={t("signature.signature")}
          hint={t("signature.signatureHint")}
          previewUrl={signatureUrl}
        />
        <BrandingUploader
          kind="stamp"
          title={t("signature.stamp")}
          hint={t("signature.stampHint")}
          previewUrl={stampUrl}
        />
      </div>

      <p className="mt-6 max-w-2xl text-sm text-muted-foreground">
        {t("signature.note")}
      </p>
    </div>
  );
}
