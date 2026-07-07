import type { CatalogProduct } from "@huelegood/shared";

export type StockAwareProduct = Pick<
  CatalogProduct,
  "availableStock" | "isPurchasable" | "stockStatus" | "stockLabel" | "variantCount" | "variants"
>;

export type StorefrontActionProduct = StockAwareProduct &
  Pick<CatalogProduct, "slug" | "defaultVariantId">;

export const PRODUCT_VARIANTS_SECTION_ID = "product-variants";

export type StorefrontPurchaseMode = "direct" | "select_variant" | "sold_out";

export type StorefrontPrimaryAction =
  | {
      mode: "direct";
      label: "Comprar ahora";
      variantId?: string;
    }
  | {
      mode: "select_variant";
      label: "Elegir variante";
      href: string;
    }
  | {
      mode: "sold_out";
      label: string;
    };

export function isStorefrontPurchasable(product: StockAwareProduct) {
  if (typeof product.isPurchasable === "boolean") {
    return product.isPurchasable;
  }

  if (typeof product.availableStock === "number") {
    return product.availableStock > 0;
  }

  return true;
}

export function getStorefrontVariantCount(product: Pick<CatalogProduct, "variantCount" | "variants">) {
  const activeVariantCount = product.variants?.filter((variant) => variant.status === "active").length ?? 0;
  if (activeVariantCount > 0) {
    return activeVariantCount;
  }

  return Math.max(product.variantCount ?? 0, product.variants?.length ?? 0, 1);
}

export function requiresStorefrontVariantSelection(product: Pick<CatalogProduct, "variantCount" | "variants">) {
  return getStorefrontVariantCount(product) > 1;
}

export function resolveStorefrontPurchaseMode(product: CatalogProduct): StorefrontPurchaseMode {
  if (!isStorefrontPurchasable(product)) {
    return "sold_out";
  }

  if (requiresStorefrontVariantSelection(product)) {
    return "select_variant";
  }

  return "direct";
}

export function resolveStorefrontPrimaryAction(product: StorefrontActionProduct): StorefrontPrimaryAction {
  const mode = resolveStorefrontPurchaseMode(product as CatalogProduct);

  if (mode === "sold_out") {
    return {
      mode,
      label: resolveStorefrontUnavailableLabel(product)
    };
  }

  if (mode === "select_variant") {
    return {
      mode,
      label: "Elegir variante",
      href: `/producto/${product.slug}#${PRODUCT_VARIANTS_SECTION_ID}`
    };
  }

  return {
    mode,
    label: "Comprar ahora",
    variantId: product.defaultVariantId
  };
}

export function resolveStorefrontUnavailableLabel(product: StockAwareProduct) {
  if (product.stockStatus === "out_of_stock") {
    return product.stockLabel ?? "Sin stock";
  }

  if (typeof product.availableStock === "number" && product.availableStock <= 0) {
    return product.stockLabel ?? "Sin stock";
  }

  return product.stockLabel ?? "No disponible";
}

export function resolveStorefrontStockBadge(product: StockAwareProduct) {
  if (!isStorefrontPurchasable(product)) {
    return {
      label: resolveStorefrontUnavailableLabel(product),
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
