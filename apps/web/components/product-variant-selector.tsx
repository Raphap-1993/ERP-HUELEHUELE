"use client";

import type { CatalogProduct } from "@huelegood/shared";
import { useMemo, useState } from "react";
import { AddToCartLink } from "./add-to-cart-link";

type ProductVariant = NonNullable<CatalogProduct["variants"]>[number];

type ProductVariantSelectorProps = {
  productSlug: string;
  currencyCode: string;
  defaultVariantId?: string;
  sectionId?: string;
  variants: ProductVariant[];
};

type NormalizedVariant = ProductVariant & {
  flavorKey: string;
  flavorLabelResolved: string;
  presentationKey: string;
  presentationLabelResolved: string;
};

type SelectorOption = {
  key: string;
  label: string;
  support: string;
  disabled: boolean;
};

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

function isPurchasable(variant: ProductVariant) {
  if (typeof variant.isPurchasable === "boolean") {
    return variant.isPurchasable;
  }

  if (typeof variant.availableStock === "number") {
    return variant.availableStock > 0;
  }

  return variant.status === "active";
}

function normalizeOptionKey(primary?: string, secondary?: string, fallback?: string) {
  return primary?.trim() || secondary?.trim() || fallback || "default";
}

function normalizeOptionLabel(primary?: string, secondary?: string, fallback?: string) {
  return primary?.trim() || secondary?.trim() || fallback || "Única";
}

function resolveStockPill(variant: ProductVariant) {
  if (!isPurchasable(variant)) {
    return {
      label: variant.stockLabel ?? "Sin stock",
      className: "bg-rose-50 text-rose-700"
    };
  }

  if (variant.stockStatus === "low_stock") {
    return {
      label: variant.stockLabel ?? "Pocas unidades",
      className: "bg-[#fff7e8] text-[#8c6331]"
    };
  }

  return {
    label: variant.stockLabel ?? "Disponible",
    className: "bg-[#eef6e8] text-[#4f7c2d]"
  };
}

function resolveOptionSupport(variant?: ProductVariant) {
  if (!variant) {
    return "No disponible";
  }

  if (!isPurchasable(variant)) {
    return "Sin stock";
  }

  if (variant.stockStatus === "low_stock") {
    return variant.stockLabel ?? "Pocas unidades";
  }

  if (typeof variant.availableStock === "number") {
    return `${variant.availableStock} uds`;
  }

  return "Disponible";
}

