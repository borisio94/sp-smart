import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type ButtonProps = ComponentProps<typeof Button>;
type LinkProps = ComponentProps<typeof Link>;

type Props = Omit<ButtonProps, "render"> & {
  href: LinkProps["href"];
  onClick?: LinkProps["onClick"];
  target?: string;
  rel?: string;
};

/**
 * Bouton qui est en réalité un lien (navigation interne i18n).
 * `nativeButton={false}` car le rendu final est un <a>, pas un <button>
 * (exigence d'accessibilité de Base UI).
 */
export function ButtonLink({
  href,
  onClick,
  target,
  rel,
  children,
  ...buttonProps
}: Props) {
  return (
    <Button
      {...buttonProps}
      nativeButton={false}
      render={
        <Link href={href} onClick={onClick} target={target} rel={rel} />
      }
    >
      {children}
    </Button>
  );
}
