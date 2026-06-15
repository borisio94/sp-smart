"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { updatePasswordSchema, type UpdatePasswordInput } from "@/lib/billing/validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Définition d'un nouveau mot de passe pour l'utilisateur connecté.
 * Sert au changement volontaire (depuis les paramètres) comme à la
 * récupération (après clic sur le lien email, la session est déjà ouverte).
 */
export function ChangePasswordForm() {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirm: "" },
    mode: "onTouched",
  });

  function onSubmit(values: UpdatePasswordInput) {
    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });
      if (error) {
        toast.error(t("password.error"));
        return;
      }
      toast.success(t("password.success"));
      reset();
      router.replace("/admin/billing/parametres");
      router.refresh();
    });
  }

  const err = (m?: string) =>
    m ? <p className="mt-1 text-sm text-destructive">{m}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <Label htmlFor="new-password">{t("password.newPassword")}</Label>
        <div className="relative mt-1">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
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
      </div>

      <div>
        <Label htmlFor="confirm-password">{t("password.confirmPassword")}</Label>
        <Input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          className="mt-1"
          {...register("confirm")}
        />
        {err(errors.confirm?.message)}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? t("password.submitting") : t("password.submit")}
      </Button>
    </form>
  );
}