export function ProductVariantSelector({
  productSlug,
  currencyCode,
  defaultVariantId,
  sectionId,
  variants
}: ProductVariantSelectorProps) {
  const normalizedVariants = useMemo<NormalizedVariant[]>(() => {
    return variants
      .filter((variant) => variant.status === "active")
      .map((variant) => ({
        ...variant,
        flavorKey: normalizeOptionKey(variant.flavorCode, variant.flavorLabel, variant.id),
        flavorLabelResolved: normalizeOptionLabel(variant.flavorLabel, variant.name, "Aroma"),
        presentationKey: normalizeOptionKey(variant.presentationCode, variant.presentationLabel, variant.id),
        presentationLabelResolved: normalizeOptionLabel(variant.presentationLabel, variant.name, "Presentación")
      }));
  }, [variants]);

  const defaultVariant =
    normalizedVariants.find((variant) => variant.id === defaultVariantId) ??
    normalizedVariants.find((variant) => isPurchasable(variant)) ??
    normalizedVariants[0];

  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id ?? "");

  const selectedVariant =
    normalizedVariants.find((variant) => variant.id === selectedVariantId) ??
    defaultVariant ??
    null;

  const flavorOptions = useMemo<SelectorOption[]>(() => {
    const options = new Map<string, SelectorOption>();

    for (const variant of normalizedVariants) {
      if (options.has(variant.flavorKey)) {
        continue;
      }

      options.set(variant.flavorKey, {
        key: variant.flavorKey,
        label: variant.flavorLabelResolved,
        support: resolveOptionSupport(variant),
        disabled: normalizedVariants.filter((candidate) => candidate.flavorKey === variant.flavorKey).every((candidate) => !isPurchasable(candidate))
      });
    }

    return Array.from(options.values());
  }, [normalizedVariants]);

  const presentationOptions = useMemo<SelectorOption[]>(() => {
    const options = new Map<string, SelectorOption>();

    for (const variant of normalizedVariants) {
      if (options.has(variant.presentationKey)) {
        continue;
      }

      options.set(variant.presentationKey, {
        key: variant.presentationKey,
        label: variant.presentationLabelResolved,
        support: resolveOptionSupport(variant),
        disabled: normalizedVariants
          .filter((candidate) => candidate.presentationKey === variant.presentationKey)
          .every((candidate) => !isPurchasable(candidate))
      });
    }

    return Array.from(options.values());
  }, [normalizedVariants]);

  const hasFlavorChoices = flavorOptions.length > 1;
  const hasPresentationChoices = presentationOptions.length > 1;
  const hasChoiceGroups = hasFlavorChoices || hasPresentationChoices;

  function pickVariant(nextVariant?: NormalizedVariant) {
    if (!nextVariant) {
      return;
    }

    setSelectedVariantId(nextVariant.id);
  }

  function handleFlavorSelect(flavorKey: string) {
    if (!selectedVariant) {
      return;
    }

    const nextVariant =
      normalizedVariants.find(
        (variant) =>
          variant.flavorKey === flavorKey &&
          variant.presentationKey === selectedVariant.presentationKey &&
          isPurchasable(variant)
      ) ??
      normalizedVariants.find((variant) => variant.flavorKey === flavorKey && isPurchasable(variant)) ??
      normalizedVariants.find((variant) => variant.flavorKey === flavorKey);

    pickVariant(nextVariant);
  }

  function handlePresentationSelect(presentationKey: string) {
    if (!selectedVariant) {
      return;
    }

    const nextVariant =
      normalizedVariants.find(
        (variant) =>
          variant.presentationKey === presentationKey &&
          variant.flavorKey === selectedVariant.flavorKey &&
          isPurchasable(variant)
      ) ??
      normalizedVariants.find((variant) => variant.presentationKey === presentationKey && isPurchasable(variant)) ??
      normalizedVariants.find((variant) => variant.presentationKey === presentationKey);

    pickVariant(nextVariant);
  }

  if (!selectedVariant) {
    return null;
  }

  const stockPill = resolveStockPill(selectedVariant);

  return (
    <div
      id={sectionId}
      className="scroll-mt-28 rounded-[28px] border border-[rgba(97,167,64,0.14)] bg-[linear-gradient(180deg,#f7fbf5_0%,#ffffff_100%)] p-5 shadow-[0_18px_40px_rgba(26,58,46,0.06)] sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b876f]">
            Elige tu variante
          </span>
          <h2 className="mt-3 font-serif text-[1.8rem] font-semibold leading-[1.02] tracking-[-0.04em] text-[#1a3a2e] sm:text-[2.15rem]">
            Selecciona aroma y presentación
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f6f66]">
            Todo el stock, precio y CTA quedan concentrados en una sola ficha para que la compra se vea más limpia y
            no repita tarjetas innecesarias.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(26,58,46,0.08)] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b876f]">
          {normalizedVariants.length} variantes activas
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:items-start">
        <div className="grid gap-5">
          {hasChoiceGroups ? (
            <>
              {hasFlavorChoices ? (
                <div>
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b876f]">Aroma</div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {flavorOptions.map((option) => {
                      const active = selectedVariant.flavorKey === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handleFlavorSelect(option.key)}
                          disabled={option.disabled}
                          className={`min-h-[108px] rounded-[22px] border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#1a3a2e] bg-[#1a3a2e] text-white shadow-[0_16px_30px_rgba(26,58,46,0.18)]"
                              : option.disabled
                                ? "cursor-not-allowed border-[rgba(26,58,46,0.08)] bg-[#f2efe7] text-[#a0a79f]"
                                : "border-[rgba(26,58,46,0.08)] bg-white text-[#1a3a2e] hover:-translate-y-0.5 hover:border-[#61a740]/35 hover:shadow-[0_14px_26px_rgba(26,58,46,0.08)]"
                          }`}
                        >
                          <div className="text-sm font-semibold">{option.label}</div>
                          <div className={`mt-2 text-xs leading-5 ${active ? "text-white/72" : "text-[#6b7280]"}`}>
                            {option.support}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {hasPresentationChoices ? (
                <div>
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b876f]">
                    Presentación
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {presentationOptions.map((option) => {
                      const active = selectedVariant.presentationKey === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => handlePresentationSelect(option.key)}
                          disabled={option.disabled}
                          className={`min-h-[108px] rounded-[22px] border px-4 py-4 text-left transition ${
                            active
                              ? "border-[#1a3a2e] bg-[#1a3a2e] text-white shadow-[0_16px_30px_rgba(26,58,46,0.18)]"
                              : option.disabled
                                ? "cursor-not-allowed border-[rgba(26,58,46,0.08)] bg-[#f2efe7] text-[#a0a79f]"
                                : "border-[rgba(26,58,46,0.08)] bg-white text-[#1a3a2e] hover:-translate-y-0.5 hover:border-[#61a740]/35 hover:shadow-[0_14px_26px_rgba(26,58,46,0.08)]"
                          }`}
                        >
                          <div className="text-sm font-semibold">{option.label}</div>
                          <div className={`mt-2 text-xs leading-5 ${active ? "text-white/72" : "text-[#6b7280]"}`}>
                            {option.support}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {normalizedVariants.map((variant) => {
                const active = selectedVariant.id === variant.id;
                const variantStockPill = resolveStockPill(variant);
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => pickVariant(variant)}
                    disabled={!isPurchasable(variant)}
                    className={`min-h-[108px] rounded-[22px] border px-4 py-4 text-left transition ${
                      active
                        ? "border-[#1a3a2e] bg-[#1a3a2e] text-white shadow-[0_16px_30px_rgba(26,58,46,0.18)]"
                        : !isPurchasable(variant)
                          ? "cursor-not-allowed border-[rgba(26,58,46,0.08)] bg-[#f2efe7] text-[#a0a79f]"
                          : "border-[rgba(26,58,46,0.08)] bg-white text-[#1a3a2e] hover:-translate-y-0.5 hover:border-[#61a740]/35 hover:shadow-[0_14px_26px_rgba(26,58,46,0.08)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-sm font-semibold">{variant.name}</div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                          active ? "bg-white/12 text-white" : variantStockPill.className
                        }`}
                      >
                        {variantStockPill.label}
                      </span>
                    </div>
                    <div className={`mt-3 text-xs ${active ? "text-white/72" : "text-[#6b7280]"}`}>
                      {formatPrice(variant.price, currencyCode)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-[rgba(26,58,46,0.08)] bg-white/92 p-4 shadow-[0_10px_24px_rgba(16,33,24,0.05)] sm:p-5 xl:sticky xl:top-28">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#f4f4f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a3a2e]">
              {selectedVariant.flavorLabelResolved}
            </span>
            <span className="rounded-full bg-[#f4f4f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a3a2e]">
              {selectedVariant.presentationLabelResolved}
            </span>
            <span className="rounded-full bg-[#f4f4f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5f6f66]">
              SKU {selectedVariant.sku}
            </span>
          </div>

          <div className="mt-4">
            <div className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#1a3a2e]">{selectedVariant.name}</div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="font-serif text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[#1a3a2e]">
                {formatPrice(selectedVariant.price, currencyCode)}
              </div>
              {selectedVariant.compareAtPrice && selectedVariant.compareAtPrice > selectedVariant.price ? (
                <div className="text-sm text-[#6b7280] line-through">
                  {formatPrice(selectedVariant.compareAtPrice, currencyCode)}
                </div>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${stockPill.className}`}>
                {stockPill.label}
              </span>
              {typeof selectedVariant.availableStock === "number" ? (
                <span className="rounded-full bg-[#f4f4f0] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1a3a2e]">
                  {selectedVariant.availableStock} {selectedVariant.availableStock === 1 ? "unidad" : "unidades"}
                </span>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-6 text-[#5f6f66]">
              Esta es la configuración que se agregará directo al checkout. Si cambias aroma o presentación, el resumen
              se actualiza aquí.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              {isPurchasable(selectedVariant) ? (
                <AddToCartLink
                  productSlug={productSlug}
                  variantId={selectedVariant.id}
                  className="inline-flex items-center justify-center rounded-full bg-[#61a740] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#577e2f]"
                >
                  Agregar variante seleccionada
                </AddToCartLink>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-[#ece9e1] px-5 py-3 text-sm font-semibold text-[#7a8179]">
                  Sin stock
                </span>
              )}
              <span className="text-center text-[11px] font-medium text-[#7b876f]">Compra directa con la opción elegida</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
