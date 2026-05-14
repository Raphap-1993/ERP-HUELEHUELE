import assert from "node:assert/strict";
import { test } from "node:test";
import { BadRequestException } from "@nestjs/common";
import { ProductSalesChannel } from "@huelegood/shared";
import { ProductsService } from "../src/modules/products/products.service";

const FIXED_NOW = new Date("2026-04-15T12:00:00.000Z");

function clone<T>(value: T): T {
  return structuredClone(value);
}

function buildVariant(input: {
  id: string;
  productId?: string;
  sku: string;
  name: string;
  stockOnHand: number;
  availableStock?: number;
  flavorCode: string;
  flavorLabel: string;
  presentationCode?: string;
  presentationLabel?: string;
  createdAtOffset?: number;
}) {
  const productId = input.productId ?? "prod-premium-negro";
  const availableStock = input.availableStock ?? input.stockOnHand;
  const warehouseUpdatedAt = new Date(FIXED_NOW.getTime() + (input.createdAtOffset ?? 0));

  return {
    id: input.id,
    productId,
    defaultWarehouseId: "wh-lima-central",
    flavorCode: input.flavorCode,
    flavorLabel: input.flavorLabel,
    presentationCode: input.presentationCode ?? "unitario",
    presentationLabel: input.presentationLabel ?? "Unitario",
    sku: input.sku,
    name: input.name,
    price: 39.9,
    compareAtPrice: 50,
    stockOnHand: input.stockOnHand,
    lowStockThreshold: 2,
    status: "active" as const,
    createdAt: warehouseUpdatedAt,
    updatedAt: warehouseUpdatedAt,
    defaultWarehouse: {
      code: "WH-LIMA-CENTRAL",
      name: "Lima Central"
    },
    warehouseBalances: [
      {
        warehouseId: "wh-lima-central",
        variantId: input.id,
        stockOnHand: availableStock,
        reservedQuantity: 0,
        committedQuantity: 0,
        updatedAt: warehouseUpdatedAt
      }
    ]
  };
}

function buildProduct(variants: ReturnType<typeof buildVariant>[]) {
  return {
    id: "prod-premium-negro",
    categoryId: "cat-productos",
    productKind: "single" as const,
    name: "Premium Negro",
    slug: "premium-negro",
    shortDescription: "Aromas premium listos para compra.",
    longDescription: "Premium Negro con varias variantes vendibles.",
    badge: "Premium",
    tone: "graphite",
    benefitsJson: ["Acabado premium"],
    detailAttributesJson: [{ label: "Presentación", value: "Unitario" }],
    status: "active" as const,
    salesChannel: ProductSalesChannel.Public,
    reportingGroup: "Premium Negro",
    isFeatured: true,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
    category: {
      id: "cat-productos",
      slug: "productos",
      name: "Productos",
      description: "Catálogo demo",
      isActive: true,
      sortOrder: 0,
      createdAt: FIXED_NOW,
      updatedAt: FIXED_NOW
    },
    variants,
    images: [
      {
        id: "img-premium-negro",
        productId: "prod-premium-negro",
        variantId: variants[0]?.id ?? null,
        url: "https://media.huelegood.test/premium-negro.webp",
        altText: "Premium Negro",
        sortOrder: 1,
        isPrimary: true,
        createdAt: FIXED_NOW,
        updatedAt: FIXED_NOW
      }
    ],
    bundleComponents: []
  };
}

class PrismaStub {
  constructor(private readonly products: ReturnType<typeof buildProduct>[]) {}

  readonly category = {
    findUnique: async () => null
  };

  readonly warehouse = {
    findMany: async () => []
  };

  readonly productVariant = {
    findUnique: async () => null
  };

  readonly warehouseInventoryBalance = {
    findMany: async (args: { where?: { OR?: Array<{ variantId: string; warehouseId: string }> } }) => {
      const requested = args.where?.OR ?? [];

      return this.products
        .flatMap((product) => product.variants)
        .flatMap((variant) =>
          variant.warehouseBalances
            .filter((balance) =>
              requested.some(
                (entry) => entry.variantId === balance.variantId && entry.warehouseId === balance.warehouseId
              )
            )
            .map((balance) => ({
              ...clone(balance),
              warehouse: {
                id: balance.warehouseId,
                code: "WH-LIMA-CENTRAL",
                name: "Lima Central"
              }
            }))
        );
    }
  };

