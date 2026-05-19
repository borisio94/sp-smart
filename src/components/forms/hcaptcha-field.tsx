"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

const siteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || "";
const enabled = Boolean(siteKey) && siteKey !== "A_REMPLIR";

declare global {
  interface Window {
    hcaptcha?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  }
}

/**
 * Champ hCaptcha (anti-spam). Si la clé n'est pas configurée, ne rend rien
 * et le formulaire reste utilisable (vérification serveur désactivée).
 */
export function HCaptchaField({
  onVerify,
}: {
  onVerify: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (!enabled || rendered.current) return;
    const tryRender = () => {
      if (window.hcaptcha && ref.current && !rendered.current) {
        rendered.current = true;
        window.hcaptcha.render(ref.current, {
          sitekey: siteKey,
          callback: (token: string) => onVerify(token),
          "expired-callback": () => onVerify(""),
        });
      }
    };
    tryRender();
    const id = setInterval(tryRender, 400);
    return () => clearInterval(id);
  }, [onVerify]);

  if (!enabled) return null;

  return (
    <>
      <Script src="https://js.hcaptcha.com/1/api.js" strategy="lazyOnload" />
      <div ref={ref} className="my-2" />
    </>
  );
}

/** Permet aux formulaires de savoir si le captcha est requis côté client. */
export const captchaEnabled = enabled;
