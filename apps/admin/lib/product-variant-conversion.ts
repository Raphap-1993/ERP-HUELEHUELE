import type { ProductVariantStatusValue } from "@huelegood/shared";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export type ProductVariantAuditSummary = {
  status?: string;
  warnings: string[];
  recommendedActions: string[];
  aromaCopyValues: string[];
};

export type ProductDetailAttributeLike = {
  label?: string | null;
  value?: string | null;
};

export type GuidedAromaOption = {
  raw: string;
  label: string;
  code: string;
};

export type GuidedVariantBase = {
  id?: string;
  sku: string;
  name: string;
  flavorCode: string;
  flavorLabel: string;
  presentationCode: string;
  presentationLabel: string;
  defaultWarehouseId: string;
  price: string;
  compareAtPrice: string;
  stockOnHand: string;
  lowStockThreshold: string;
  status: ProductVariantStatusValue;
};

export type GuidedVariantDraft = GuidedVariantBase & {
  sourceAroma: GuidedAromaOption;
};

const LIST_SEPARATOR_REGEX = /[\n\r,;|•]+|\s+\/\s+/g;

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dedupeByCode(items: GuidedAromaOption[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item.code || seen.has(item.code)) {
      return false;
    }

    seen.add(item.code);
    return true;
  });
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeDetailAttributeLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isAromaDetailAttribute(label?: string | null) {
  const normalized = normalizeDetailAttributeLabel(label ?? "");
  return normalized === "aroma" || normalized === "aromas";
}

function toTitleCase(value: string) {
  return value
    .toLocaleLowerCase("es-PE")
    .split(" ")
    .map((chunk) => (chunk ? chunk[0]!.toLocaleUpperCase("es-PE") + chunk.slice(1) : chunk))
    .join(" ");
}

function normalizeAromaLabel(value: string) {
  const cleaned = value
    .trim()
    .replace(/[_]+/g, " ")
    .replace(/\s*[-/]+\s*/g, " ")
    .replace(/\s+/g, " ");

  return cleaned ? toTitleCase(cleaned) : "";
}