  readonly product = {
    findMany: async (args?: { where?: { slug?: { in?: string[] }; id?: { in?: string[] } } }) => {
      const slugs = args?.where?.slug?.in;
      const ids = args?.where?.id?.in;

      return this.products
        .filter((product) => (slugs ? slugs.includes(product.slug) : true))
        .filter((product) => (ids ? ids.includes(product.id) : true))
        .map((product) => clone(product));
    },
    findUnique: async (args: { where: { id?: string; slug?: string } }) => {
      const product = this.products.find(
        (record) => record.id === args.where.id || record.slug === args.where.slug
      );

      return product ? clone(product) : null;
    }
  };
}

class MediaStub {
  async uploadImage() {
    throw new Error("Not implemented in tests.");
  }

  async deleteByPublicUrl() {}
}

function createService(products: ReturnType<typeof buildProduct>[]) {
  return new ProductsService(new PrismaStub(products) as never, new MediaStub() as never);
}

test("el catálogo y la cotización se cierran a la única variante comprable activa", async () => {
  const service = createService([
    buildProduct([
      buildVariant({
        id: "var-premium-negro-agotado",
        sku: "HG-PN-001",
        name: "Premium Negro - Negro Intenso 10 ml",
        stockOnHand: 0,
        availableStock: 0,
        flavorCode: "negro-intenso",
        flavorLabel: "Negro Intenso"
      }),
      buildVariant({
        id: "var-premium-negro-eucalipto",
        sku: "HG-PN-002",
        name: "Premium Negro - Eucalipto Frío 10 ml",
        stockOnHand: 7,
        availableStock: 7,
        flavorCode: "eucalipto-frio",
        flavorLabel: "Eucalipto Frío",
        createdAtOffset: 1_000
      })
    ])
  ]);

  const product = await service.findCatalogProductBySlug("premium-negro");
  assert.ok(product);
  assert.equal(product.defaultVariantId, "var-premium-negro-eucalipto");
  assert.equal(product.availableStock, 7);
  assert.equal(product.isPurchasable, true);
  assert.equal(product.stockStatus, "available");

  const quote = await service.resolveCheckoutItems([
    {
      slug: "premium-negro",
      quantity: 2
    }
  ]);

  assert.equal(quote.items[0]?.variantId, "var-premium-negro-eucalipto");
  assert.equal(quote.items[0]?.variantName, "Premium Negro - Eucalipto Frío 10 ml");
  assert.equal(quote.items[0]?.flavorCode, "eucalipto-frio");
  assert.equal(quote.items[0]?.flavorLabel, "Eucalipto Frío");
  assert.equal(quote.items[0]?.presentationCode, "unitario");
  assert.equal(quote.items[0]?.presentationLabel, "Unitario");
});

test("la cotización exige variantId cuando hay varias variantes activas comprables", async () => {
  const service = createService([
    buildProduct([
      buildVariant({
        id: "var-premium-negro",
        sku: "HG-PN-001",
        name: "Premium Negro - Negro Intenso 10 ml",
        stockOnHand: 5,
        flavorCode: "negro-intenso",
        flavorLabel: "Negro Intenso"
      }),
      buildVariant({
        id: "var-premium-negro-citrus",
        sku: "HG-PN-003",
        name: "Premium Negro - Citrus Herbal 10 ml",
        stockOnHand: 4,
        flavorCode: "citrus-herbal",
        flavorLabel: "Citrus Herbal",
        createdAtOffset: 1_000
      })
    ])
  ]);

  await assert.rejects(
    async () =>
      service.resolveCheckoutItems([
        {
          slug: "premium-negro",
          quantity: 1
        }
      ]),
    (error) =>
      error instanceof BadRequestException &&
      error.message.includes("variantId explícito")
  );
});

test("rechaza combinaciones duplicadas de aroma y presentación dentro del mismo producto", async () => {
  const service = createService([]);

  await assert.rejects(
    async () =>
      service["normalizeUpsertInput"]({
        name: "Premium Negro",
        slug: "premium-negro",
        status: "active",
        isFeatured: true,
        variants: [
          {
            sku: "HG-PN-001",
            name: "Premium Negro - Negro Intenso 10 ml",
            flavorCode: "negro-intenso",
            flavorLabel: "Negro Intenso",
            presentationCode: "unitario",
            presentationLabel: "Unitario",
            price: 39.9,
            stockOnHand: 10,
            status: "active"
          },
          {
            sku: "HG-PN-002",
            name: "Premium Negro - Negro Intenso 10 ml",
            flavorLabel: "Negro Intenso",
            presentationLabel: "Unitario",
            price: 39.9,
            stockOnHand: 8,
            status: "active"
          }
        ],
        bundleComponents: []
      }),
    (error) =>
      error instanceof BadRequestException &&
      error.message.includes("La combinación aroma/presentación debe ser única")
  );
});
