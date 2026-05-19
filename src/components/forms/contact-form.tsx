"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { contactSchema, type ContactInput } from "@/lib/validation";
import { submitContact } from "@/app/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HCaptchaField } from "./hcaptcha-field";

export function ContactForm() {
  const t = useTranslations("Forms");
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      captchaToken: "",
      company: "",
    },
    mode: "onTouched",
  });

  function onSubmit(values: ContactInput) {
    startTransition(async () => {
      const res = await submitContact(values);
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
        {...register("company")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-name">{t("name")}</Label>
          <Input id="c-name" {...register("name")} />
          {err(errors.name?.message)}
        </div>
        <div>
          <Label htmlFor="c-email">{t("email")}</Label>
          <Input id="c-email" type="email" {...register("email")} />
          {err(errors.email?.message)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="c-phone">
            {t("phone")} {t("optional")}
          </Label>
          <Input id="c-phone" {...register("phone")} />
          {err(errors.phone?.message)}
        </div>
        <div>
          <Label htmlFor="c-subject">{t("subject")}</Label>
          <Input id="c-subject" {...register("subject")} />
          {err(errors.subject?.message)}
        </div>
      </div>

      <div>
        <Label htmlFor="c-message">{t("message")}</Label>
        <textarea
          id="c-message"
          rows={5}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register("message")}
        />
        {err(errors.message?.message)}
      </div>

      <HCaptchaField onVerify={(token) => setValue("captchaToken", token)} />

      <Button type="submit" disabled={pending}>
        {pending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
