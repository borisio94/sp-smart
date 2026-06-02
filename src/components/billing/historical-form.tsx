"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { historicalSchema, type HistoricalInput } from "@/lib/billing/validation";
import { createHistoricalDocument } from "@/app/(admin)/admin/billing/(protected)/historique/actions";
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/billing/format";
import type { Client, Category, DocumentStatus, PaymentStatus } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const STATUSES = Object.keys(DOCUMENT_STATUS_LABELS) as DocumentStatus[];
const PAYMENTS = Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[];

/** Formulaire allégé de saisie d'un document antérieur au site. */
export function HistoricalForm({
  clients,
  categories,
  defaultDate,
}: {
  clients: Client[];
  categories: Category[];
  defaultDate: string;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HistoricalInput>({
    resolver: zodResolver(historicalSchema),
    defaultValues: {
      type: "facture",
      number: "",
      client_id: "",
      category_id: "",
      issue_date: defaultDate,
      title: "",
      total_amount: 0,
      status: "termine",
      payment_status: "paye_total",
    },
    mode: "onTouched",
  });

  function onSubmit(values: HistoricalInput) {
    startTransition(async () => {
      const res = await createHistoricalDocument(values);
      if (res.ok) {
        toast.success(t("historical.created"));
        reset();
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="h-type">{t("documents.type")}</Label>
          <Select id="h-type" className="mt-1" {...register("type")}>
            {DOCUMENT_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {DOCUMENT_TYPE_LABELS[ty]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="h-number">{t("historical.number")}</Label>
          <Input id="h-number" className="mt-1" placeholder={t("historical.numberHint")} {...register("number")} />
        </div>
        <div>
          <Label htmlFor="h-client">{t("documents.client")}</Label>
          <Select id="h-client" className="mt-1" {...register("client_id")}>
            <option value="">{t("documents.chooseClient")}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          {err(errors.client_id?.message)}
        </div>
        <div>
          <Label htmlFor="h-category">{t("documents.category")}</Label>
          <Select id="h-category" className="mt-1" {...register("category_id")}>
            <option value="">{t("documents.noCategory")}</option>
            {categories
              .filter((c) => c.active)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_fr}
                </option>
              ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="h-date">{t("documents.issueDate")}</Label>
          <Input id="h-date" type="date" className="mt-1" {...register("issue_date")} />
          {err(errors.issue_date?.message)}
        </div>
        <div>
          <Label htmlFor="h-total">{t("documents.totalAmount")}</Label>
          <Input id="h-total" type="number" min="0" className="mt-1" {...register("total_amount", { valueAsNumber: true })} />
          {err(errors.total_amount?.message)}
        </div>
        <div>
          <Label htmlFor="h-status">{t("documents.status")}</Label>
          <Select id="h-status" className="mt-1" {...register("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {DOCUMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="h-payment">{t("documents.payment")}</Label>
          <Select id="h-payment" className="mt-1" {...register("payment_status")}>
            {PAYMENTS.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="h-title">{t("documents.docTitle")}</Label>
          <Input id="h-title" className="mt-1" {...register("title")} />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("historical.save")}
      </Button>
    </form>
  );
}
