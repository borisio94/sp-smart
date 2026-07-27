"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  clientSignatureSchema,
  type ClientSignatureInput,
} from "@/lib/billing/validation";
import { PUBLIC_DOC_LABELS as L } from "@/lib/billing/public-labels";
import { HCaptchaField } from "@/components/forms/hcaptcha-field";
import { SignaturePad } from "./signature-pad";

/**
 * Bloc « Bon pour accord » de la page publique : le client saisit son nom,
 * trace sa signature et valide. L'enregistrement passe par le route handler
 * `/facture-privee/[token]/signer` (clé service role côté serveur) ; aucune
 * écriture n'est ouverte au rôle anon.
 */
export function ClientSignatureBlock({ token }: { token: string }) {
  const router = useRouter();
  // PNG du tracé, remonté par le pad à la fin de chaque trait.
  const [signature, setSignature] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClientSignatureInput>({
    resolver: zodResolver(clientSignatureSchema),
    defaultValues: {
      name: "",
      email: "",
      // Le tracé est injecté au moment de la soumission (il vient du canvas).
      signature: "",
      captchaToken: "",
    },
    mode: "onTouched",
  });

  function onSubmit(values: ClientSignatureInput) {
    setServerError(null);
    if (!signature) {
      setServerError(L.signEmptyError);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/facture-privee/${token}/signer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...values, signature }),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !data.ok) {
          setServerError(data.error || L.signGenericError);
          return;
        }
        // Recharge la page serveur : elle affichera l'état « déjà signé ».
        router.refresh();
      } catch {
        setServerError(L.signGenericError);
      }
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="mt-6 rounded-2xl bg-background p-5 ring-1 ring-foreground/10"
    >
      <h2 className="text-base font-semibold uppercase tracking-wide">{L.signTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{L.signIntro}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sig-name" className="text-sm font-medium">
            {L.signName}
          </label>
          <input
            id="sig-name"
            autoComplete="name"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("name")}
          />
          {err(errors.name?.message)}
        </div>
        <div>
          <label htmlFor="sig-email" className="text-sm font-medium">
            {L.signEmail}
          </label>
          <input
            id="sig-email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("email")}
          />
          {err(errors.email?.message)}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-sm font-medium">{L.signDrawLabel}</span>
        <div className="mt-1">
          <SignaturePad
            onChange={setSignature}
            disabled={pending}
            clearLabel={L.signClear}
            placeholder={L.signPlaceholder}
          />
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5" {...register("accept")} />
        <span>{L.signAccept}</span>
      </label>
      {err(errors.accept?.message)}

      <HCaptchaField onVerify={(t) => setValue("captchaToken", t)} />

      {serverError ? (
        <p className="mt-3 text-sm text-destructive">{serverError}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !signature}
        className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50 sm:w-auto"
      >
        {pending ? L.signPending : L.signSubmit}
      </button>

      <p className="mt-3 text-xs text-muted-foreground">{L.signLegal}</p>
    </form>
  );
}
