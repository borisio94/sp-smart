"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  marketPayoutSchema,
  type MarketPayoutInput,
} from "@/lib/billing/validation";
import { payMarketToCash } from "@/app/(admin)/admin/billing/(protected)/documents/market-actions";
import { formatMoney, PAYMENT_METHOD_LABELS } from "@/lib/billing/format";
import type { PaymentMethod } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

/**
 * Versement du net d'un marché vers la caisse.
 *
 * Le montant proposé est le disponible restant — jamais la marge : tant que le
 * client n'a pas tout réglé, une partie du marché n'existe pas en trésorerie.
 * Dépasser reste possible, mais exige une confirmation chiffrée, comme le
 * franchissement de la ligne rouge.
 */
export function MarketPayoutForm({
  documentId,
  defaultDate,
  suggestedAmount,
}: {
  documentId: string;
  defaultDate: string;
  suggestedAmount: number;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarketPayoutInput>({
    resolver: zodResolver(marketPayoutSchema),
    defaultValues: {
      amount: suggestedAmount > 0 ? suggestedAmount : 0,
      occurred_at: defaultDate,
      method: "especes",
      reference: "",
    },
    mode: "onTouched",
  });

  function onSubmit(values: MarketPayoutInput) {
    startTransition(async () => {
      let res = await payMarketToCash(documentId, { ...values, confirmed: false });
      // Dépassement du disponible → avertissement chiffré puis confirmation.
      if (!res.ok && res.needsConfirm) {
        const confirmed = window.confirm(
          t("market.payoutWarn", {
            amount: formatMoney(values.amount),
            remaining: formatMoney(res.remaining ?? 0),
          }),
        );
        if (!confirmed) return;
        res = await payMarketToCash(documentId, { ...values, confirmed: true });
      }
      if (res.ok) {
        toast.success(t("market.payoutDone"));
        reset({
          amount: 0,
          occurred_at: values.occurred_at,
          method: values.method,
          reference: "",
        });
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
        <div>
          <Label htmlFor="mp-amount">{t("market.amount")}</Label>
          <Input
            id="mp-amount"
            type="number"
            step="1"
            className="mt-1"
            {...register("amount", { valueAsNumber: true })}
          />
          {err(errors.amount?.message)}
        </div>
        <div>
          <Label htmlFor="mp-date">{t("market.date")}</Label>
          <Input
            id="mp-date"
            type="date"
            className="mt-1"
            {...register("occurred_at")}
          />
          {err(errors.occurred_at?.message)}
        </div>
        <div>
          <Label htmlFor="mp-method">{t("market.method")}</Label>
          <Select id="mp-method" className="mt-1" {...register("method")}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="mp-ref">{t("market.reference")}</Label>
          <Input id="mp-ref" className="mt-1" {...register("reference")} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("market.payToCash")}
      </Button>
    </form>
  );
}
