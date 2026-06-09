/**
 * Types des données récupérées depuis Sanity (vue site public).
 */
export type LocaleStr = { fr?: string; en?: string } | null;

export type SanityImageRef = {
  asset?: { _ref?: string };
  alt?: string;
} | null;

export type SocialLink = {
  platform?: string;
  url?: string;
};

export type OpeningHour = {
  day?: string;
  closed?: boolean;
  open?: string;
  close?: string;
};

export type SiteSettings = {
  companyName?: string;
  logo?: SanityImageRef;
  logoDark?: SanityImageRef;
  slogan?: LocaleStr;
  phones?: string[];
  emails?: string[];
  address?: string;
  geo?: { lat?: number; lng?: number };
  openingHours?: OpeningHour[];
  whatsappNumber?: string;
  whatsappMessage?: LocaleStr;
  socials?: SocialLink[];
} | null;

export type ServiceNavItem = {
  _id: string;
  title?: LocaleStr;
  slug?: string;
  icon?: string;
  order?: number;
};

/** Bloc Portable Text (typage souple, rendu via @portabletext/react). */
export type PortableBlock = unknown;
export type LocaleBlock = { fr?: PortableBlock[]; en?: PortableBlock[] } | null;

export type CtaButton = {
  label?: LocaleStr;
  href?: string;
  variant?: "primary" | "secondary" | "outline";
} | null;

export type SeoData = {
  metaTitle?: LocaleStr;
  metaDescription?: { fr?: string; en?: string } | null;
  ogImage?: SanityImageRef;
  noIndex?: boolean;
} | null;

export type HomePage = {
  heroTitle?: LocaleStr;
  heroSubtitle?: { fr?: string; en?: string } | null;
  heroImage?: SanityImageRef;
  heroImages?: (SanityImageRef & { alt?: string })[];
  heroVideoUrl?: string;
  /** URL du fichier vidéo de fond téléversé (Sanity). */
  heroVideoUrlFile?: string;
  presentationTitle?: LocaleStr;
  presentationText?: { fr?: string; en?: string } | null;
  /** URL du fichier vidéo de présentation téléversé (Sanity). */
  presentationVideoUrl?: string;
  presentationPoster?: SanityImageRef;
  heroPrimaryCta?: CtaButton;
  heroSecondaryCta?: CtaButton;
  stats?: { value?: string; label?: LocaleStr }[];
  whyTitle?: LocaleStr;
  whyItems?: {
    icon?: string;
    title?: LocaleStr;
    description?: { fr?: string; en?: string } | null;
  }[];
  servicesTitle?: LocaleStr;
  testimonialsTitle?: LocaleStr;
  blogTitle?: LocaleStr;
  partnersTitle?: LocaleStr;
  ctaTitle?: LocaleStr;
  ctaText?: { fr?: string; en?: string } | null;
  ctaButton?: CtaButton;
  seo?: SeoData;
} | null;

export type ServiceCardData = {
  _id: string;
  title?: LocaleStr;
  slug?: string;
  icon?: string;
  shortDescription?: { fr?: string; en?: string } | null;
  heroImage?: SanityImageRef;
};

export type ServiceDetail = ServiceCardData & {
  longDescription?: LocaleBlock;
  gallery?: (SanityImageRef & { alt?: string })[];
  videoUrl?: string;
  videoFileUrl?: string;
  features?: LocaleStr[];
  advantages?: {
    _key?: string;
    title?: LocaleStr;
    description?: { fr?: string; en?: string } | null;
    icon?: string;
  }[];
  faq?: { _id: string; question?: LocaleStr; answer?: { fr?: string; en?: string } | null }[];
  seo?: SeoData;
};

export type PromotionBanner = {
  _id: string;
  title?: LocaleStr;
  description?: { fr?: string; en?: string } | null;
  promoCode?: string;
};

export type Testimonial = {
  _id: string;
  name?: string;
  role?: LocaleStr;
  photo?: SanityImageRef;
  text?: { fr?: string; en?: string } | null;
  rating?: number;
};

export type ArticleCard = {
  _id: string;
  title?: LocaleStr;
  slug?: string;
  excerpt?: { fr?: string; en?: string } | null;
  coverImage?: SanityImageRef;
  publishedAt?: string;
};

export type TeamMember = {
  _id: string;
  name?: string;
  role?: LocaleStr;
  photo?: SanityImageRef;
  bio?: { fr?: string; en?: string } | null;
};

export type Partner = {
  _id: string;
  name?: string;
  logo?: SanityImageRef;
  url?: string;
};

export type FaqItem = {
  _id: string;
  question?: LocaleStr;
  answer?: { fr?: string; en?: string } | null;
};

/* ---- Phase 5 ---- */

export type RealisationCard = {
  _id: string;
  title?: LocaleStr;
  slug?: string;
  serviceId?: string;
  serviceTitle?: LocaleStr;
  client?: string;
  location?: string;
  date?: string;
  description?: { fr?: string; en?: string } | null;
  cover?: SanityImageRef;
};

export type RealisationDetail = {
  _id: string;
  title?: LocaleStr;
  slug?: string;
  serviceTitle?: LocaleStr;
  serviceSlug?: string;
  client?: string;
  location?: string;
  date?: string;
  description?: { fr?: string; en?: string } | null;
  beforeImages?: (SanityImageRef & { alt?: string })[];
  afterImages?: (SanityImageRef & { alt?: string })[];
  videoUrl?: string;
  videoFileUrl?: string;
};

export type PromotionFull = {
  _id: string;
  title?: LocaleStr;
  description?: { fr?: string; en?: string } | null;
  image?: SanityImageRef;
  startDate?: string;
  endDate?: string;
  discountType?: "percent" | "amount";
  discountValue?: number;
  promoCode?: string;
  services?: { _id: string; title?: LocaleStr; slug?: string }[];
};

export type ArticleListItem = {
  _id: string;
  title?: LocaleStr;
  slug?: string;
  excerpt?: { fr?: string; en?: string } | null;
  coverImage?: SanityImageRef;
  publishedAt?: string;
  categoryTitle?: LocaleStr;
  categorySlug?: string;
};

export type ArticleFull = ArticleListItem & {
  tags?: string[];
  body?: LocaleBlock;
  author?: { name?: string; role?: LocaleStr; photo?: SanityImageRef } | null;
  relatedServices?: { _id: string; title?: LocaleStr; slug?: string }[];
  seo?: SeoData;
};

export type BlogCategory = {
  _id: string;
  title?: LocaleStr;
  slug?: string;
  count?: number;
};

export type LegalPage = {
  type?: string;
  title?: LocaleStr;
  content?: LocaleBlock;
  updatedAt?: string;
} | null;

export type AboutPage = {
  title?: LocaleStr;
  intro?: LocaleBlock;
  image?: SanityImageRef;
  missionTitle?: LocaleStr;
  missionText?: { fr?: string; en?: string } | null;
  values?: {
    icon?: string;
    title?: LocaleStr;
    description?: { fr?: string; en?: string } | null;
  }[];
  teamTitle?: LocaleStr;
  partnersTitle?: LocaleStr;
  seo?: SeoData;
} | null;