function createAromaOption(rawValue: string): GuidedAromaOption | null {
  const raw = rawValue.trim();
  if (!raw) {
    return null;
  }

  const label = normalizeAromaLabel(raw);
  const code = slugify(label);
  if (!label || !code) {
    return null;
  }

  return {
    raw,
    label,
    code
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripBaseFlavorFromName(baseName: string, flavorLabel?: string, flavorCode?: string) {
  const removalTokens = [flavorLabel, normalizeAromaLabel(flavorCode ?? "")]
    .map((value) => value?.trim())
    .filter(Boolean) as string[];

  return removalTokens.reduce((current, token) => {
    const pattern = new RegExp(`(?:\\s*[·\\-\\/]+\\s*)?${escapeRegExp(token)}`, "i");
    return current.replace(pattern, "").replace(/\s+/g, " ").trim();
  }, baseName);
}

function resolveVariantName(baseVariant: GuidedVariantBase, productName: string, aromaLabel: string) {
  const genericNames = new Set(
    [productName, "variante principal", "presentacion principal"]
      .map((value) => normalizeDetailAttributeLabel(value))
      .filter(Boolean)
  );

  const strippedBaseName = stripBaseFlavorFromName(
    baseVariant.name.trim(),
    baseVariant.flavorLabel,
    baseVariant.flavorCode
  );

  let stem = strippedBaseName;
  if (!stem || genericNames.has(normalizeDetailAttributeLabel(stem))) {
    stem = baseVariant.presentationLabel.trim();
  }

  if (!stem || genericNames.has(normalizeDetailAttributeLabel(stem))) {
    return aromaLabel;
  }

  if (normalizeDetailAttributeLabel(stem).includes(normalizeDetailAttributeLabel(aromaLabel))) {
    return stem;
  }

  return `${stem} · ${aromaLabel}`;
}

function resolveSkuPrefix(baseVariant: GuidedVariantBase, productName: string) {
  let prefix = baseVariant.sku.trim().toUpperCase();
  const flavorTokens = [baseVariant.flavorCode, baseVariant.flavorLabel]
    .map((value) => slugify(value).toUpperCase())
    .filter(Boolean);

  flavorTokens.forEach((token) => {
    if (prefix === token) {
      prefix = "";
      return;
    }

    if (prefix.endsWith(`-${token}`)) {
      prefix = prefix.slice(0, -(token.length + 1));
    }
  });

  prefix = prefix.replace(/-\d{1,3}$/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "");

  return prefix || slugify(productName).toUpperCase() || "VARIANTE";
}

export function extractProductVariantAudit(product: unknown): ProductVariantAuditSummary | undefined {
  if (!product || typeof product !== "object") {
    return undefined;
  }

  const candidate = (product as { variantAudit?: unknown }).variantAudit;
  if (!candidate || typeof candidate !== "object") {
    return undefined;
  }

  const status = typeof (candidate as { status?: unknown }).status === "string"
    ? (candidate as { status: string }).status.trim()
    : undefined;

  return {
    status: status || undefined,
    warnings: normalizeStringArray((candidate as { warnings?: unknown }).warnings),
    recommendedActions: normalizeStringArray((candidate as { recommendedActions?: unknown }).recommendedActions),
    aromaCopyValues: normalizeStringArray((candidate as { aromaCopyValues?: unknown }).aromaCopyValues)
  };
}

export function getVariantAuditTone(status?: string): BadgeTone {
  const normalized = status?.trim().toLowerCase();

  if (
    normalized === "healthy" ||
    normalized === "ok" ||
    normalized === "ready" ||
    normalized === "multi_variant_ready"
  ) {
    return "success";
  }

  if (normalized === "warning" || normalized === "review" || normalized === "single_variant") {
    return "warning";
  }

  if (
    normalized === "action_required" ||
    normalized === "critical" ||
    normalized === "needs_conversion" ||
    normalized === "copy_needs_variants" ||
    normalized === "multi_variant_incomplete"
  ) {
    return "danger";
  }

  return normalized ? "info" : "neutral";
}

export function getVariantAuditLabel(status?: string) {
  const normalized = status?.trim().toLowerCase();

  if (
    normalized === "healthy" ||
    normalized === "ok" ||
    normalized === "ready" ||
    normalized === "multi_variant_ready"
  ) {
    return "Canónico";
  }

  if (normalized === "single_variant") {
    return "Single validado";
  }

  if (normalized === "warning" || normalized === "review" || normalized === "multi_variant_incomplete") {
    return "Revisar rollout";
  }

  if (
    normalized === "action_required" ||
    normalized === "critical" ||
    normalized === "needs_conversion" ||
    normalized === "copy_needs_variants"
  ) {
    return "Conversión sugerida";
  }

  if (normalized === "not_applicable") {
    return "No aplica";
  }

  return status?.trim() ? `Audit: ${status.trim()}` : "Modo manual";
}

export function parseAromaList(rawValue: string) {
  return dedupeByCode(
    rawValue
      .split(LIST_SEPARATOR_REGEX)
      .map((chunk) => createAromaOption(chunk))
      .filter((item): item is GuidedAromaOption => Boolean(item))
  );
}

export function collectAromaSuggestions(
  detailAttributes: ProductDetailAttributeLike[],
  variantAudit?: ProductVariantAuditSummary
) {
  const detailValues = detailAttributes
    .filter((attribute) => isAromaDetailAttribute(attribute.label))
    .map((attribute) => attribute.value ?? "");

  return dedupeByCode(
    [...(variantAudit?.aromaCopyValues ?? []), ...detailValues].flatMap((value) => parseAromaList(value))
  );
}

export function buildAromaInputValue(aromas: GuidedAromaOption[]) {
  return aromas.map((aroma) => aroma.label).join("\n");
}

export function buildGuidedVariantsFromBase(options: {
  aromas: GuidedAromaOption[];
  baseVariant: GuidedVariantBase;
  productName: string;
}) {
  const { aromas, baseVariant, productName } = options;
  const skuPrefix = resolveSkuPrefix(baseVariant, productName);
  const usedSkus = new Set<string>();

  return dedupeByCode(aromas).map((aroma, index) => {
    const baseSku = `${skuPrefix}-${aroma.code.toUpperCase()}`
      .replace(/--+/g, "-")
      .replace(/^-+|-+$/g, "");

    let sku = baseSku;
    let suffix = 2;
    while (usedSkus.has(sku)) {
      sku = `${baseSku}-${String(suffix).padStart(2, "0")}`;
      suffix += 1;
    }
    usedSkus.add(sku);

    return {
      id: index === 0 ? baseVariant.id : undefined,
      sku,
      name: resolveVariantName(baseVariant, productName, aroma.label),
      flavorCode: aroma.code,
      flavorLabel: aroma.label,
      presentationCode: baseVariant.presentationCode,
      presentationLabel: baseVariant.presentationLabel,
      defaultWarehouseId: baseVariant.defaultWarehouseId,
      price: baseVariant.price,
      compareAtPrice: baseVariant.compareAtPrice,
      stockOnHand: "0",
      lowStockThreshold: baseVariant.lowStockThreshold || "100",
      status: baseVariant.status,
      sourceAroma: aroma
    };
  });
}
