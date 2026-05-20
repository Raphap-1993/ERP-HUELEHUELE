import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartLink } from "../../../components/add-to-cart-link";
import { ProductVariantSelector } from "../../../components/product-variant-selector";
import { fetchProductBySlug } from "../../../lib/api";
import {
  resolveStorefrontMediaSrc,
  storefrontProductArtBySlug
} from "../../../features/storefront-v2/lib/media";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const PRODUCT_VARIANTS_SECTION_ID = "product-variants";

function formatPrice(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `S/ ${value.toFixed(2)}`;
  }
}

function resolveProductImageSrc(slug: string, src?: string) {
  const fallback = storefrontProductArtBySlug[slug] ?? storefrontProductArtBySlug["clasico-verde"];
  return resolveStorefrontMediaSrc(src ?? fallback);
}

type StockAwareProduct = {
  availableStock?: number;
  isPurchasable?: boolean;
  stockStatus?: "available" | "low_stock" | "out_of_stock";
  stockLabel?: string;
};

function isPurchasable(product: StockAwareProduct) {
  if (typeof product.isPurchasable === "boolean") {
    return product.isPurchasable;
  }

  if (typeof product.availableStock === "number") {
    return product.availableStock > 0;
  }

  return true;
}

function resolveStockBadge(product: StockAwareProduct) {
  if (product.stockStatus === "out_of_stock") {
    return {
      label: product.stockLabel ?? "Sin stock",
      className: "bg-rose-50 text-rose-700"
    };
  }

  if (product.stockStatus === "low_stock") {
    return {
      label: product.stockLabel ?? "Pocas unidades",
      className: "bg-[#fff7e8] text-[#8c6331]"
    };
  }

  return null;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const envelope = await fetchProductBySlug(slug).catch(() => null);
  const product = envelope?.data;

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

  const variants = (product.variants ?? []).filter((variant) => variant.status === "active");
  const hasMultipleVariants = variants.length > 1;
  const variantPrices = variants.map((variant) => variant.price);
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;
  const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : product.price;
  const displayPrice = formatPrice(hasMultipleVariants ? minVariantPrice : product.price, currencyCode);
  const showVariantPriceRange = hasMultipleVariants && maxVariantPrice > minVariantPrice;
  const compareAtPrice =
    !hasMultipleVariants && product.compareAtPrice && product.compareAtPrice > product.price
      ? formatPrice(product.compareAtPrice, currencyCode)
      : null;
  const savings =
    !hasMultipleVariants && product.compareAtPrice && product.compareAtPrice > product.price
      ? `Ahorras ${formatPrice(product.compareAtPrice - product.price, currencyCode)}`
      : null;
  const bundleComponents = product.bundleComponents ?? [];
  const detailAttributes = product.detailAttributes ?? [];
  const hasSupplementarySections = detailAttributes.length > 0 || bundleComponents.length > 0;
  const purchasable = isPurchasable(product);
  const stockBadge = resolveStockBadge(product);

  return (
    <main className="bg-[hsl(var(--background))] pb-14 pt-8 md:pb-16 md:pt-10">
      <div className="mx-auto max-w-[1200px] space-y-8 px-6 md:space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[#6b7280]">
            <Link href="/" className="hover:text-[#1a3a2e]">
              Inicio
            </Link>
            <span>/</span>
            <Link href="/catalogo" className="hover:text-[#1a3a2e]">
              Catálogo
            </Link>
            <span>/</span>
            <span className="text-[#1a3a2e]">{product.name}</span>
          </div>
          {purchasable && !hasMultipleVariants ? (
            <AddToCartLink
              productSlug={product.slug}
              variantId={product.defaultVariantId}
              className="rounded-full bg-[#61a740] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#577e2f]"
            >
              Comprar ahora
            </AddToCartLink>
          ) : !purchasable ? (
            <span
              aria-disabled="true"
              className="cursor-not-allowed rounded-full bg-[#ece9e1] px-5 py-2.5 text-sm font-semibold text-[#7a8179]"
            >
              Sin stock
            </span>
          ) : (
            <div className="rounded-full border border-[rgba(26,58,46,0.08)] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b876f]">
              {variants.length} variantes activas
            </div>
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.84fr)] xl:items-start">
          <section className="space-y-4">
            <div className="relative aspect-[4/4.3] overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_24px_70px_rgba(26,58,46,0.10)] sm:aspect-[4/4.1]">
              <Image
                fill
                src={primary}
                alt={primaryAlt}
                sizes="(min-width: 1280px) 54vw, (min-width: 1024px) 48vw, 100vw"
                className="object-cover"
                priority
              />
            </div>

            {images.length > 1 ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.slice(0, 8).map((image) => {
                  const resolved = resolveProductImageSrc(product.slug, image.url);
                  return (
                    <div
                      key={image.id}
                      className="relative aspect-square overflow-hidden rounded-2xl border border-black/10 bg-white"
                    >
                      <Image
                        fill
                        src={resolved}
                        alt={image.altText ?? product.name}
                        sizes="160px"
                        className="object-cover"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(249,245,237,0.96)_100%)] p-6 shadow-[0_18px_55px_rgba(22,33,23,0.05)] md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#eef6e8] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#61a740]">
              {product.badge}
            </span>
            <h1 className="mt-4 font-serif text-[3rem] font-semibold leading-[0.96] tracking-[-0.045em] text-[#1a3a2e] sm:text-[3.4rem]">
              {product.name}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-8 text-[#5f6f66]">
              {product.tagline}
            </p>

            <div className="mt-6 rounded-[1.6rem] border border-black/6 bg-[#faf7ef] p-5 sm:p-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[190px]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b876f]">
                    {hasMultipleVariants ? (showVariantPriceRange ? "Desde" : "Precio por variante") : "Precio"}
                  </div>
                  <div className="mt-2 font-serif text-[2.8rem] font-semibold leading-none tracking-[-0.04em] text-[#1a3a2e]">
                    {displayPrice}
                  </div>
                </div>
                {compareAtPrice ? <div className="text-base text-[#6b7280] line-through">{compareAtPrice}</div> : null}
                {savings ? (
                  <span className="rounded-full bg-[#eef6e8] px-3 py-1 text-xs font-bold text-[#61a740]">
                    {savings}
                  </span>
                ) : null}
                {stockBadge ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${stockBadge.className}`}>
                    {stockBadge.label}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-7 text-[#5f6f66]">{product.description}</p>

              {hasMultipleVariants ? (
                <p className="mt-3 text-sm leading-7 text-[#5f6f66]">
                  El selector de abajo consolida aroma, presentación, stock y CTA en una sola ficha para que la compra
                  se sienta más clara.
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                {product.benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="rounded-full bg-[#f4f4f0] px-3 py-1 text-xs font-semibold text-[#1a3a2e]"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {hasMultipleVariants ? (
                <Link
                  href={`#${PRODUCT_VARIANTS_SECTION_ID}`}
                  className="rounded-full bg-[#61a740] px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#577e2f]"
                >
                  Elegir variante
                </Link>
              ) : purchasable ? (
                <AddToCartLink
                  productSlug={product.slug}
                  variantId={product.defaultVariantId}
                  className="rounded-full bg-[#61a740] px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#577e2f]"
                >
                  Comprar ahora
                </AddToCartLink>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-full bg-[#ece9e1] px-7 py-3 text-sm font-semibold text-[#7a8179]"
                >
                  Sin stock
                </span>
              )}
              <Link
                href="/catalogo"
                className="rounded-full border-2 border-[rgba(97,167,64,0.25)] px-7 py-3 text-sm font-semibold text-[#1a3a2e] transition hover:bg-[#eef6e8]"
              >
                Ver catálogo
              </Link>
            </div>
          </section>
        </div>

        {hasMultipleVariants ? (
          <ProductVariantSelector
            sectionId={PRODUCT_VARIANTS_SECTION_ID}
            productSlug={product.slug}
            currencyCode={currencyCode}
            defaultVariantId={product.defaultVariantId}
            variants={variants}
          />
        ) : null}

        {hasSupplementarySections ? (
          <div className={`grid gap-6 ${detailAttributes.length > 0 && bundleComponents.length > 0 ? "xl:grid-cols-2" : ""}`}>
            {detailAttributes.length > 0 ? (
              <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-serif text-[1.7rem] font-semibold tracking-[-0.035em] text-[#1a3a2e]">
                  Detalles del producto
                </h2>
                <div className={`mt-5 grid gap-4 ${detailAttributes.length > 2 ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}>
                  {detailAttributes.map((attribute, index) => (
                    <div
                      key={`${attribute.label}:${index}`}
                      className="rounded-2xl border border-black/8 bg-[#faf8f3] px-4 py-4"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7b876f]">
                        {attribute.label}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-[#1a3a2e]">{attribute.value}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {bundleComponents.length > 0 ? (
              <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-serif text-[1.7rem] font-semibold tracking-[-0.035em] text-[#1a3a2e]">Incluye</h2>
                <p className="mt-1 text-sm text-[#6b7280]">
                  Este combo descuenta stock de los productos componentes al momento de la compra.
                </p>
                <div className="mt-5 space-y-3">
                  {bundleComponents.map((component) => (
                    <div
                      key={component.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#faf8f3] px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[#1a3a2e]">
                          {component.productName}
                          {component.variantName ? <span className="text-[#6b7280]"> · {component.variantName}</span> : null}
                        </div>
                        <div className="text-xs text-[#6b7280]">{component.productSlug}</div>
                      </div>
                      <div className="text-sm font-bold text-[#1a3a2e]">x{component.quantity}</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
