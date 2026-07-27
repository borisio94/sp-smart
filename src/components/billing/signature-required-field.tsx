"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";

/**
 * Case « Demander la signature électronique du client », commune à TOUS les
 * types de documents (devis, facture, bon de commande, rapport de maintenance,
 * types personnalisés…) : c'est l'émetteur qui décide au cas par cas.
 *
 * Affiche aussi l'avertissement quand le document a déjà été signé, puisque
 * l'enregistrement d'une modification annule la signature en place.
 */
export function SignatureRequiredField({
  field,
  signedAt,
  className = "flex items-start gap-2 text-sm",
}: {
  field: UseFormRegisterReturn;
  signedAt?: string | null;
  className?: string;
}) {
  const t = useTranslations("Admin");

  return (
    <>
      <label className={className}>
        <input type="checkbox" className="mt-0.5" {...field} />
        <span>
          <span className="font-medium">{t("documents.signatureRequired")}</span>
          <span className="mt-0.5 block text-muted-foreground">
            {t("documents.signatureRequiredHint")}
          </span>
        </span>
      </label>
      {/* Le document a déjà été signé : l'enregistrer annulera la signature. */}
      {signedAt ? (
        <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {t("documents.signatureVoidWarning")}
        </p>
      ) : null}
    </>
  );
}
