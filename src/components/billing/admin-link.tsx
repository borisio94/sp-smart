import Link from "next/link";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type Variant = "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
type Size = "default" | "xs" | "sm" | "lg";

/**
 * Lien stylé en bouton pour l'admin (NON localisé) : utilise next/link,
 * pas le Link i18n (qui préfixerait l'URL avec /fr ou /en).
 */
export function AdminLink({
  href,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
