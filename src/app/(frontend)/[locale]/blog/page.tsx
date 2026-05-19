import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Section } from "@/components/layout/section";
import { SectionHeader } from "@/components/layout/section-header";
import { EmptyState } from "@/components/empty-state";
import { ArticleCard } from "@/components/articles/article-card";
import { CategoryNav } from "@/components/blog/category-nav";
import { sanityFetch } from "../../../../../sanity/lib/fetch";
import {
  articlesListQuery,
  blogCategoriesQuery,
} from "../../../../../sanity/lib/queries";
import type {
  ArticleListItem,
  BlogCategory,
} from "../../../../../sanity/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Nav" });
  return { title: t("blog") };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Nav");
  const [articles, categories] = await Promise.all([
    sanityFetch<ArticleListItem[]>(articlesListQuery, {}, []),
    sanityFetch<BlogCategory[]>(blogCategoriesQuery, {}, []),
  ]);

  return (
    <Section>
      <SectionHeader title={t("blog")} />
      <CategoryNav categories={categories} locale={locale} />
      {articles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a._id} article={a} locale={locale} />
          ))}
        </div>
      ) : (
        <EmptyState message="Aucun article publié pour le moment. Rédigez vos articles depuis l'administration (/studio)." />
      )}
    </Section>
  );
}
