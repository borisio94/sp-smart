"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { paymentSchema, type PaymentInput } from "@/lib/billing/validation";
import { recordPayment } from "@/app/(admin)/admin/billing/(protected)/paiements/actions";
import { PAYMENT_METHOD_LABELS } from "@/lib/billing/format";
import type { PaymentMethod } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

/** Formulaire d'enregistrement d'un paiement sur une facture. */
export function PaymentRecorder({
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
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: suggestedAmount > 0 ? suggestedAmount : 0,
      method: "momo_mtn",
      reference: "",
      received_at: defaultDate,
      notes: "",
    },
    mode: "onTouched",
  });

  function onSubmit(values: PaymentInput) {
    startTransition(async () => {
      const res = await recordPayment(documentId, values);
      if (res.ok) {
        toast.success(
          res.receiptId ? t("payments.recordedWithReceipt") : t("payments.recorded"),
        );
        reset({
          amount: 0,
          method: values.method,
          reference: "",
          received_at: values.received_at,
          notes: "",
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
          <Label htmlFor="p-amount">{t("payments.amount")}</Label>
          <Input
            id="p-amount"
            type="number"
            step="1"
            className="mt-1"
            {...register("amount", { valueAsNumber: true })}
          />
          {err(errors.amount?.message)}
          <p className="mt-1 text-xs text-muted-foreground">{t("payments.negativeHint")}</p>
        </div>
        <div>
          <Label htmlFor="p-method">{t("payments.method")}</Label>
          <Select id="p-method" className="mt-1" {...register("method")}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="p-date">{t("payments.date")}</Label>
          <Input id="p-date" type="date" className="mt-1" {...register("received_at")} />
          {err(errors.received_at?.message)}
        </div>
        <div>
          <Label htmlFor="p-ref">{t("payments.reference")}</Label>
          <Input id="p-ref" className="mt-1" placeholder={t("payments.referenceHint")} {...register("reference")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="p-notes">{t("payments.notes")}</Label>
          <Textarea id="p-notes" className="mt-1" {...register("notes")} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("payments.record")}
      </Button>
    </form>
  );
}
