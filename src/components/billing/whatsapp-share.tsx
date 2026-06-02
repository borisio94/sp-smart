"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, MessageCircle } from "lucide-react";

import { DOCUMENT_TYPE_LABELS, formatMoney, formatDate } from "@/lib/billing/format";
import type { DocumentType } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";

/** Nettoie un numéro de téléphone pour wa.me (chiffres uniquement). */
function waNumber(phone: string | null): string {
  return (phone ?? "").replace(/[^0-9]/g, "");
}

/**
 * Boutons de partage : copie le lien privé et ouvre WhatsApp avec un message
 * pré-rempli (Bonjour [client], voici votre [type] N° [numéro] : [lien]…).
 */
export function WhatsAppShare({
  shareToken,
  type,
  number,
  clientName,
  clientPhone,
  totalAmount,
  validityDate,
  siteUrl,
}: {
  shareToken: string;
  type: DocumentType;
  number: string | null;
  clientName: string | null;
  clientPhone: string | null;
  totalAmount: number;
  validityDate: string | null;
  siteUrl: string;
}) {
  const t = useTranslations("Admin");
  const [copied, setCopied] = useState(false);

  const link = `${siteUrl}/facture-privee/${shareToken}`;
  const typeLabel = DOCUMENT_TYPE_LABELS[type];

  const lines = [
    `Bonjour ${clientName ?? ""},`,
    "",
    `Veuillez trouver votre ${typeLabel.toLowerCase()} N° ${number ?? ""} :`,
    link,
    "",
    `Montant : ${formatMoney(totalAmount)}`,
  ];
  if ((type === "devis" || type === "proforma") && validityDate) {
    lines.push(`Validité : ${formatDate(validityDate)}`);
  }
  lines.push("", "Cordialement,", "L'équipe SP Smart Sarl");
  const message = lines.join("\n");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t("share.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error"));
    }
  }

  const num = waNumber(clientPhone);
  const waHref = `https://wa.me/${num}?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={copyLink}>
        <Copy className="size-4" />
        {copied ? t("share.copied") : t("share.copyLink")}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        nativeButton={false}
        render={
          <a href={waHref} target="_blank" rel="noreferrer" />
        }
      >
        <MessageCircle className="size-4" />
        {t("share.whatsapp")}
      </Button>
    </div>
  );
}
