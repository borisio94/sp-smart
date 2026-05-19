import { Link } from "@/i18n/navigation";
import { SanityImage } from "@/components/sanity-image";
import type { SiteSettings } from "../../../../sanity/lib/types";

/**
 * Logo cliquable (image Sanity) avec repli sur le nom de l'entreprise.
 */
export function Logo({ settings }: { settings: SiteSettings }) {
  const name = settings?.companyName ?? "SP Smart Sarl";

  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-bold text-brand"
      aria-label={name}
    >
      {settings?.logo?.asset?._ref ? (
        <SanityImage
          image={settings.logo}
          alt={name}
          width={160}
          height={48}
          priority
          className="h-10 w-auto"
        />
      ) : (
        <span className="text-xl">{name}</span>
      )}
    </Link>
  );
}
