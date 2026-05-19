import {
  icons,
  type LucideProps,
  HelpCircle,
} from "lucide-react";

type Props = LucideProps & {
  /** Nom de l'icône Lucide (ex : "shield", "camera"). Configuré dans Sanity. */
  name?: string;
};

function toPascalCase(value: string): string {
  return value
    .split(/[-_ ]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/**
 * Affiche une icône Lucide à partir de son nom (défini dans Sanity).
 * Repli sur une icône neutre si le nom est inconnu.
 */
export function DynamicIcon({ name, ...props }: Props) {
  const key = name ? toPascalCase(name) : "";
  const LucideIcon = (icons as Record<string, typeof HelpCircle>)[key];
  const Resolved = LucideIcon ?? HelpCircle;
  return <Resolved {...props} />;
}
