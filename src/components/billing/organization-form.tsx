"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { organizationSchema, type OrganizationInput } from "@/lib/billing/validation";
import { updateOrganization } from "@/app/(admin)/admin/billing/(protected)/parametres/actions";
import type { Organization } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Formulaire d'édition des coordonnées de la boutique (organizations). */
export function OrganizationForm({ organization }: { organization: Organization }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name ?? "",
      legal_form: organization.legal_form ?? "",
      slogan: organization.slogan ?? "",
      niu: organization.niu ?? "",
      rccm: organization.rccm ?? "",
      capital: organization.capital ?? "",
      address: organization.address ?? "",
      phone: organization.phone ?? "",
      email: organization.email ?? "",
      website: organization.website ?? "",
      facebook: organization.facebook ?? "",
      bank_name: organization.bank_name ?? "",
      bank_account: organization.bank_account ?? "",
      bank_bic: organization.bank_bic ?? "",
      momo_mtn: organization.momo_mtn ?? "",
      momo_orange: organization.momo_orange ?? "",
      fiscal_regime: organization.fiscal_regime ?? "",
      default_tax_rate: organization.default_tax_rate ?? 0,
      default_payment_terms: organization.default_payment_terms ?? "",
      default_delivery_terms: organization.default_delivery_terms ?? "",
    },
    mode: "onTouched",
  });

  function onSubmit(values: OrganizationInput) {
    startTransition(async () => {
      const res = await updateOrganization(values);
      if (res.ok) {
        toast.success(t("organization.saved"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  const field = (
    id: keyof OrganizationInput,
    label: string,
    opts?: { type?: string; full?: boolean; area?: boolean },
  ) => (
    <div className={opts?.full ? "sm:col-span-2" : undefined}>
      <Label htmlFor={`org-${id}`}>{label}</Label>
      {opts?.area ? (
        <Textarea id={`org-${id}`} className="mt-1" {...register(id)} />
      ) : (
        <Input id={`org-${id}`} type={opts?.type ?? "text"} className="mt-1" {...register(id)} />
      )}
      {err(errors[id]?.message)}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
      {/* Identité */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("organization.identity")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", t("organization.name"), { full: true })}
          {field("slogan", t("organization.slogan"), { full: true })}
          {field("legal_form", t("organization.legalForm"))}
          {field("capital", t("organization.capital"))}
          {field("niu", t("organization.niu"))}
          {field("rccm", t("organization.rccm"))}
          {field("fiscal_regime", t("organization.fiscalRegime"))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("organization.contact")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("address", t("organization.address"), { full: true })}
          {field("phone", t("organization.phone"))}
          {field("email", t("organization.email"), { type: "email" })}
          {field("website", t("organization.website"))}
          {field("facebook", t("organization.facebook"))}
        </div>
      </section>

      {/* Coordonnées bancaires */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("organization.banking")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("bank_name", t("organization.bankName"))}
          {field("bank_bic", t("organization.bankBic"))}
          {field("bank_account", t("organization.bankAccount"), { full: true })}
          {field("momo_mtn", t("organization.momoMtn"))}
          {field("momo_orange", t("organization.momoOrange"))}
        </div>
      </section>

      {/* Modèles par défaut */}
      <section>
        <h3 className="mb-3 text-sm font-semibold">{t("organization.defaults")}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="org-default_tax_rate">{t("organization.defaultTaxRate")}</Label>
            <Input
              id="org-default_tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="mt-1"
              {...register("default_tax_rate", { valueAsNumber: true })}
            />
            {err(errors.default_tax_rate?.message)}
          </div>
          <div />
          {field("default_payment_terms", t("documents.paymentTerms"), { area: true, full: true })}
          {field("default_delivery_terms", t("documents.deliveryTerms"), { area: true, full: true })}
        </div>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}
