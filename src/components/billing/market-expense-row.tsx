"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteMarketExpense } from "@/app/(admin)/admin/billing/(protected)/documents/market-actions";
import { formatMoney, formatDate } from "@/lib/billing/format";
import type { MarketExpense } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";

/** Ligne de charge d'un marché, avec suppression. */
export function MarketExpenseRow({
  expense,
  documentId,
}: {
  expense: MarketExpense;
  documentId: string;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(t("market.confirmDeleteExpense"))) return;
    startTransition(async () => {
      const res = await deleteMarketExpense(expense.id, documentId);
      if (res.ok) {
        toast.success(t("market.expenseDeleted"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <li className="flex items-center gap-3 py-2.5 text-sm">
      <div className="flex-1">
        <span className="font-medium">{expense.reason}</span>
      </div>
      <span className="tabular-nums text-destructive">
        − {formatMoney(expense.amount)}
      </span>
      <span className="text-muted-foreground">{formatDate(expense.occurred_at)}</span>
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
