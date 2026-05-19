import { groq } from "next-sanity";

/** Paramètres globaux du site (singleton). */
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    companyName,
    logo{asset, alt},
    logoDark{asset, alt},
    slogan,
    phones,
    emails,
    address,
    geo,
    openingHours[]{day, closed, open, close},
    whatsappNumber,
    whatsappMessage,
    socials[]{platform, url}
  }
`;

/** Liste des services pour la navigation (méga-menu, footer). */
export const servicesNavQuery = groq`
  *[_type == "service"] | order(order asc){
    _id,
    title,
    "slug": slug.current,
    icon,
    order
  }
`;

/** Page d'accueil (singleton). */
export const homePageQuery = groq`
  *[_type == "homePage"][0]{
    heroTitle, heroSubtitle, heroImage{asset, alt}, heroVideoUrl,
    heroPrimaryCta, heroSecondaryCta,
    stats[]{value, label},
    whyTitle, whyItems[]{icon, title, description},
    servicesTitle, testimonialsTitle, blogTitle, partnersTitle,
    ctaTitle, ctaText, ctaButton,
    seo
  }
`;

/** Tous les services (cartes). */
export const servicesListQuery = groq`
  *[_type == "service"] | order(order asc){
    _id, title, "slug": slug.current, icon,
    shortDescription, heroImage{asset, alt}
  }
`;

/** Un service par son slug (page détaillée). */
export const serviceBySlugQuery = groq`
  *[_type == "service" && slug.current == $slug][0]{
    _id, title, "slug": slug.current, icon,
    shortDescription, heroImage{asset, alt},
    longDescription,
    gallery[]{asset, alt},
    videoUrl, features, advantages,
    faq[]->{_id, question, answer},
    seo
  }
`;

/** Tous les slugs de services (génération statique). */
export const serviceSlugsQuery = groq`
  *[_type == "service" && defined(slug.current)].slug.current
`;

/** Promotions actives à afficher en bannière d'accueil. */
export const activePromotionsQuery = groq`
  *[_type == "promotion" && active == true && homeBanner == true
    && dateTime(startDate) <= dateTime(now())
    && dateTime(endDate) >= dateTime(now())]{
    _id, title, description, promoCode
  }
`;

/** Témoignages vérifiés (carrousel). */
export const testimonialsQuery = groq`
  *[_type == "temoignage"] | order(coalesce(date, _createdAt) desc)[0...12]{
    _id, name, role, photo{asset, alt}, text, rating
  }
`;

/** Derniers articles publiés. */
export const latestArticlesQuery = groq`
  *[_type == "article" && dateTime(publishedAt) <= dateTime(now())]
    | order(publishedAt desc)[0...3]{
    _id, title, "slug": slug.current, excerpt,
    coverImage{asset, alt}, publishedAt
  }
`;

/** Équipe (page À propos / accueil). */
export const teamQuery = groq`
  *[_type == "membreEquipe"] | order(order asc){
    _id, name, role, photo{asset, alt}, bio
  }
`;

/** Partenaires. */
export const partnersQuery = groq`
  *[_type == "partenaire"] | order(order asc){
    _id, name, logo{asset, alt}, url
  }
`;

/** FAQ générale. */
export const faqQuery = groq`
  *[_type == "faq"] | order(order asc){
    _id, question, answer
  }
`;

/* ====================== Phase 5 ====================== */

/** Toutes les réalisations (portfolio), avec le service lié. */
export const realisationsListQuery = groq`
  *[_type == "realisation"] | order(coalesce(date, _createdAt) desc){
    _id, title, "slug": slug.current,
    "serviceId": service._ref,
    "serviceTitle": service->title,
    client, location, date,
    description,
    "cover": coalesce(afterImages[0]{asset, alt}, beforeImages[0]{asset, alt})
  }
`;

/** Une réalisation par slug (détail avant/après). */
export const realisationBySlugQuery = groq`
  *[_type == "realisation" && slug.current == $slug][0]{
    _id, title, "slug": slug.current,
    "serviceTitle": service->title,
    "serviceSlug": service->slug.current,
    client, location, date, description,
    beforeImages[]{asset, alt},
    afterImages[]{asset, alt},
    videoUrl
  }
`;

export const realisationSlugsQuery = groq`
  *[_type == "realisation" && defined(slug.current)].slug.current
`;

/** Promotions actives (dans la période). */
export const promotionsActiveQuery = groq`
  *[_type == "promotion" && active == true
    && dateTime(startDate) <= dateTime(now())
    && dateTime(endDate) >= dateTime(now())] | order(endDate asc){
    _id, title, description, image{asset, alt},
    startDate, endDate, discountType, discountValue, promoCode,
    "services": services[]->{_id, title, "slug": slug.current}
  }
`;

/** Articles publiés (liste blog). */
export const articlesListQuery = groq`
  *[_type == "article" && dateTime(publishedAt) <= dateTime(now())]
    | order(publishedAt desc){
    _id, title, "slug": slug.current, excerpt,
    coverImage{asset, alt}, publishedAt,
    "categoryTitle": category->title,
    "categorySlug": category->slug.current
  }
`;

/** Un article par slug. */
export const articleBySlugQuery = groq`
  *[_type == "article" && slug.current == $slug][0]{
    _id, title, "slug": slug.current, excerpt,
    coverImage{asset, alt}, publishedAt, tags,
    body,
    "author": author->{name, role, photo{asset, alt}},
    "categoryTitle": category->title,
    "categorySlug": category->slug.current,
    "relatedServices": relatedServices[]->{_id, title, "slug": slug.current},
    seo
  }
`;

export const articleSlugsQuery = groq`
  *[_type == "article" && defined(slug.current)].slug.current
`;

/** Catégories de blog (avec nombre d'articles). */
export const blogCategoriesQuery = groq`
  *[_type == "categorieBlog"] | order(title.fr asc){
    _id, title, "slug": slug.current,
    "count": count(*[_type == "article" && references(^._id)])
  }
`;

/** Articles d'une catégorie. */
export const articlesByCategoryQuery = groq`
  *[_type == "article" && category->slug.current == $slug
    && dateTime(publishedAt) <= dateTime(now())] | order(publishedAt desc){
    _id, title, "slug": slug.current, excerpt,
    coverImage{asset, alt}, publishedAt,
    "categoryTitle": category->title,
    "categorySlug": category->slug.current
  }
`;

/** Une catégorie par slug + tous les slugs (génération statique). */
export const categoryBySlugQuery = groq`
  *[_type == "categorieBlog" && slug.current == $slug][0]{
    _id, title, "slug": slug.current
  }
`;

export const categorySlugsQuery = groq`
  *[_type == "categorieBlog" && defined(slug.current)].slug.current
`;

/** Une page légale par type. */
export const legalPageByTypeQuery = groq`
  *[_type == "legalPage" && type == $type][0]{
    type, title, content, updatedAt
  }
`;

/** Page À propos (singleton). */
export const aboutPageQuery = groq`
  *[_type == "aboutPage"][0]{
    title, intro, image{asset, alt},
    missionTitle, missionText,
    values[]{icon, title, description},
    teamTitle, partnersTitle, seo
  }
`;
