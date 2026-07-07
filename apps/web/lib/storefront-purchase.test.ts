import test from "node:test";
import assert from "node:assert/strict";
import type { CatalogProduct } from "@huelegood/shared";
import {
  getStorefrontVariantCount,
  resolveStorefrontPrimaryAction,
  resolveStorefrontPurchaseMode,
  resolveStorefrontStockBadge,
  resolveStorefrontUnavailableLabel
} from "./storefront-purchase";

function buildProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: "prod-1",
    name: "Clásico Verde",
    slug: "clasico-verde",
    categorySlug: "productos",
    tagline: "Frescura herbal",
    description: "Producto de prueba",
    price: 39,
    badge: "Más vendido",
    tone: "emerald",
    benefits: ["Frescura"],
    sku: "HH-CLV",
    defaultVariantId: "var-1",
    variantCount: 1,
    availableStock: 12,
    stockStatus: "available",
    isPurchasable: true,
    variants: [
      {
        id: "var-1",
        sku: "HH-CLV-001",
        name: "Clásico Verde",
        price: 39,
        status: "active",
        availableStock: 12,
        stockStatus: "available",
        isPurchasable: true
      }
    ],
    ...overrides
  };
}

test("resuelve compra directa solo cuando existe una variante vendible", () => {
  const product = buildProduct();

  assert.equal(resolveStorefrontPurchaseMode(product), "direct");
});

test("envia a seleccion de variante cuando hay mas de una variante vendible", () => {
  const product = buildProduct({
    variantCount: 2,
    defaultVariantId: "var-1",
    variants: [
      {
        id: "var-1",
        sku: "HH-PRM-001",
        name: "Premium Negro 10ml",
        price: 49,
        status: "active",
        availableStock: 5,
        stockStatus: "available",
        isPurchasable: true
      },
      {
        id: "var-2",
        sku: "HH-PRM-002",
        name: "Premium Negro 20ml",
        price: 69,
        status: "active",
        availableStock: 8,
        stockStatus: "available",
        isPurchasable: true
      }
    ]
  });

  assert.equal(resolveStorefrontPurchaseMode(product), "select_variant");
});

test("bloquea compra cuando no hay stock disponible aunque falte isPurchasable", () => {
  const product = buildProduct({
    availableStock: 0,
    isPurchasable: undefined,
    stockStatus: "out_of_stock",
    stockLabel: "Sin stock"
  });

  assert.equal(resolveStorefrontPurchaseMode(product), "sold_out");
  assert.equal(resolveStorefrontUnavailableLabel(product), "Sin stock");
});

test("marca low stock con badge comercial estable", () => {
  const product = buildProduct({
    availableStock: 2,
    stockStatus: "low_stock",
    stockLabel: undefined
  });

  assert.deepEqual(resolveStorefrontStockBadge(product), {
    label: "Pocas unidades",
    className: "bg-[#fff7e8] text-[#8c6331]"
  });
});

test("usa variants[] como respaldo para contar variantes cuando variantCount no viene", () => {
  const product = buildProduct({
    variantCount: undefined,
    variants: [
      {
        id: "var-1",
        sku: "HH-CMB-001",
        name: "Combo Verde",
        price: 59,
        status: "active"
      },
      {
        id: "var-2",
        sku: "HH-CMB-002",
        name: "Combo Negro",
        price: 59,
        status: "active"
      }
    ]
  });

  assert.equal(getStorefrontVariantCount(product), 2);
  assert.equal(resolveStorefrontPurchaseMode(product), "select_variant");
});

test("ignora variantes inactivas al decidir si premium negro necesita selector", () => {
  const product = buildProduct({
    slug: "premium-negro",
    defaultVariantId: "var-1",
    variantCount: 3,
    variants: [
      {
        id: "var-1",
        sku: "HG-PN-001",
        name: "Premium Negro - Menta Helada 10 ml",
        price: 39.9,
        status: "active",
        availableStock: 12,
        stockStatus: "available",
        isPurchasable: true,
        flavorLabel: "Menta Helada"
      },
      {
        id: "var-2",
        sku: "HG-PN-002",
        name: "Premium Negro - Eucalipto Frío 10 ml",
        price: 39.9,
        status: "inactive",
        availableStock: 0,
        stockStatus: "out_of_stock",
        isPurchasable: false,
        flavorLabel: "Eucalipto Frío"
      },
      {
        id: "var-3",
        sku: "HG-PN-003",
        name: "Premium Negro - Citrus Herbal 10 ml",
        price: 39.9,
        status: "inactive",
        availableStock: 0,
        stockStatus: "out_of_stock",
        isPurchasable: false,
        flavorLabel: "Citrus Herbal"
      }
    ]
  });

  assert.equal(getStorefrontVariantCount(product), 1);
  assert.equal(resolveStorefrontPurchaseMode(product), "direct");
});

test("resuelve CTA de compra directa para productos comprables de una sola variante", () => {
  const product = buildProduct({
    slug: "clasico-verde",
    defaultVariantId: "var-1"
  });

  assert.deepEqual(resolveStorefrontPrimaryAction(product), {
    mode: "direct",
    label: "Comprar ahora",
    variantId: "var-1"
  });
});

test("resuelve CTA de seleccion cuando el producto exige variante", () => {
  const product = buildProduct({
    slug: "premium-negro",
    variantCount: 2,
    variants: [
      {
        id: "var-1",
        sku: "HH-PRM-001",
        name: "Premium Negro 10ml",
        price: 49,
        status: "active",
        availableStock: 5,
        stockStatus: "available",
        isPurchasable: true
      },
      {
        id: "var-2",
        sku: "HH-PRM-002",
        name: "Premium Negro 20ml",
        price: 69,
        status: "active",
        availableStock: 8,
        stockStatus: "available",
        isPurchasable: true
      }
    ]
  });

  assert.deepEqual(resolveStorefrontPrimaryAction(product), {
    mode: "select_variant",
    label: "Elegir variante",
    href: "/producto/premium-negro#product-variants"
  });
});

test("resuelve CTA deshabilitado cuando el producto no esta disponible", () => {
  const product = buildProduct({
    availableStock: 0,
    isPurchasable: false,
    stockStatus: "out_of_stock",
    stockLabel: "Sin stock"
  });

  assert.deepEqual(resolveStorefrontPrimaryAction(product), {
    mode: "sold_out",
    label: "Sin stock"
  });
});
