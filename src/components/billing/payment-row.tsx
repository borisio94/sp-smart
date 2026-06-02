"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deletePayment } from "@/app/(admin)/admin/billing/(protected)/paiements/actions";
import { formatMoney, formatDate, PAYMENT_METHOD_LABELS } from "@/lib/billing/format";
import type { Payment } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";

/** Ligne d'historique d'un paiement, avec suppression. */
export function PaymentRow({ payment }: { payment: Payment }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isRefund = payment.amount < 0;

  function onDelete() {
    if (!window.confirm(t("payments.confirmDelete"))) return;
    startTransition(async () => {
      const res = await deletePayment(payment.id, payment.document_id);
      if (res.ok) {
        toast.success(t("payments.deleted"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <div className="flex-1">
        <span className={isRefund ? "font-medium text-destructive" : "font-medium tabular-nums"}>
          {formatMoney(payment.amount)}
        </span>
        <span className="ml-2 text-muted-foreground">
          {PAYMENT_METHOD_LABELS[payment.method]}
        </span>
        {payment.reference ? (
          <span className="ml-2 text-xs text-muted-foreground">· {payment.reference}</span>
        ) : null}
      </div>
      <span className="text-muted-foreground">{formatDate(payment.received_at)}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        disabled={pending}
        aria-label={t("common.delete")}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}
