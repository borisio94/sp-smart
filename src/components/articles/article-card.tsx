import { Link } from "@/i18n/navigation";
import { pickLocale } from "@/lib/locale";
import { SanityImage } from "@/components/sanity-image";
import { Card, CardContent } from "@/components/ui/card";
import type { ArticleCard as ArticleCardData } from "../../../sanity/lib/types";

/**
 * Carte d'un article de blog.
 */
export function ArticleCard({
  article,
  locale,
}: {
  article: ArticleCardData;
  locale: string;
}) {
  const title = pickLocale(article.title, locale);
  const excerpt = pickLocale(article.excerpt, locale);
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        locale === "en" ? "en-GB" : "fr-FR",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  return (
    <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/blog/${article.slug ?? ""}`}>
        {article.coverImage?.asset?._ref && (
          <SanityImage
            image={article.coverImage}
            alt={title}
            width={600}
            height={340}
            className="h-48 w-full object-cover"
          />
        )}
        <CardContent className="p-6">
          {date && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {date}
            </p>
          )}
          <h3 className="mt-2 text-lg font-semibold group-hover:text-brand">
            {title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {excerpt}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
