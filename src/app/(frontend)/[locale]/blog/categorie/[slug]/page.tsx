import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { pickLocale } from "@/lib/locale";
import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/empty-state";
import { ArticleCard } from "@/components/articles/article-card";
import { CategoryNav } from "@/components/blog/category-nav";
import { sanityFetch } from "../../../../../../../sanity/lib/fetch";
import {
  categoryBySlugQuery,
  categorySlugsQuery,
  articlesByCategoryQuery,
  blogCategoriesQuery,
} from "../../../../../../../sanity/lib/queries";
import type {
  ArticleListItem,
  BlogCategory,
} from "../../../../../../../sanity/lib/types";

export async function generateStaticParams() {
  const slugs = await sanityFetch<string[]>(categorySlugsQuery, {}, []);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await sanityFetch<BlogCategory | null>(
    categoryBySlugQuery,
    { slug },
    null,
  );
  return { title: cat ? pickLocale(cat.title, locale) : "Blog" };
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [cat, articles, categories] = await Promise.all([
    sanityFetch<BlogCategory | null>(categoryBySlugQuery, { slug }, null),
    sanityFetch<ArticleListItem[]>(articlesByCategoryQuery, { slug }, []),
    sanityFetch<BlogCategory[]>(blogCategoriesQuery, {}, []),
  ]);

  if (!cat) notFound();

  return (
    <Section>
      <SectionHeader title={pickLocale(cat.title, locale)} />
      <CategoryNav
        categories={categories}
        locale={locale}
        activeSlug={slug}
      />
      {articles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a._id} article={a} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState message="Aucun article dans cette catégorie pour le moment." />
      )}
    </Section>
  );
}
