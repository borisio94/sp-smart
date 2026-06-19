"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import {
  toggleExpenseCategory,
  deleteExpenseCategory,
} from "@/app/(admin)/admin/billing/(protected)/parametres/caisse/actions";
import { Button } from "@/components/ui/button";

/** Actions sur une catégorie de dépense : activer/désactiver + supprimer. */
export function ExpenseCategoryRow({ id, active }: { id: string; active: boolean }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      const res = await toggleExpenseCategory(id, !active);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function onDelete() {
    if (!window.confirm(t("caisse.categoryDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteExpenseCategory(id);
      if (res.ok) {
        toast.success(t("common.deleted"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={active ? "outline" : "secondary"}
        size="sm"
        onClick={onToggle}
        disabled={pending}
      >
        {active ? t("categories.deactivate") : t("categories.activate")}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onDelete}
        disabled={pending}
        aria-label={t("caisse.categoryDelete")}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}
