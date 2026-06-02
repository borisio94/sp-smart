"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { categorySchema, type CategoryInput } from "@/lib/billing/validation";
import { createCategory } from "@/app/(admin)/admin/billing/(protected)/parametres/categories/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Formulaire compact d'ajout d'une catégorie d'exécution. */
export function CategoryCreateForm() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: { slug: "", name_fr: "", name_en: "", lucide_icon: "", color: "" },
    mode: "onTouched",
  });

  function onSubmit(values: CategoryInput) {
    startTransition(async () => {
      const res = await createCategory(values);
      if (res.ok) {
        toast.success(t("categories.created"));
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
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
      <div>
        <Label htmlFor="cat-fr">{t("categories.nameFr")}</Label>
        <Input id="cat-fr" className="mt-1" {...register("name_fr")} />
        {err(errors.name_fr?.message)}
      </div>
      <div>
        <Label htmlFor="cat-en">{t("categories.nameEn")}</Label>
        <Input id="cat-en" className="mt-1" {...register("name_en")} />
        {err(errors.name_en?.message)}
      </div>
      <div>
        <Label htmlFor="cat-slug">{t("categories.slug")}</Label>
        <Input id="cat-slug" className="mt-1" placeholder="ex: domotique" {...register("slug")} />
        {err(errors.slug?.message)}
      </div>
      <div>
        <Label htmlFor="cat-icon">{t("categories.icon")}</Label>
        <Input id="cat-icon" className="mt-1" placeholder="ex: zap" {...register("lucide_icon")} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("categories.add")}
        </Button>
      </div>
    </form>
  );
}
