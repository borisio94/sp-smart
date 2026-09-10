"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  marketExpenseSchema,
  type MarketExpenseInput,
} from "@/lib/billing/validation";
import { createMarketExpense } from "@/app/(admin)/admin/billing/(protected)/documents/market-actions";
import type { MarketPhase } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Formulaire d'ajout d'une charge à un marché (raison obligatoire).
 *
 * La phase n'est pas un choix offert à la saisie : elle vient de la section qui
 * accueille le formulaire (travaux ou après-vente). Un sélecteur inviterait à
 * se tromper de nature, et une charge mal classée fausse durablement la marge
 * du chantier.
 */
export function MarketExpenseForm({
  documentId,
  defaultDate,
  phase,
}: {
  documentId: string;
  defaultDate: string;
  phase: MarketPhase;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const idPrefix = `me-${phase}`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarketExpenseInput>({
    resolver: zodResolver(marketExpenseSchema),
    defaultValues: { reason: "", amount: 0, occurred_at: defaultDate, phase },
    mode: "onTouched",
  });

  function onSubmit(values: MarketExpenseInput) {
    startTransition(async () => {
      const res = await createMarketExpense(documentId, { ...values, phase });
      if (res.ok) {
        toast.success(t("market.expenseAdded"));
        reset({ reason: "", amount: 0, occurred_at: values.occurred_at, phase });
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-reason`}>{t("market.reason")}</Label>
          <Input
            id={`${idPrefix}-reason`}
            className="mt-1"
            placeholder={
              phase === "panne"
                ? t("market.reasonHintBreakdown")
                : t("market.reasonHint")
            }
            {...register("reason")}
          />
          {err(errors.reason?.message)}
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-amount`}>{t("market.amount")}</Label>
          <Input
            id={`${idPrefix}-amount`}
            type="number"
            step="1"
            className="mt-1"
            {...register("amount", { valueAsNumber: true })}
          />
          {err(errors.amount?.message)}
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-date`}>{t("market.date")}</Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            className="mt-1"
            {...register("occurred_at")}
          />
          {err(errors.occurred_at?.message)}
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("market.addExpense")}
      </Button>
    </form>
  );
}
