"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileCheck2 } from "lucide-react";

import { generateFinalInvoice } from "@/app/(admin)/admin/billing/(protected)/documents/actions";
import { AdminLink } from "@/components/billing/admin-link";
import { Button } from "@/components/ui/button";

/**
 * Clôture du règlement : le marché est entièrement encaissé, on génère (ou on
 * rouvre) la facture définitive qui déduit chaque acompte versé.
 */
export function FinalInvoiceButton({
  documentId,
  finalInvoiceId,
}: {
  documentId: string;
  finalInvoiceId: string | null;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (finalInvoiceId) {
    return (
      <AdminLink
        href={`/admin/billing/documents/${finalInvoiceId}`}
        variant="outline"
        size="sm"
      >
        {t("payments.openFinalInvoice")}
      </AdminLink>
    );
  }

  function onGenerate() {
    startTransition(async () => {
      const res = await generateFinalInvoice(documentId);
      if (res.ok && res.id) {
        toast.success(t("payments.finalInvoiceCreated"));
        router.push(`/admin/billing/documents/${res.id}`);
        router.refresh();
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button type="button" size="sm" onClick={onGenerate} disabled={pending}>
      <FileCheck2 className="size-4" />
      {pending ? t("common.saving") : t("payments.generateFinalInvoice")}
    </Button>
  );
}
