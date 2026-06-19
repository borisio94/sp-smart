"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteMovement } from "@/app/(admin)/admin/billing/(protected)/caisse/actions";
import { Button } from "@/components/ui/button";

/** Suppression d'un mouvement de caisse saisi manuellement. */
export function MovementDeleteButton({ id }: { id: string }) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!window.confirm(t("caisse.movementDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteMovement(id);
      if (res.ok) {
        toast.success(t("common.deleted"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onDelete}
      disabled={pending}
      aria-label={t("caisse.movementDelete")}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
