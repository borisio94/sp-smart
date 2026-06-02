"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type DeleteAction = (id: string) => Promise<{ ok: boolean; error?: string }>;

/**
 * Bouton de suppression générique avec confirmation native.
 * `redirectTo` permet de revenir à la liste après suppression.
 */
export function DeleteButton({
  id,
  action,
  redirectTo,
  label,
}: {
  id: string;
  action: DeleteAction;
  redirectTo?: string;
  label?: string;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(t("common.confirmDelete"))) return;
    startTransition(async () => {
      const res = await action(id);
      if (res.ok) {
        toast.success(t("common.deleted"));
        if (redirectTo) router.push(redirectTo);
        router.refresh();
      } else {
        toast.error(res.error ?? t("common.error"));
      }
    });
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete} disabled={pending}>
      <Trash2 className="size-4" />
      {label ?? t("common.delete")}
    </Button>
  );
}
