import type {
  ProductDetailAttribute,
  ProductKindValue,
  ProductVariantRolloutAudit,
  ProductVariantStatusValue
} from "@huelegood/shared";

type VariantAuditInput = {
  flavorCode?: string | null;
  flavorLabel?: string | null;
  presentationCode?: string | null;
  presentationLabel?: string | null;
  status: ProductVariantStatusValue | string;
  defaultWarehouseId?: string | null;
  stockOnHand: number;
  warehouseBalances?: Array<{
    stockOnHand: number;
    reservedQuantity: number;
    committedQuantity: number;
  }>;
};

type ProductVariantRolloutAuditInput = {
  productKind: ProductKindValue | string;
  detailAttributes: ProductDetailAttribute[];
  variants: VariantAuditInput[];
};

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isAromaAttribute(label: string) {
  const normalized = normalizeKey(label);
  return normalized === "aroma" || normalized === "aromas";
}

function splitAromaValue(value: string) {
  return value
    .split(/\s+y\s+|,|;|\+/i)
    .map((entry) => normalizeText(entry))
    .filter((entry): entry is string => Boolean(entry));
}

export function extractAromaCopyValues(detailAttributes: ProductDetailAttribute[]) {
  const values = detailAttributes
    .filter((attribute) => isAromaAttribute(attribute.label))
    .flatMap((attribute) => splitAromaValue(attribute.value));

  return Array.from(new Set(values));
}

function variantHasInventoryBalances(variant: VariantAuditInput) {
  return (variant.warehouseBalances ?? []).length > 0;
}

function variantHasOperationalInventory(variant: VariantAuditInput) {
  if (variantHasInventoryBalances(variant)) {
    return true;
  }

  return variant.stockOnHand > 0;
}

function activeFlavorKeys(variants: VariantAuditInput[]) {
  return Array.from(
    new Set(
      variants
        .flatMap((variant) => {
          const label = normalizeText(variant.flavorLabel);
          const code = normalizeText(variant.flavorCode);
          return [label, code].filter((value): value is string => Boolean(value)).map(normalizeKey);
        })
        .filter(Boolean)
    )
  );
}

export function buildProductVariantRolloutAudit(
  input: ProductVariantRolloutAuditInput
): ProductVariantRolloutAudit {
  if (input.productKind === "bundle") {
    return {
      status: "not_applicable",
      activeVariantCount: 0,
      totalVariantCount: input.variants.length,
      aromaCopyValues: [],
      warnings: [],
      recommendedActions: ["Los bundles no se convierten por aroma; su disponibilidad depende de sus componentes."]
    };
  }

  const aromaCopyValues = extractAromaCopyValues(input.detailAttributes);
  const activeVariants = input.variants.filter((variant) => variant.status === "active");
  const warnings: string[] = [];
  const recommendedActions: string[] = [];
  const copyAromaKeys = aromaCopyValues.map(normalizeKey);
  const flavorKeys = activeFlavorKeys(activeVariants);
  const activeVariantCount = activeVariants.length;
  const totalVariantCount = input.variants.length;

  const hasMissingVariantMetadata = activeVariants.some(
    (variant) =>
      !normalizeText(variant.flavorCode) ||
      !normalizeText(variant.flavorLabel) ||
      !normalizeText(variant.presentationCode) ||
      !normalizeText(variant.presentationLabel)
  );

  if (copyAromaKeys.length > 0 && flavorKeys.length > 0) {
    const uncoveredCopyAromas = aromaCopyValues.filter((value) => !flavorKeys.includes(normalizeKey(value)));
    if (uncoveredCopyAromas.length > 0) {
      warnings.push(
        `El copy de Aromas menciona ${uncoveredCopyAromas.join(", ")}, pero no existen como variantes activas reales.`
      );
    }
  }

  if (activeVariantCount <= 1) {
    if (copyAromaKeys.length > 1) {
      warnings.push("La ficha comercial promete varios aromas, pero solo existe una variante activa vendible.");
      recommendedActions.push(
        "Usa el asistente de conversión para generar una variante vendible por aroma antes de abrir venta multi-aroma."
      );

      return {
        status: "copy_needs_variants",
        activeVariantCount,
        totalVariantCount,
        aromaCopyValues,
        warnings,
        recommendedActions
      };
    }

    recommendedActions.push(
      "Si este producto crecerá a más aromas, prepara la matriz de variantes y luego carga stock por variante en Inventario."
    );

    return {
      status: "single_variant",
      activeVariantCount,
      totalVariantCount,
      aromaCopyValues,
      warnings,
      recommendedActions
    };
  }

  if (hasMissingVariantMetadata) {
    warnings.push("Hay variantes activas sin flavor/presentation completos.");
  }

  const variantsWithoutWarehouse = activeVariants.filter((variant) => !normalizeText(variant.defaultWarehouseId));
  if (variantsWithoutWarehouse.length > 0) {
    warnings.push("Hay variantes activas sin almacén preferido configurado.");
  }

  const variantsWithoutInventory = activeVariants.filter((variant) => !variantHasOperationalInventory(variant));
  if (variantsWithoutInventory.length > 0) {
    warnings.push("Hay variantes activas sin stock operativo cargado por variante y almacén.");
  }

  if (
    variantsWithoutWarehouse.length > 0 ||
    variantsWithoutInventory.length > 0 ||
    hasMissingVariantMetadata ||
    warnings.length > 0
  ) {
    recommendedActions.push(
      "Completa flavor/presentation, asigna almacén preferido y carga stock inicial con physical_count antes de publicar."
    );

    return {
      status: "multi_variant_incomplete",
      activeVariantCount,
      totalVariantCount,
      aromaCopyValues,
      warnings,
      recommendedActions
    };
  }

  recommendedActions.push(
    "El producto ya está listo para carga operativa y smoke funcional por variantId + warehouseId."
  );

  return {
    status: "multi_variant_ready",
    activeVariantCount,
    totalVariantCount,
    aromaCopyValues,
    warnings,
    recommendedActions
  };
}
