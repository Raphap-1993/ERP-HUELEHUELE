import { notFound } from "next/navigation";
import { featuredProducts } from "@huelegood/shared";
import { HueleCommerceAction } from "../../../components/huele-commerce-action";
import {
  HueleBadge,
  HuelePanel,
  HuelePublicPage,
  HueleSection,
} from "../../../components/huele-public-ui";
import {
  ProductMediaGallery,
  type ProductMediaGalleryItem,
} from "../../../components/product-media-gallery";
import { ProductVariantSelector } from "../../../components/product-variant-selector";
import { fetchProductBySlug } from "../../../lib/api";
import { isStorefrontStaticFallbackEnabled } from "../../../lib/storefront-runtime";
import {
  PRODUCT_VARIANTS_SECTION_ID,
  resolveStorefrontPrimaryAction,
  resolveStorefrontStockBadge,
} from "../../../lib/storefront-purchase";
import {
  resolveStorefrontMediaSrc,
  storefrontProductArtBySlug,
} from "../../../features/storefront-v2/lib/media";
import { gamePrototypeProductArt } from "../../../features/storefront-v2-game/content/storefront-v2-game-art";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const allowStaticStorefrontFallbacks = isStorefrontStaticFallbackEnabled();

function formatPrice(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `S/ ${value.toFixed(2)}`;
  }
}

function resolveProductImageSrc(slug: string, src?: string) {
  const fallback =
    gamePrototypeProductArt[slug as keyof typeof gamePrototypeProductArt] ??
    storefrontProductArtBySlug[slug] ??
    storefrontProductArtBySlug["clasico-verde"];

  return src ? resolveStorefrontMediaSrc(src) : fallback;
}

