"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { cashSettingsSchema, type CashSettingsInput } from "@/lib/billing/validation";
import type { CashSettings } from "@/lib/billing/types";
import { updateCashSettings } from "@/app/(admin)/admin/billing/(protected)/parametres/caisse/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Réglages de caisse : fonds initial + ligne rouge (ajustables). */
export function CashSettingsForm({ settings }: { settings: CashSettings | null }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CashSettingsInput>({
    resolver: zodResolver(cashSettingsSchema),
    defaultValues: {
      opening_balance: settings?.opening_balance ?? 0,
      red_line: settings?.red_line ?? 0,
      opening_note: settings?.opening_note ?? "",
    },
    mode: "onTouched",
  });

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  function onSubmit(values: CashSettingsInput) {
    startTransition(async () => {
      const res = await updateCashSettings(values);
      if (res.ok) {
        toast.success(t("caisse.settingsSaved"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cs-opening">{t("caisse.openingBalance")}</Label>
          <Input
            id="cs-opening"
            type="number"
            min="0"
            className="mt-1"
            aria-invalid={errors.opening_balance ? true : undefined}
            {...register("opening_balance", { valueAsNumber: true })}
          />
          {err(errors.opening_balance?.message)}
          <p className="mt-1 text-xs text-muted-foreground">{t("caisse.openingBalanceHint")}</p>
        </div>
        <div>
          <Label htmlFor="cs-redline">{t("caisse.redLine")}</Label>
          <Input
            id="cs-redline"
            type="number"
            min="0"
            className="mt-1"
            aria-invalid={errors.red_line ? true : undefined}
            {...register("red_line", { valueAsNumber: true })}
          />
          {err(errors.red_line?.message)}
          <p className="mt-1 text-xs text-muted-foreground">{t("caisse.redLineHint")}</p>
        </div>
      </div>
      <div>
        <Label htmlFor="cs-note">{t("caisse.openingNote")}</Label>
        <Textarea
          id="cs-note"
          className="mt-1"
          placeholder={t("caisse.openingNotePlaceholder")}
          {...register("opening_note")}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("caisse.saveSettings")}
      </Button>
    </form>
  );
}
