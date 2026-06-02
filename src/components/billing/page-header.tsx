import { AdminLink } from "./admin-link";

/**
 * En-tête de page admin : titre + sous-titre + action optionnelle à droite.
 * L'admin n'étant pas localisé, on utilise AdminLink (next/link).
 */
export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actionLabel && actionHref ? (
        <AdminLink href={actionHref}>{actionLabel}</AdminLink>
      ) : null}
    </header>
  );
}
