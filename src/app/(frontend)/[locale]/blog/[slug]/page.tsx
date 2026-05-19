import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { pickLocale, pickLocaleBlock } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { Heading } from "@/components/layout/typography";
import { SanityImage } from "@/components/sanity-image";
import { PortableText } from "@/components/portable-text";
import { sanityFetch } from "../../../../../../sanity/lib/fetch";
import {
  articleBySlugQuery,
  articleSlugsQuery,
} from "../../../../../../sanity/lib/queries";
import type { ArticleFull } from "../../../../../../sanity/lib/types";

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(articleSlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await sanityFetch<ArticleFull | null>(
    articleBySlugQuery,
    { slug },
    null,
  );
  if (!article) return {};
  return {
    title:
      pickLocale(article.seo?.metaTitle, locale) ||
      pickLocale(article.title, locale),
    description:
      pickLocale(article.seo?.metaDescription, locale) ||
      pickLocale(article.excerpt, locale) ||
      undefined,
    robots: article.seo?.noIndex ? { index: false } : undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const article = await sanityFetch<ArticleFull | null>(
    articleBySlugQuery,
    { slug },
    null,
  );
  if (!article) notFound();

  const title = pickLocale(article.title, locale);
  const body = pickLocaleBlock(article.body, locale);
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(
        locale === "en" ? "en-GB" : "fr-FR",
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        {article.categorySlug && (
          <Link
            href={`/blog/categorie/${article.categorySlug}`}
            className="text-sm font-semibold uppercase tracking-wide text-brand"
          >
            {pickLocale(article.categoryTitle, locale)}
          </Link>
        )}
        <Heading level={1} className="mt-2">
          {title}
        </Heading>
        <div className="mt-3 text-sm text-muted-foreground">
          {article.author?.name && <span>{article.author.name}</span>}
          {article.author?.name && date && <span> · </span>}
          {date && <span>{date}</span>}
        </div>

        {article.coverImage?.asset?._ref && (
          <SanityImage
            image={article.coverImage}
            alt={title}
            width={1200}
            height={630}
            priority
            className="mt-8 h-auto w-full rounded-xl object-cover"
          />
        )}

        <div className="mt-8">
          {body.length > 0 ? (
            <PortableText value={body} />
          ) : (
            <p className="text-muted-foreground">
              {pickLocale(article.excerpt, locale)}
            </p>
          )}
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {article.relatedServices && article.relatedServices.length > 0 && (
          <div className="mt-10 border-t pt-6">
            <p className="font-semibold">
              {locale === "en" ? "Related services" : "Services liés"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {article.relatedServices.map((s) => (
                <Link
                  key={s._id}
                  href={`/services/${s.slug ?? ""}`}
                  className="rounded-full border px-3 py-1 text-sm hover:bg-accent"
                >
                  {pickLocale(s.title, locale)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </Section>
  );
}
