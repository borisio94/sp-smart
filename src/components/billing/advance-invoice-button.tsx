"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FilePlus2 } from "lucide-react";

import { generateAdvanceInvoice } from "@/app/(admin)/admin/billing/(protected)/documents/actions";
import { AdminLink } from "@/components/billing/admin-link";
import { Button } from "@/components/ui/button";

/**
 * Facture d'acompte d'un versement encaissé : lien vers la pièce si elle
 * existe, bouton de génération sinon.
 *
 * Chaque acompte reçu sur un marché peut ainsi obtenir sa facture, datée du
 * jour du versement — y compris longtemps après, sans que les mouvements
 * survenus depuis ne viennent la fausser (cf. `generateAdvanceInvoice`).
 */
export function AdvanceInvoiceButton({
  paymentId,
  invoiceId,
  invoiceNumber,
}: {
  paymentId: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (invoiceId) {
    return (
      <AdminLink
        href={`/admin/billing/documents/${invoiceId}`}
        variant="outline"
        size="sm"
      >
        {invoiceNumber ?? t("payments.openAdvanceInvoice")}
      </AdminLink>
    );
  }

  function onGenerate() {
    startTransition(async () => {
      const res = await generateAdvanceInvoice(paymentId);
      if (res.ok && res.id) {
        toast.success(t("payments.advanceInvoiceCreated"));
        router.push(`/admin/billing/documents/${res.id}`);
        router.refresh();
      } else if (!res.ok) {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onGenerate}
      disabled={pending}
    >
      <FilePlus2 className="size-4" />
      {pending ? t("common.saving") : t("payments.generateAdvanceInvoice")}
    </Button>
  );
}
