import "dotenv/config";
import { Prisma, PrismaClient, VariantStatus } from "@prisma/client";

export const CONFIRM_TOKEN = "premium-negro-retirement-2026-07-07";
export const PREMIUM_NEGRO_RETIRED_AROMA_SKUS = ["HG-PN-002", "HG-PN-003"] as const;
export const PREMIUM_NEGRO_SINGLE_AROMA_LABEL = "Menta Helada";

type RetirementArgs = {
  apply: boolean;
  confirm: string | null;
};

type RetirementEnv = Record<string, string | undefined>;

type VariantSnapshot = {
  sku: string;
  status: string;
};

type ProductDetailAttributeInput = {
  label: string;
  value: string;
};

export function parsePremiumNegroRetirementArgs(argv: string[]): RetirementArgs {
  let apply = false;
  let confirm: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      apply = false;
      continue;
    }

    if (arg === "--confirm") {
      confirm = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--confirm=")) {
      confirm = arg.slice("--confirm=".length) || null;
      continue;
    }

    throw new Error(`Argumento no soportado: ${arg}`);
  }

  return { apply, confirm };
}

export function assertCanApplyPremiumNegroRetirement({
  apply,
  confirm,
  env
}: RetirementArgs & { env: RetirementEnv }) {
  if (!apply) {
    return;
  }

  if (confirm !== CONFIRM_TOKEN) {
    throw new Error(
      `Para aplicar este retiro usa --confirm ${CONFIRM_TOKEN}. Sin confirm correcto solo se permite dry-run.`
    );
  }

  if (env.NODE_ENV === "production" && env.HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_RETIREMENT !== "1") {
    throw new Error(
      "Producción requiere HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_RETIREMENT=1 para proteger data real."
    );
  }
}

export function resolvePremiumNegroRetiredVariants(variants: VariantSnapshot[]) {
  const retiredSkus = new Set(PREMIUM_NEGRO_RETIRED_AROMA_SKUS);
  return variants
    .filter((variant) => retiredSkus.has(variant.sku as (typeof PREMIUM_NEGRO_RETIRED_AROMA_SKUS)[number]))
    .filter((variant) => variant.status !== VariantStatus.inactive)
    .map((variant) => variant.sku);
}

export function buildPremiumNegroSingleAromaAttributes(value: unknown) {
  const normalized = Array.isArray(value)
    ? value.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }

        const label = typeof (entry as { label?: unknown }).label === "string" ? (entry as { label: string }).label.trim() : "";
        const attributeValue =
          typeof (entry as { value?: unknown }).value === "string" ? (entry as { value: string }).value.trim() : "";

        if (!label || !attributeValue) {
          return [];
        }

        return [{ label, value: attributeValue } satisfies ProductDetailAttributeInput];
      })
    : [];

  let replaced = false;
  const nextAttributes = normalized.map((attribute) => {
    if (attribute.label.trim().toLowerCase() !== "aromas") {
      return attribute;
    }

    replaced = true;
    return {
      label: attribute.label,
      value: PREMIUM_NEGRO_SINGLE_AROMA_LABEL
    };
  });

  if (!replaced) {
    nextAttributes.unshift({
      label: "Aromas",
      value: PREMIUM_NEGRO_SINGLE_AROMA_LABEL
    });
  }

  return nextAttributes as Prisma.InputJsonValue;
}

function shouldRunCli() {
  return process.argv[1]?.endsWith("retire-premium-negro-extra-aromas.ts") ?? false;
}

export async function runPremiumNegroRetirement(argv = process.argv.slice(2), env: RetirementEnv = process.env) {
  const args = parsePremiumNegroRetirementArgs(argv);
  assertCanApplyPremiumNegroRetirement({ ...args, env });

  const prisma = new PrismaClient();

  try {
    const product = await prisma.product.findUnique({
      where: { slug: "premium-negro" },
      include: {
        variants: {
          orderBy: { sku: "asc" }
        }
      }
    });

    if (!product) {
      throw new Error("No existe product.slug=premium-negro.");
    }

    const retireSkus = resolvePremiumNegroRetiredVariants(product.variants);
    const detailAttributes = buildPremiumNegroSingleAromaAttributes(product.detailAttributesJson);

    console.log(
      [
        `apply=${args.apply ? "true" : "false"}`,
        `product=${product.slug}`,
        `retire_skus=${retireSkus.join(",") || "none"}`,
        `existing_skus=${product.variants.map((variant) => `${variant.sku}:${variant.status}`).join(",") || "none"}`,
        `single_aroma=${PREMIUM_NEGRO_SINGLE_AROMA_LABEL}`
      ].join(" ")
    );

    if (!args.apply) {
      console.log(`dry_run=true confirm_token=${CONFIRM_TOKEN}`);
      return { retired: 0, productUpdated: false, pending: retireSkus.length };
    }

    const result = await prisma.$transaction(async (tx) => {
      const variantUpdate = retireSkus.length
        ? await tx.productVariant.updateMany({
            where: {
              productId: product.id,
              sku: {
                in: retireSkus
              }
            },
            data: {
              status: VariantStatus.inactive
            }
          })
        : { count: 0 };

      await tx.product.update({
        where: { id: product.id },
        data: {
          detailAttributesJson: detailAttributes
        }
      });

      return {
        retired: variantUpdate.count
      };
    });

    console.log(`retired=${result.retired} detail_attributes_updated=true`);
    return {
      retired: result.retired,
      productUpdated: true,
      pending: 0
    };
  } finally {
    await prisma.$disconnect();
  }
}

if (shouldRunCli()) {
  runPremiumNegroRetirement()
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
