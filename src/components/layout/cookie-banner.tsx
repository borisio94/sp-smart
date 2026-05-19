"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sp-smart-cookie-consent";

/**
 * Bannière de consentement aux cookies (RGPD).
 * Le choix ("accepted" / "rejected") est conservé dans le navigateur.
 */
export function CookieBanner() {
  const t = useTranslations("Cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorage n'existe pas côté serveur : lecture unique au montage
    // pour éviter une différence d'hydratation. Cas légitime et ponctuel.
    if (!localStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  function decide(choice: "accepted" | "rejected") {
    localStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("message")}{" "}
          <Link
            href="/politique-confidentialite"
            className="underline hover:text-foreground"
          >
            {t("learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => decide("rejected")}
          >
            {t("reject")}
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
