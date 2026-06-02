"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  allowedTransitions,
  requiresConfirmation,
  transitionActionKey,
} from "@/lib/billing/status-machine";
import { changeDocumentStatus } from "@/app/(admin)/admin/billing/(protected)/documents/actions";
import type { DocumentStatus } from "@/lib/billing/types";
import { Button } from "@/components/ui/button";

/** Variante visuelle du bouton selon le statut cible. */
function toneFor(to: DocumentStatus): "default" | "secondary" | "outline" | "destructive" {
  if (to === "termine") return "default";
  if (to === "annule") return "destructive";
  if (to === "brouillon") return "outline";
  return "secondary";
}

/**
 * Boutons d'action de transition de statut, affichés selon le statut courant
 * et les transitions autorisées par la machine d'états.
 */
export function StatusActions({
  id,
  status,
}: {
  id: string;
  status: DocumentStatus;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const targets = allowedTransitions(status);
  if (targets.length === 0) return null;

  function onTransition(to: DocumentStatus) {
    if (requiresConfirmation(status, to)) {
      if (!window.confirm(t("status.confirmTransition"))) return;
    }
    startTransition(async () => {
      const res = await changeDocumentStatus(id, to);
      if (res.ok) {
        toast.success(t("status.changed"));
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((to) => (
        <Button
          key={to}
          variant={toneFor(to)}
          size="sm"
          disabled={pending}
          onClick={() => onTransition(to)}
        >
          {t(`status.${transitionActionKey(status, to)}`)}
        </Button>
      ))}
    </div>
  );
}
