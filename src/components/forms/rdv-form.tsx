"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { rdvSchema, type RdvInput } from "@/lib/validation";
import { submitRdv } from "@/app/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HCaptchaField } from "./hcaptcha-field";

type ServiceOption = { id: string; label: string };

export function RdvForm({ services }: { services: ServiceOption[] }) {
  const t = useTranslations("Forms");
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RdvInput>({
    resolver: zodResolver(rdvSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      serviceId: "",
      date: "",
      time: "",
      message: "",
      captchaToken: "",
      company: "",
    },
    mode: "onTouched",
  });

  function onSubmit(values: RdvInput) {
    startTransition(async () => {
      const res = await submitRdv(values);
      if (res.ok) {
        toast.success(t(res.code));
        reset();
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
      className="mx-auto max-w-xl space-y-4"
      noValidate
    >
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...register("company")}
      />

      <div>
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" {...register("name")} />
        {err(errors.name?.message)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div>
        <Label htmlFor="serviceId">
          {t("service")} {t("optional")}
        </Label>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="date">{t("date")}</Label>
          <Input id="date" type="date" {...register("date")} />
          {err(errors.date?.message)}
        </div>
        <div>
          <Label htmlFor="time">{t("time")}</Label>
          <Input id="time" type="time" {...register("time")} />
          {err(errors.time?.message)}
        </div>
      </div>

      <div>
        <Label htmlFor="message">
          {t("message")} {t("optional")}
        </Label>
        <textarea
          id="message"
          rows={4}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register("message")}
        />
      </div>

      <HCaptchaField onVerify={(token) => setValue("captchaToken", token)} />

      <Button type="submit" disabled={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
