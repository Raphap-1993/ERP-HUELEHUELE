import test from "node:test";
import assert from "node:assert/strict";
import type { CatalogProduct } from "@huelegood/shared";
import {
  curateStorefrontProducts,
  isStorefrontStaticFallbackEnabled,
  resolveStorefrontHeroMedia
} from "./storefront-runtime";

function buildProduct(overrides: Partial<CatalogProduct> = {}): CatalogProduct {
  return {
    id: overrides.id ?? "prod-1",
    name: overrides.name ?? "Clasico Verde",
    slug: overrides.slug ?? "clasico-verde",
    categorySlug: overrides.categorySlug ?? "productos",
    tagline: overrides.tagline ?? "Frescura herbal",
    description: overrides.description ?? "Producto de prueba",
    price: overrides.price ?? 39.9,
    badge: overrides.badge ?? "Disponible",
    tone: overrides.tone ?? "emerald",
    benefits: overrides.benefits ?? ["Portátil"],
    sku: overrides.sku ?? "HG-CV-001",
    ...overrides
  };
}

test("isStorefrontStaticFallbackEnabled solo habilita fallback con flag explicito", () => {
  assert.equal(isStorefrontStaticFallbackEnabled(undefined), false);
  assert.equal(isStorefrontStaticFallbackEnabled("false"), false);
  assert.equal(isStorefrontStaticFallbackEnabled("true"), true);
});

test("curateStorefrontProducts respeta featuredProductSlugs cuando existen en runtime", () => {
  const products = [
    buildProduct({ id: "prod-1", slug: "clasico-verde" }),
    buildProduct({ id: "prod-2", slug: "premium-negro", name: "Premium Negro", sku: "HG-PN-001" }),
    buildProduct({ id: "prod-3", slug: "combo-duo-perfecto", name: "Combo Dúo Perfecto", sku: "HG-CDP-001" })
  ];

  const curated = curateStorefrontProducts(products, ["premium-negro", "clasico-verde"]);

  assert.deepEqual(
    curated.map((product) => product.slug),
    ["premium-negro", "clasico-verde"]
  );
});

test("curateStorefrontProducts cae a isFeatured y luego al orden original", () => {
  const featured = buildProduct({ id: "prod-2", slug: "premium-negro", isFeatured: true, name: "Premium Negro", sku: "HG-PN-001" });
  const products = [
    buildProduct({ id: "prod-1", slug: "clasico-verde" }),
    featured
  ];

  assert.deepEqual(curateStorefrontProducts(products).map((product) => product.slug), ["premium-negro"]);
  assert.deepEqual(
    curateStorefrontProducts([buildProduct({ id: "prod-4", slug: "solo-runtime", isFeatured: false })]).map((product) => product.slug),
    ["solo-runtime"]
  );
});

test("resolveStorefrontHeroMedia prioriza heroProductImageUrl y si no usa la primera imagen real de producto", () => {
  const configured = resolveStorefrontHeroMedia({
    siteSetting: {
      heroProductImageUrl: "https://media.huelegood.com/hero/runtime-home.webp"
    },
    products: [
      buildProduct({
        imageUrl: "https://media.huelegood.com/productos/clasico-verde.webp",
        imageAlt: "Clasico Verde real"
      })
    ]
  });

  assert.deepEqual(configured, {
    src: "https://media.huelegood.com/hero/runtime-home.webp",
    alt: "Imagen principal Huele Huele",
    source: "site_setting"
  });

  const productDriven = resolveStorefrontHeroMedia({
    products: [
      buildProduct({
        imageUrl: "https://media.huelegood.com/productos/clasico-verde.webp",
        imageAlt: "Clasico Verde real"
      })
    ]
  });

  assert.deepEqual(productDriven, {
    src: "https://media.huelegood.com/productos/clasico-verde.webp",
    alt: "Clasico Verde real",
    source: "product"
  });

  const fallback = resolveStorefrontHeroMedia({ products: [buildProduct()] });
  assert.deepEqual(fallback, {
    src: undefined,
    alt: "Imagen principal Huele Huele",
    source: "fallback"
  });
});
