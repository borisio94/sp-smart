"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { clientSchema, type ClientInput } from "@/lib/billing/validation";
import {
  createClient,
  updateClient,
} from "@/app/(admin)/admin/billing/(protected)/clients/actions";
import type { Client } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/** Formulaire de création / édition d'un client. */
export function ClientForm({ client }: { client?: Client }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(client);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name ?? "",
      type: client?.type ?? "particulier",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      whatsapp: client?.whatsapp ?? "",
      address: client?.address ?? "",
      contact_person: client?.contact_person ?? "",
      notes: client?.notes ?? "",
    },
    mode: "onTouched",
  });

  function onSubmit(values: ClientInput) {
    startTransition(async () => {
      const res = isEdit
        ? await updateClient(client!.id, values)
        : await createClient(values);
      if (res.ok) {
        toast.success(isEdit ? t("clients.updated") : t("clients.created"));
        router.push(res.id ? `/admin/billing/clients/${res.id}` : "/admin/billing/clients");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="cl-name">{t("clients.name")}</Label>
          <Input id="cl-name" className="mt-1" {...register("name")} />
          {err(errors.name?.message)}
        </div>

        <div>
          <Label htmlFor="cl-type">{t("clients.type")}</Label>
          <Select id="cl-type" className="mt-1" {...register("type")}>
            <option value="particulier">{t("clients.typeParticulier")}</option>
            <option value="entreprise">{t("clients.typeEntreprise")}</option>
            <option value="institution">{t("clients.typeInstitution")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="cl-contact">{t("clients.contactPerson")}</Label>
          <Input id="cl-contact" className="mt-1" {...register("contact_person")} />
        </div>

        <div>
          <Label htmlFor="cl-email">{t("clients.email")}</Label>
          <Input id="cl-email" type="email" className="mt-1" {...register("email")} />
          {err(errors.email?.message)}
        </div>
        <div>
          <Label htmlFor="cl-phone">{t("clients.phone")}</Label>
          <Input id="cl-phone" className="mt-1" {...register("phone")} />
        </div>

        <div>
          <Label htmlFor="cl-whatsapp">{t("clients.whatsapp")}</Label>
          <Input id="cl-whatsapp" className="mt-1" {...register("whatsapp")} />
        </div>
        <div>
          <Label htmlFor="cl-address">{t("clients.address")}</Label>
          <Input id="cl-address" className="mt-1" {...register("address")} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="cl-notes">{t("clients.notes")}</Label>
          <Textarea id="cl-notes" className="mt-1" {...register("notes")} />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("common.save")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
