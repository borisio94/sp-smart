"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  maintenanceContractSchema,
  type MaintenanceContractInput,
} from "@/lib/billing/validation";
import { saveMaintenanceContract } from "@/app/(admin)/admin/billing/(protected)/documents/market-actions";
import type {
  MaintenanceContract,
  MaintenancePeriodicity,
} from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const PERIODICITIES: MaintenancePeriodicity[] = [
  "mensuel",
  "trimestriel",
  "semestriel",
  "annuel",
];

/**
 * Contrat de maintenance d'un chantier : activation et conditions.
 *
 * Les champs ne s'affichent que contrat actif — les renseigner pour un contrat
 * désactivé n'aurait pas de sens. Ils restent toutefois enregistrés en base :
 * couper puis rétablir un contrat ne fait pas perdre ses conditions.
 */
export function MaintenanceContractForm({
  documentId,
  contract,
}: {
  documentId: string;
  contract: MaintenanceContract | null;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MaintenanceContractInput>({
    resolver: zodResolver(maintenanceContractSchema),
    defaultValues: {
      active: contract?.active ?? false,
      start_date: contract?.start_date ?? "",
      end_date: contract?.end_date ?? "",
      amount: contract?.amount ?? 0,
      periodicity: contract?.periodicity ?? "annuel",
      notes: contract?.notes ?? "",
    },
    mode: "onTouched",
  });

  const active = watch("active");

  function onSubmit(values: MaintenanceContractInput) {
    startTransition(async () => {
      const res = await saveMaintenanceContract(documentId, values);
      if (res.ok) {
        toast.success(t("maintenance.saved"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5" {...register("active")} />
        <span>
          <span className="font-medium">{t("maintenance.activate")}</span>
          <span className="block text-xs text-muted-foreground">
            {t("maintenance.activateHint")}
          </span>
        </span>
      </label>

      {active ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="mc-start">{t("maintenance.startDate")}</Label>
            <Input
              id="mc-start"
              type="date"
              className="mt-1"
              {...register("start_date")}
            />
            {err(errors.start_date?.message)}
          </div>
          <div>
            <Label htmlFor="mc-end">{t("maintenance.endDate")}</Label>
            <Input
              id="mc-end"
              type="date"
              className="mt-1"
              {...register("end_date")}
            />
            {err(errors.end_date?.message)}
          </div>
          <div>
            <Label htmlFor="mc-amount">{t("maintenance.amount")}</Label>
            <Input
              id="mc-amount"
              type="number"
              step="1"
              className="mt-1"
              {...register("amount", { valueAsNumber: true })}
            />
            {err(errors.amount?.message)}
          </div>
          <div>
            <Label htmlFor="mc-periodicity">{t("maintenance.periodicity")}</Label>
            <Select id="mc-periodicity" className="mt-1" {...register("periodicity")}>
              {PERIODICITIES.map((p) => (
                <option key={p} value={p}>
                  {t(`maintenance.periodicity_${p}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="mc-notes">{t("maintenance.notes")}</Label>
            <Textarea id="mc-notes" className="mt-1" {...register("notes")} />
          </div>
        </div>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
