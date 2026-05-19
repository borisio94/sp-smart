const secret = process.env.HCAPTCHA_SECRET_KEY || "";

/** Vrai si hCaptcha est réellement configuré. */
export const isCaptchaEnabled =
  Boolean(secret) && secret !== "A_REMPLIR";

/**
 * Vérifie un jeton hCaptcha côté serveur.
 * Si hCaptcha n'est pas configuré, on considère la vérification réussie
 * (le site reste utilisable en développement sans clés).
 */
export async function verifyCaptcha(token?: string): Promise<boolean> {
  if (!isCaptchaEnabled) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://api.hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch (error) {
    console.error("[hCaptcha] Échec de vérification :", error);
    return false;
  }
}
