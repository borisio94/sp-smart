"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { toggleCategory } from "@/app/(admin)/admin/billing/(protected)/parametres/categories/actions";
import { Button } from "@/components/ui/button";

/** Bouton d'activation/désactivation d'une catégorie. */
export function CategoryToggle({ id, active }: { id: string; active: boolean }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      const res = await toggleCategory(id, !active);
      if (res.ok) {
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      variant={active ? "outline" : "secondary"}
      size="sm"
      onClick={onToggle}
      disabled={pending}
    >
      {active ? t("categories.deactivate") : t("categories.activate")}
    </Button>
  );
}
