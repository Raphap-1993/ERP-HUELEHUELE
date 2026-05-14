"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CatalogProduct } from "@huelegood/shared";
import { AddToCartLink } from "./add-to-cart-link";
import {
  resolveStorefrontMediaSrc,
  storefrontProductArtBySlug
} from "../features/storefront-v2/lib/media";

const PRODUCT_VARIANTS_SECTION_ID = "product-variants";

type StockAwareProduct = {
  availableStock?: number;
  isPurchasable?: boolean;
  stockStatus?: "available" | "low_stock" | "out_of_stock";
  stockLabel?: string;
};

type ProductVariantOption = NonNullable<CatalogProduct["variants"]>[number];
type ProductImageOption = NonNullable<CatalogProduct["images"]>[number];

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

function variantPrimaryLabel(variant: ProductVariantOption) {
  if (variant.flavorLabel) {
    return `Aroma ${variant.flavorLabel}`;
  }

  if (variant.presentationLabel) {
    return `Presentación ${variant.presentationLabel}`;
  }

  return variant.name;
}

function variantSecondaryLabel(variant: ProductVariantOption) {
  const parts = [
    variant.presentationLabel ? `Presentación ${variant.presentationLabel}` : null,
    variant.name && variant.name !== variant.flavorLabel ? variant.name : null,
    `SKU ${variant.sku}`
  ].filter(Boolean);

  return parts.join(" · ");
}

function resolveInitialVariantId(variants: ProductVariantOption[], defaultVariantId?: string) {
  return (
    variants.find((variant) => variant.id === defaultVariantId)?.id ??
    variants.find((variant) => isPurchasable(variant))?.id ??
    variants[0]?.id ??
    ""
  );
}

