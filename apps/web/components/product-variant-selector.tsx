"use client";

import Image from "next/image";
import type { CatalogProduct } from "@huelegood/shared";
import { useMemo, useState } from "react";
import {
  cloudflareImageLoader,
  isRemoteStorefrontMediaUrl,
  resolveStorefrontMediaSrc,
} from "../features/storefront-v2/lib/media";
import { HueleCommerceAction } from "./huele-commerce-action";
import { HueleBadge, HuelePanel } from "./huele-public-ui";

type ProductVariant = NonNullable<CatalogProduct["variants"]>[number];
type ProductImage = NonNullable<CatalogProduct["images"]>[number];

type ProductVariantSelectorProps = {
  productSlug: string;
  currencyCode: string;
  defaultVariantId?: string;
  embedded?: boolean;
  images?: ProductImage[];
  sectionId?: string;
  variants: ProductVariant[];
};

type NormalizedVariant = ProductVariant & {
  flavorKey: string;
  flavorLabelResolved: string;
  presentationKey: string;
  presentationLabelResolved: string;
};

type VariantImage = {
  altText?: string;
  id: string;
  isPrimary?: boolean;
  sortOrder: number;
  url: string;
  variantId?: string;
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

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

function isPurchasable(variant: ProductVariant) {
  if (typeof variant.isPurchasable === "boolean") {
    return variant.isPurchasable;
  }

  if (typeof variant.availableStock === "number") {
    return variant.availableStock > 0;
  }

  return variant.status === "active";
}

function normalizeOptionKey(
  primary?: string,
  secondary?: string,
  fallback?: string,
) {
  return primary?.trim() || secondary?.trim() || fallback || "default";
}

function normalizeOptionLabel(
  primary?: string,
  secondary?: string,
  fallback?: string,
) {
  return primary?.trim() || secondary?.trim() || fallback || "Única";
}

function resolveStockPill(variant: ProductVariant) {
  if (!isPurchasable(variant)) {
    return {
      label: variant.stockLabel ?? "Sin stock",
      className: "bg-rose-50 text-rose-700",
    };
  }

  if (variant.stockStatus === "low_stock") {
    return {
      label: variant.stockLabel ?? "Pocas unidades",
      className: "bg-[#fff7e8] text-[#8c6331]",
    };
  }

  return {
    label: variant.stockLabel ?? "Disponible",
    className: "bg-[#eef6e8] text-[#4f7c2d]",
  };
}

function resolveStockTone(stockPill: ReturnType<typeof resolveStockPill>) {
  if (stockPill.className.includes("rose")) {
    return "coral";
  }

  if (stockPill.className.includes("8c6331")) {
    return "sun";
  }

  return "mint";
}

function variantCardClassName(active: boolean, disabled: boolean) {
  return cx(
    "hh-pdp-variant-option rounded-[20px] border px-3 py-3 text-left transition-[transform,border-color,background-color,box-shadow,opacity] duration-150",
    active &&
      "is-active border-[var(--hh-public-green-800)] bg-[var(--hh-public-green-900)] text-white shadow-[0_18px_34px_rgba(4,24,12,0.18)]",
    !active &&
      disabled &&
      "cursor-not-allowed border-[var(--hh-public-line)] bg-[#edf0e8] text-[#8b9488] opacity-75",
    !active &&
      !disabled &&
      "border-[var(--hh-public-line)] bg-white/88 text-[var(--hh-public-green-950)] hover:-translate-y-0.5 hover:border-[var(--hh-public-green-500)] hover:shadow-[0_16px_28px_rgba(4,24,12,0.08)]",
  );
}

function normalizeImageSource(src?: string) {
  return src ? resolveStorefrontMediaSrc(src) : undefined;
}

function resolveVariantSpecificImage(
  variant: ProductVariant,
  images: VariantImage[],
) {
  return images.find((image) => image.variantId === variant.id) ?? null;
}

function resolveVariantIconClassName(variant: ProductVariant) {
  const value = `${variant.flavorLabel ?? ""} ${variant.name}`.toLowerCase();

  if (value.includes("eucalipto") || value.includes("frío")) {
    return "hh-pdp-variant-icon--cool";
  }

  if (value.includes("citrus") || value.includes("cítrico")) {
    return "hh-pdp-variant-icon--citrus";
  }

  return "hh-pdp-variant-icon--black";
}

function VariantReference({
  image,
  label,
  variant,
}: {
  image?: VariantImage | null;
  label: string;
  variant: ProductVariant;
}) {
  const resolvedSrc = normalizeImageSource(image?.url);

  return (
    <span className="hh-pdp-variant-reference" aria-hidden="true">
      {resolvedSrc ? (
        <Image
          fill
          src={resolvedSrc}
          loader={
            isRemoteStorefrontMediaUrl(resolvedSrc)
              ? cloudflareImageLoader
              : undefined
          }
          alt=""
          sizes="76px"
          className="object-cover"
        />
      ) : (
        <span
          className={cx(
            "hh-pdp-variant-icon",
            resolveVariantIconClassName(variant),
          )}
        >
          {label.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

export function ProductVariantSelector({
  productSlug,
  currencyCode,
  defaultVariantId,
  embedded = false,
  images = [],
  sectionId,
  variants,
}: ProductVariantSelectorProps) {
  const normalizedVariants = useMemo<NormalizedVariant[]>(() => {
    return variants
      .filter((variant) => variant.status === "active")
      .map((variant) => ({
        ...variant,
        flavorKey: normalizeOptionKey(
          variant.flavorCode,
          variant.flavorLabel,
          variant.id,
        ),
        flavorLabelResolved: normalizeOptionLabel(
          variant.flavorLabel,
          variant.name,
          "Aroma",
        ),
        presentationKey: normalizeOptionKey(
          variant.presentationCode,
          variant.presentationLabel,
          variant.id,
        ),
        presentationLabelResolved: normalizeOptionLabel(
          variant.presentationLabel,
          variant.name,
          "Presentación",
        ),
      }));
  }, [variants]);

  const defaultVariant =
    normalizedVariants.find((variant) => variant.id === defaultVariantId) ??
    normalizedVariants.find((variant) => isPurchasable(variant)) ??
    normalizedVariants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariant?.id ?? "",
  );

  const selectedVariant =
    normalizedVariants.find((variant) => variant.id === selectedVariantId) ??
    defaultVariant ??
    null;
  const sortedImages = useMemo<VariantImage[]>(() => {
    return images
      .slice()
      .sort((left, right) => {
        if (left.isPrimary && !right.isPrimary) return -1;
        if (!left.isPrimary && right.isPrimary) return 1;
        if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
        return left.id.localeCompare(right.id);
      });
  }, [images]);

  function pickVariant(nextVariant?: NormalizedVariant) {
    if (!nextVariant) {
      return;
    }

    setSelectedVariantId(nextVariant.id);
  }

  if (!selectedVariant) {
    return null;
  }

  const stockPill = resolveStockPill(selectedVariant);
  const selectedAction = isPurchasable(selectedVariant)
    ? {
        mode: "direct" as const,
        label: "Comprar ahora" as const,
        variantId: selectedVariant.id,
      }
    : {
        mode: "sold_out" as const,
        label: stockPill.label,
      };

  const content = (
    <div className="hh-pdp-variant-layout">
      <div className="hh-pdp-variant-purchase">
        <div className="hh-pdp-variant-heading">
          <h2>Elige tu aroma</h2>
        </div>

        <div className="hh-pdp-variant-options">
          {normalizedVariants.map((variant) => {
            const active = selectedVariant.id === variant.id;
            const variantStockPill = resolveStockPill(variant);
            const image = resolveVariantSpecificImage(variant, sortedImages);

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => pickVariant(variant)}
                disabled={!isPurchasable(variant)}
                className={variantCardClassName(active, !isPurchasable(variant))}
              >
                <VariantReference
                  image={image}
                  label={variant.flavorLabelResolved}
                  variant={variant}
                />
                <span className="min-w-0">
                  <span className="hh-pdp-variant-option-name">
                    {variant.flavorLabelResolved}
                  </span>
                  <span className="hh-pdp-variant-option-meta">
                    {variant.presentationLabelResolved}
                  </span>
                </span>
                <HueleBadge
                  tone={active ? "cream" : resolveStockTone(variantStockPill)}
                  className={active ? "bg-white/14 text-white" : undefined}
                >
                  {variantStockPill.label}
                </HueleBadge>
              </button>
            );
          })}
        </div>

        <div className="hh-pdp-variant-summary">
          <div>
            <p>{selectedVariant.flavorLabelResolved}</p>
            <h3>{selectedVariant.presentationLabelResolved}</h3>
          </div>
          <div className="hh-pdp-variant-price-line">
            <strong>{formatPrice(selectedVariant.price, currencyCode)}</strong>
            {selectedVariant.compareAtPrice &&
            selectedVariant.compareAtPrice > selectedVariant.price ? (
              <span>
                {formatPrice(selectedVariant.compareAtPrice, currencyCode)}
              </span>
            ) : null}
          </div>

          <div className="hh-pdp-variant-cta-row">
            <HueleCommerceAction
              action={selectedAction}
              className="hh-pdp-variant-cta"
              productSlug={productSlug}
            >
              {isPurchasable(selectedVariant) ? "Comprar ahora" : stockPill.label}
            </HueleCommerceAction>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <section id={sectionId} className="hh-pdp-variant-embed scroll-mt-28">
        {content}
      </section>
    );
  }

  return (
    <section id={sectionId} className="scroll-mt-28">
      <HuelePanel tone="cream" className="hh-pdp-variant-shell">
        {content}
      </HuelePanel>
    </section>
  );
}
