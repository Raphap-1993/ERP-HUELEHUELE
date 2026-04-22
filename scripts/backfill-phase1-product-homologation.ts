import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function inferVariantAttributes(productSlug: string) {
  if (productSlug === "clasico-verde") {
    return {
      flavorCode: "verde-herbal",
      flavorLabel: "Verde Herbal",
      presentationCode: "unitario",
      presentationLabel: "Unitario"
    };
  }

  if (productSlug === "premium-negro") {
    return {
      flavorCode: "negro-intenso",
      flavorLabel: "Negro Intenso",
      presentationCode: "unitario",
      presentationLabel: "Unitario"
    };
  }

  if (productSlug === "combo-duo-perfecto") {
    return {
      flavorCode: "duo",
      flavorLabel: "Dúo",
      presentationCode: "combo",
      presentationLabel: "Combo"
    };
  }

  return {
    flavorCode: null,
    flavorLabel: null,
    presentationCode: null,
    presentationLabel: null
  };
}

async function main() {
  const products = await prisma.product.findMany({
    include: {
      bundleComponents: true,
      variants: true
    }
  });

  let productsUpdated = 0;
  let variantsUpdated = 0;

  for (const product of products) {
    const nextProductKind = product.bundleComponents.length > 0 ? "bundle" : "single";
    if (product.productKind !== nextProductKind) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          productKind: nextProductKind
        }
      });
      productsUpdated += 1;
    }

    const variantAttributes = inferVariantAttributes(product.slug);

    for (const variant of product.variants) {
      const shouldUpdate =
        variant.flavorCode !== variantAttributes.flavorCode ||
        variant.flavorLabel !== variantAttributes.flavorLabel ||
        variant.presentationCode !== variantAttributes.presentationCode ||
        variant.presentationLabel !== variantAttributes.presentationLabel;

      if (!shouldUpdate) {
        continue;
      }

      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          flavorCode: variantAttributes.flavorCode,
          flavorLabel: variantAttributes.flavorLabel,
          presentationCode: variantAttributes.presentationCode,
          presentationLabel: variantAttributes.presentationLabel
        }
      });
      variantsUpdated += 1;
    }
  }

  console.log(`products_updated=${productsUpdated} variants_updated=${variantsUpdated}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