function buildProductGalleryItems({
  images,
  primaryAlt,
  primarySrc,
  productName,
  slug,
}: {
  images: NonNullable<typeof featuredProducts[number]["images"]>;
  primaryAlt: string;
  primarySrc: string;
  productName: string;
  slug: string;
}): ProductMediaGalleryItem[] {
  const resolvedImages = images.map((image, index) => ({
    alt: image.altText ?? `${productName} - vista ${index + 1}`,
    id: image.id,
    label: image.isPrimary ? "Principal" : `Vista ${index + 1}`,
    src: resolveProductImageSrc(slug, image.url),
  }));

  const base =
    resolvedImages[0] ?? {
      alt: primaryAlt,
      id: `${slug}-primary`,
      label: "Principal",
      src: primarySrc,
    };

  if (resolvedImages.length > 1) {
    return resolvedImages;
  }

  return [
    {
      ...base,
      id: `${base.id}-principal`,
      label: "Principal",
    },
    {
      ...base,
      id: `${base.id}-detalle`,
      label: "Detalle",
      objectPosition: "58% 48%",
      zoom: 1.18,
    },
    {
      ...base,
      id: `${base.id}-textura`,
      label: "Textura",
      objectPosition: "42% 62%",
      zoom: 1.32,
    },
  ];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const envelope = await fetchProductBySlug(slug).catch(() => null);
  const product =
    envelope?.data ??
    (allowStaticStorefrontFallbacks
      ? (featuredProducts.find((item) => item.slug === slug) ?? null)
      : null);

  if (!product) {
    notFound();
  }

  const currencyCode = product.currencyCode ?? "PEN";
  const images = (product.images ?? []).slice().sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.id.localeCompare(b.id);
  });

  const primaryImage = images[0]?.url ?? product.imageUrl;
  const primaryAlt = images[0]?.altText ?? product.imageAlt ?? product.name;
  const primary = resolveProductImageSrc(product.slug, primaryImage);
  const galleryItems = buildProductGalleryItems({
    images,
    primaryAlt,
    primarySrc: primary,
    productName: product.name,
    slug: product.slug,
  });
  const variants = (product.variants ?? []).filter(
    (variant) => variant.status === "active",
  );
  const hasMultipleVariants = variants.length > 1;
  const displayPrice = formatPrice(product.price, currencyCode);
  const compareAtPrice =
    !hasMultipleVariants &&
    product.compareAtPrice &&
    product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, currencyCode)
      : null;
  const savings =
    !hasMultipleVariants &&
    product.compareAtPrice &&
    product.compareAtPrice > product.price
      ? `Ahorras ${formatPrice(product.compareAtPrice - product.price, currencyCode)}`
      : null;
  const bundleComponents = product.bundleComponents ?? [];
  const detailAttributes = product.detailAttributes ?? [];
  const hasSupplementarySections =
    detailAttributes.length > 0 || bundleComponents.length > 0;
  const stockBadge = resolveStorefrontStockBadge(product);
  const stockTone = stockBadge?.className.includes("rose")
    ? "coral"
    : stockBadge?.className.includes("8c6331")
      ? "sun"
      : "mint";
  const primaryAction = resolveStorefrontPrimaryAction(product);

  return (
    <HuelePublicPage className="pb-16 md:pb-20">
      <div className="relative z-[1] mx-auto grid w-full max-w-[1200px] gap-6">
        <section className="hh-pdp-detail-grid">
          <HuelePanel tone="cream" className="hh-pdp-buy-panel">
            <div className="hh-pdp-breadcrumbs">
              <HueleBadge tone="cream">Inicio</HueleBadge>
              <HueleBadge tone="cream">Catálogo</HueleBadge>
              {product.badge ? (
                <HueleBadge tone="sun">{product.badge}</HueleBadge>
              ) : null}
              {stockBadge ? (
                <HueleBadge tone={stockTone}>{stockBadge.label}</HueleBadge>
              ) : null}
            </div>

            <div className="hh-pdp-copy">
              <h1>{product.name}</h1>
              <p>{product.tagline}</p>
            </div>

            <div className="hh-pdp-benefits">
              {product.benefits.slice(0, 2).map((benefit) => (
                <HueleBadge key={benefit} tone="mint">
                  {benefit}
                </HueleBadge>
              ))}
            </div>

            {hasMultipleVariants ? (
              <ProductVariantSelector
                embedded
                sectionId={PRODUCT_VARIANTS_SECTION_ID}
                productSlug={product.slug}
                currencyCode={currencyCode}
                defaultVariantId={product.defaultVariantId}
                images={images}
                variants={variants}
              />
            ) : (
              <div className="mt-6 rounded-[18px] border border-[var(--hh-public-line)] bg-white/78 p-5 shadow-[0_18px_44px_rgba(4,24,12,0.08)]">
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <p className="text-xs font-black uppercase text-[var(--hh-public-muted)]">
                      Precio
                    </p>
                    <p className="mt-2 text-[2.6rem] font-black leading-none text-[var(--hh-public-green-950)]">
                      {displayPrice}
                    </p>
                  </div>
                  {compareAtPrice ? (
                    <p className="text-base font-semibold text-[var(--hh-public-muted)] line-through">
                      {compareAtPrice}
                    </p>
                  ) : null}
                  {savings ? (
                    <HueleBadge tone="green">{savings}</HueleBadge>
                  ) : null}
                </div>
              </div>
            )}

            {!hasMultipleVariants ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <HueleCommerceAction
                  action={primaryAction}
                  productSlug={product.slug}
                >
                  {primaryAction.label}
                </HueleCommerceAction>
              </div>
            ) : null}
          </HuelePanel>

          <HuelePanel tone="cream" className="hh-pdp-gallery-panel">
            <ProductMediaGallery items={galleryItems} />
          </HuelePanel>
        </section>

        {hasSupplementarySections ? (
          <HueleSection
            eyebrow="Ficha técnica"
            title="Detalles para comprar con claridad"
            className="!w-full !max-w-none"
          >
            <div
              className={`grid gap-4 ${detailAttributes.length > 0 && bundleComponents.length > 0 ? "xl:grid-cols-2" : ""}`}
            >
              {detailAttributes.length > 0 ? (
                <HuelePanel tone="cream">
                  <h3 className="text-2xl leading-none text-[var(--hh-public-green-950)]">
                    Detalles del producto
                  </h3>
                  <div
                    className={`mt-4 grid gap-3 ${detailAttributes.length > 2 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}
                  >
                    {detailAttributes.map((attribute, index) => (
                      <div
                        key={`${attribute.label}:${index}`}
                        className="rounded-[16px] border border-[var(--hh-public-line)] bg-white/82 px-4 py-4 shadow-[0_10px_22px_rgba(4,24,12,0.06)]"
                      >
                        <p className="text-xs font-black uppercase text-[var(--hh-public-muted)]">
                          {attribute.label}
                        </p>
                        <p className="mt-2 text-base font-black leading-6 text-[var(--hh-public-green-950)]">
                          {attribute.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </HuelePanel>
              ) : null}

              {bundleComponents.length > 0 ? (
                <HuelePanel tone="mint">
                  <h3 className="text-2xl leading-none text-[var(--hh-public-green-950)]">
                    Incluye
                  </h3>
                  <p className="mt-4 text-base leading-7 text-[var(--hh-public-muted)]">
                    Este combo descuenta stock real de sus componentes al cerrar
                    la compra.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {bundleComponents.map((component) => (
                      <div
                        key={component.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[var(--hh-public-line)] bg-white/82 px-4 py-4 shadow-[0_10px_22px_rgba(4,24,12,0.06)]"
                      >
                        <div>
                          <p className="text-base font-black leading-6 text-[var(--hh-public-green-950)]">
                            {component.productName}
                            {component.variantName ? (
                              <span className="text-[var(--hh-public-green-600)]">
                                {" "}
                                · {component.variantName}
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 text-xs font-black uppercase text-[var(--hh-public-muted)]">
                            {component.productSlug}
                          </p>
                        </div>
                        <HueleBadge tone="sun">
                          x{component.quantity}
                        </HueleBadge>
                      </div>
                    ))}
                  </div>
                </HuelePanel>
              ) : null}
            </div>
          </HueleSection>
        ) : null}
      </div>
    </HuelePublicPage>
  );
}
