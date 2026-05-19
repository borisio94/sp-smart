import type { SocialLink } from "../../../../sanity/lib/types";

/**
 * Liens vers les réseaux sociaux (configurés dans Sanity).
 * Pastille avec l'initiale de la plateforme (pas d'icône de marque externe).
 */
export function SocialLinks({ socials }: { socials?: SocialLink[] }) {
  const items = (socials ?? []).filter((s) => s.url);
  if (items.length === 0) return null;

  return (
    <div className="flex gap-3">
      {items.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.platform ?? "Réseau social"}
          title={s.platform}
          className="flex size-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold uppercase transition-colors hover:bg-white/20"
        >
          {(s.platform ?? "?").charAt(0)}
        </a>
      ))}
    </div>
  );
}
