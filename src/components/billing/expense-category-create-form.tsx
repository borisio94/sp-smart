"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createExpenseCategory } from "@/app/(admin)/admin/billing/(protected)/parametres/caisse/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Ajout compact d'une catégorie de dépense. */
export function ExpenseCategoryCreateForm() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (clean.length < 2) {
      toast.error(t("caisse.categoryNameInvalid"));
      return;
    }
    startTransition(async () => {
      const res = await createExpenseCategory(clean);
      if (res.ok) {
        toast.success(t("caisse.categoryCreated"));
        setName("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <div>
        <Label htmlFor="ec-name">{t("caisse.categoryName")}</Label>
        <Input
          id="ec-name"
          className="mt-1"
          placeholder={t("caisse.categoryNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("categories.add")}
      </Button>
    </form>
  );
}
