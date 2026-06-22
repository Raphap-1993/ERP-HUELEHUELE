import type { CatalogProduct, SiteSetting } from "@huelegood/shared";

export type StorefrontHeroMedia = {
  src?: string;
  alt: string;
  source: "site_setting" | "product" | "fallback";
};

export function isStorefrontStaticFallbackEnabled(
  flag = process.env.NEXT_PUBLIC_ALLOW_STOREFRONT_STATIC_FALLBACKS
) {
  return flag === "true";
}

export function curateStorefrontProducts(products: CatalogProduct[], preferredSlugs?: string[]) {
  if (products.length === 0) {
    return [];
  }

  const bySlug = new Map(products.map((product) => [product.slug, product] as const));
  const curated = (preferredSlugs ?? [])
    .map((slug) => bySlug.get(slug))
    .filter((product): product is CatalogProduct => Boolean(product));

  if (curated.length > 0) {
    return curated;
  }

  const featured = products.filter((product) => product.isFeatured);
  if (featured.length > 0) {
    return featured;
  }

  return products;
}

export function resolveStorefrontHeroMedia(options: {
  siteSetting?: Pick<SiteSetting, "heroProductImageUrl"> | null;
  products?: CatalogProduct[];
  fallbackAlt?: string;
}): StorefrontHeroMedia {
  const fallbackAlt = options.fallbackAlt ?? "Imagen principal Huele Huele";
  const configuredHero = options.siteSetting?.heroProductImageUrl?.trim();

  if (configuredHero) {
    return {
      src: configuredHero,
      alt: fallbackAlt,
      source: "site_setting"
    };
  }

  const productWithImage = (options.products ?? []).find((product) => product.imageUrl?.trim());
  if (productWithImage?.imageUrl) {
    return {
      src: productWithImage.imageUrl,
      alt: productWithImage.imageAlt?.trim() || productWithImage.name,
      source: "product"
    };
  }

  return {
    src: undefined,
    alt: fallbackAlt,
    source: "fallback"
  };
}
