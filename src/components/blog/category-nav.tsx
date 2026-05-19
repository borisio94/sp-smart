import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import type { BlogCategory } from "../../../sanity/lib/types";

/**
 * Barre de filtres par catégorie de blog (liens vers les pages catégorie).
 */
export async function CategoryNav({
  categories,
  locale,
  activeSlug,
}: {
  categories: BlogCategory[];
  locale: string;
  activeSlug?: string;
}) {
  const t = await getTranslations("Nav");
  if (!categories || categories.length === 0) return null;

  const cls = (isActive: boolean) =>
    cn(
      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
      isActive
        ? "border-brand bg-brand text-brand-foreground"
        : "border-border hover:bg-accent",
    );

  return (
    <div className="mb-10 flex flex-wrap justify-center gap-2">
      <Link href="/blog" className={cls(!activeSlug)}>
        {t("blog")}
      </Link>
      {categories.map((c) => (
        <Link
          key={c._id}
          href={`/blog/categorie/${c.slug ?? ""}`}
          className={cls(activeSlug === c.slug)}
        >
          {pickLocale(c.title, locale)}
          {typeof c.count === "number" && (
            <span className="ml-1 opacity-60">({c.count})</span>
          )}
        </Link>
      ))}
    </div>
  );
}
