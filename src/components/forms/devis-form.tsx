"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { devisSchema, type DevisInput } from "@/lib/validation";
import { submitDevis } from "@/app/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HCaptchaField } from "./hcaptcha-field";

type ServiceOption = { id: string; label: string };

export function DevisForm({
  services,
  initialServiceId = "",
}: {
  services: ServiceOption[];
  initialServiceId?: string;
}) {
  const t = useTranslations("Forms");
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();

  const form = useForm<DevisInput>({
    resolver: zodResolver(devisSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceId: initialServiceId,
      description: "",
      captchaToken: "",
      company: "",
    },
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    reset,
    formState: { errors },
  } = form;

  async function next() {
    const fields =
      step === 1
        ? (["serviceId"] as const)
        : (["description"] as const);
    if (await trigger(fields)) setStep((s) => s + 1);
  }

  function onSubmit(values: DevisInput) {
    startTransition(async () => {
      const res = await submitDevis(values);
      if (res.ok) {
        toast.success(t(res.code));
        reset();
        setStep(1);
      } else {
        toast.error(t(res.code));
      }
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto max-w-xl space-y-6"
      noValidate
    >
      <p className="text-sm text-muted-foreground">
        {t("step", { current: step, total: 3 })}
      </p>

      {/* Honeypot anti-bot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...register("company")}
      />

      {step === 1 && (
        <div>
          <Label htmlFor="serviceId">{t("service")}</Label>
          <select
            id="serviceId"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("serviceId")}
          >
            <option value="">{t("selectService")}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {err(errors.serviceId?.message)}
          <Button type="button" className="mt-6" onClick={next}>
            {t("next")}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <Label htmlFor="description">{t("description")}</Label>
          <textarea
            id="description"
            rows={6}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("description")}
          />
          {err(errors.description?.message)}
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
            >
              {t("back")}
            </Button>
            <Button type="button" onClick={next}>
              {t("next")}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <Input id="name" {...register("name")} />
            {err(errors.name?.message)}
          </div>
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" type="email" {...register("email")} />
            {err(errors.email?.message)}
          </div>
          <div>
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input id="phone" {...register("phone")} />
            {err(errors.phone?.message)}
          </div>

          <HCaptchaField
            onVerify={(token) => setValue("captchaToken", token)}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
            >
              {t("back")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("sending") : t("submit")}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