function sortImages(images: ProductImageOption[]) {
  return images.slice().sort((left, right) => {
    if (left.isPrimary && !right.isPrimary) {
      return -1;
    }

    if (!left.isPrimary && right.isPrimary) {
      return 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.id.localeCompare(right.id);
  });
}

export function ProductPurchaseExperience({ product }: { product: CatalogProduct }) {
  const images = sortImages(product.images ?? []);
  const variants = (product.variants ?? []).filter((variant) => variant.status === "active");
  const hasMultipleVariants = variants.length > 1;
  const hasFlavorOptions = variants.some((variant) => Boolean(variant.flavorLabel));
  const variantSelectionLabel = hasFlavorOptions ? "Elige tu aroma" : "Elige tu variante";
  const currencyCode = product.currencyCode ?? "PEN";
  const [selectedVariantId, setSelectedVariantId] = useState(() => resolveInitialVariantId(variants, product.defaultVariantId));
  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    variants.find((variant) => variant.id === product.defaultVariantId) ??
    variants[0] ??
    null;
  const selectedDescriptor = selectedVariant ? variantPrimaryLabel(selectedVariant) : product.name;
  const selectedSupportingText = selectedVariant ? variantSecondaryLabel(selectedVariant) : `SKU ${product.sku}`;
  const selectedPrice = selectedVariant?.price ?? product.price;
  const selectedCompareAtPrice =
    selectedVariant?.compareAtPrice ??
    (!hasMultipleVariants && product.compareAtPrice && product.compareAtPrice > product.price ? product.compareAtPrice : undefined);
  const selectedSavings =
    selectedCompareAtPrice && selectedCompareAtPrice > selectedPrice
      ? `Ahorras ${formatPrice(selectedCompareAtPrice - selectedPrice, currencyCode)}`
      : null;
  const selectedStockBadge = resolveStockBadge(selectedVariant ?? product);
  const selectedAvailableStock =
    typeof selectedVariant?.availableStock === "number"
      ? selectedVariant.availableStock
      : typeof product.availableStock === "number"
        ? product.availableStock
        : undefined;
  const selectedPurchasable = selectedVariant ? isPurchasable(selectedVariant) : isPurchasable(product);
  const selectedVariantTargetId = selectedVariant?.id ?? product.defaultVariantId;
  const selectedVariantImages = selectedVariant ? images.filter((image) => image.variantId === selectedVariant.id) : [];
  const galleryImages = selectedVariantImages.length > 0
    ? [...selectedVariantImages, ...images.filter((image) => image.variantId !== selectedVariant?.id)]
    : images;
  const heroImage = galleryImages[0];
  const heroSrc = resolveProductImageSrc(product.slug, heroImage?.url ?? product.imageUrl);
  const heroAlt = heroImage?.altText ?? product.imageAlt ?? product.name;
  const canBuySelected = hasMultipleVariants ? Boolean(selectedVariantTargetId && selectedPurchasable) : selectedPurchasable;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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
        {hasMultipleVariants ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f7fbf5] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#1a3a2e]">
              Activa: {selectedDescriptor}
            </span>
            <Link
              href={`#${PRODUCT_VARIANTS_SECTION_ID}`}
              className="rounded-full bg-[#61a740] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#577e2f]"
            >
              {variantSelectionLabel}
            </Link>
          </div>
        ) : canBuySelected ? (
          <AddToCartLink
            productSlug={product.slug}
            variantId={selectedVariantTargetId}
            className="rounded-full bg-[#61a740] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#577e2f]"
          >
            Comprar ahora
          </AddToCartLink>
        ) : (
          <span
            aria-disabled="true"
            className="cursor-not-allowed rounded-full bg-[#ece9e1] px-5 py-2.5 text-sm font-semibold text-[#7a8179]"
          >
            Sin stock
          </span>
        )}
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4">
          <div className="relative aspect-[4/3.6] overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_20px_60px_rgba(26,58,46,0.10)]">
            <Image
              fill
              src={heroSrc}
              alt={heroAlt}
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
              priority
            />
            {hasMultipleVariants && selectedVariant ? (
              <div className="absolute left-4 top-4 rounded-full bg-white/92 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#1a3a2e] shadow-sm">
                {selectedDescriptor}
              </div>
            ) : null}
          </div>

          {galleryImages.length > 1 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {galleryImages.slice(0, 8).map((image) => {
                const resolved = resolveProductImageSrc(product.slug, image.url);
                const imageBelongsToSelectedVariant = Boolean(selectedVariant && image.variantId === selectedVariant.id);

                return (
                  <div
                    key={image.id}
                    className={`relative aspect-square overflow-hidden rounded-2xl border bg-white ${
                      imageBelongsToSelectedVariant ? "border-[#61a740] shadow-[0_10px_25px_rgba(97,167,64,0.16)]" : "border-black/10"
                    }`}
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

        <section className="space-y-6">
          <div>
            {product.badge ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#eef6e8] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#61a740]">
                {product.badge}
              </span>
            ) : null}
            <h1 className="mt-4 font-serif text-5xl font-black leading-tight text-[#1a3a2e]">
              {product.name}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[#6b7280]">
              {product.tagline}
            </p>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="rounded-2xl border border-[rgba(97,167,64,0.16)] bg-[#f7fbf5] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b876f]">
                    {hasMultipleVariants ? "Variante activa" : "Variante vendible"}
                  </div>
                  <div className="mt-1 text-base font-semibold text-[#1a3a2e]">{selectedDescriptor}</div>
                  <div className="mt-1 text-xs text-[#6b7280]">{selectedSupportingText}</div>
                </div>
                {hasMultipleVariants ? (
                  <Link
                    href={`#${PRODUCT_VARIANTS_SECTION_ID}`}
                    className="rounded-full border border-[rgba(97,167,64,0.22)] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a3a2e] transition hover:border-[#61a740] hover:bg-[#eef6e8]"
                  >
                    Cambiar
                  </Link>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6f66]">
                  SKU {selectedVariant?.sku ?? product.sku}
                </span>
                {typeof selectedAvailableStock === "number" ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a3a2e]">
                    {selectedAvailableStock} {selectedAvailableStock === 1 ? "unidad" : "unidades"}
                  </span>
                ) : null}
                {selectedStockBadge ? (
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${selectedStockBadge.className}`}
                  >
                    {selectedStockBadge.label}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b876f]">
                  {hasMultipleVariants ? "Precio de la variante activa" : "Precio"}
                </div>
                <div className="font-serif text-4xl font-black text-[#1a3a2e]">
                  {formatPrice(selectedPrice, currencyCode)}
                </div>
              </div>
              {selectedCompareAtPrice && selectedCompareAtPrice > selectedPrice ? (
                <div className="text-base text-[#6b7280] line-through">
                  {formatPrice(selectedCompareAtPrice, currencyCode)}
                </div>
              ) : null}
              {selectedSavings ? (
                <span className="rounded-full bg-[#eef6e8] px-3 py-1 text-xs font-bold text-[#61a740]">
                  {selectedSavings}
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#6b7280]">{product.description}</p>

            {hasMultipleVariants ? (
              <div className="mt-4 rounded-2xl border border-[rgba(97,167,64,0.16)] bg-[#f7fbf5] px-4 py-3 text-sm leading-6 text-[#1a3a2e]">
                El precio, el stock y la compra siguen la variante activa. Si cambias de aroma o presentación, este resumen se actualiza.
              </div>
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

            {hasMultipleVariants ? (
              <div id={PRODUCT_VARIANTS_SECTION_ID} className="mt-6 scroll-mt-28">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#1a3a2e]">{variantSelectionLabel}</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">
                      Los aromas vendibles viven aquí. Elige una variante para comprar ese precio y ese stock.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#f4f4f0] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#1a3a2e]">
                    {variants.length} variantes activas
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {variants.map((variant) => {
                    const variantBadge = resolveStockBadge(variant);
                    const selected = variant.id === selectedVariant?.id;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        aria-pressed={selected}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          selected
                            ? "border-[#61a740] bg-[#f7fbf5] shadow-[0_16px_35px_rgba(97,167,64,0.14)]"
                            : "border-black/10 bg-[#faf8f3] hover:border-[#61a740]/35 hover:bg-white"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-[#1a3a2e]">{variantPrimaryLabel(variant)}</div>
                              {selected ? (
                                <span className="rounded-full bg-[#61a740] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                  Activa
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 text-xs text-[#6b7280]">{variantSecondaryLabel(variant)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#1a3a2e]">
                              {formatPrice(variant.price, currencyCode)}
                            </div>
                            {variant.compareAtPrice && variant.compareAtPrice > variant.price ? (
                              <div className="mt-1 text-xs text-[#6b7280] line-through">
                                {formatPrice(variant.compareAtPrice, currencyCode)}
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {typeof variant.availableStock === "number" ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a3a2e]">
                              {variant.availableStock} {variant.availableStock === 1 ? "unidad" : "unidades"}
                            </span>
                          ) : null}
                          {variantBadge ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${variantBadge.className}`}
                            >
                              {variantBadge.label}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {canBuySelected ? (
                <AddToCartLink
                  productSlug={product.slug}
                  variantId={selectedVariantTargetId}
                  className="rounded-full bg-[#61a740] px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#577e2f]"
                >
                  {hasMultipleVariants ? `Comprar ${selectedDescriptor}` : "Comprar ahora"}
                </AddToCartLink>
              ) : (
                <span
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-full bg-[#ece9e1] px-7 py-3 text-sm font-semibold text-[#7a8179]"
                >
                  {hasMultipleVariants ? "Sin stock en esta variante" : "Sin stock"}
                </span>
              )}
              <Link
                href="/catalogo"
                className="rounded-full border-2 border-[rgba(97,167,64,0.25)] px-7 py-3 text-sm font-semibold text-[#1a3a2e] transition hover:bg-[#eef6e8]"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
