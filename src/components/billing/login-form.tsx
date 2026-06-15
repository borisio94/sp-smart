"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { loginSchema, type LoginInput } from "@/lib/billing/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Formulaire de connexion : mot de passe (principal) + lien magique (secours).
 * Adapté à un usage en mobilité (cf. ACTIONS_PHASE_1.md section 4).
 */
export function LoginForm() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [magicPending, setMagicPending] = useState(false);
  const [forgotPending, setForgotPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  // Connexion par mot de passe
  function onSubmit(values: LoginInput) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        toast.error(t("login.errorCredentials"));
        return;
      }
      toast.success(t("login.success"));
      router.replace("/admin/billing");
      router.refresh();
    });
  }

  // Connexion par lien magique (envoyé par email)
  async function onMagicLink() {
    const email = getValues("email");
    if (!email || !email.includes("@")) {
      toast.error(t("login.emailRequired"));
      return;
    }
    setMagicPending(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/billing`,
      },
    });
    setMagicPending(false);
    if (error) {
      toast.error(t("login.errorMagic"));
      return;
    }
    toast.success(t("login.magicSent"));
  }

  // Réinitialisation par email : envoie un lien vers le callback puis la page
  // de changement de mot de passe (la session y est déjà ouverte).
  async function onForgotPassword() {
    const email = getValues("email");
    if (!email || !email.includes("@")) {
      toast.error(t("login.emailRequired"));
      return;
    }
    setForgotPending(true);
    const supabase = createSupabaseBrowserClient();
    const next = encodeURIComponent("/admin/billing/parametres/mot-de-passe");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/billing/auth/callback?next=${next}`,
    });
    setForgotPending(false);
    if (error) {
      toast.error(t("login.forgotError"));
      return;
    }
    toast.success(t("login.forgotSent"));
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="login-email">{t("login.email")}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          className="mt-1"
          {...register("email")}
        />
        {err(errors.email?.message)}
      </div>

      <div>
        <Label htmlFor="login-password">{t("login.password")}</Label>
        <div className="relative mt-1">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-9"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {err(errors.password?.message)}
        <div className="mt-1.5 text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={forgotPending}
            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
          >
            {forgotPending ? t("login.forgotSending") : t("login.forgot")}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? t("login.submitting") : t("login.submit")}
      </Button>

      <div className="relative py-1 text-center">
        <span className="bg-card px-2 text-xs text-muted-foreground">
          {t("login.or")}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        disabled={magicPending}
        onClick={onMagicLink}
      >
        {magicPending ? t("login.magicSending") : t("login.magicLink")}
      </Button>
    </form>
  );
}
