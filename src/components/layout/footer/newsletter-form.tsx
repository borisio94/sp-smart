"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Formulaire d'inscription à la newsletter.
 * L'envoi réel sera branché en Phase 6 (Resend / Sanity).
 */
export function NewsletterForm() {
  const t = useTranslations("Footer");
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO Phase 6 : envoyer l'email côté serveur
    setDone(true);
  }

  if (done) {
    return (
      <p className="text-sm text-white/80">{t("newsletterSuccess")}</p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        type="email"
        required
        placeholder={t("newsletterPlaceholder")}
        aria-label={t("newsletterPlaceholder")}
        className="bg-white text-foreground"
      />
      <Button type="submit" variant="secondary">
        {t("newsletterButton")}
      </Button>
    </form>
  );
}
