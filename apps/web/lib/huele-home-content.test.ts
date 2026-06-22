import test from "node:test";
import assert from "node:assert/strict";
import {
  hueleHomeBenefits,
  hueleHomeMoments,
  hueleHomeProducts,
  resolveHueleHomeProductCards
} from "./huele-home-content";

test("huele home content preserves official benefit and moment structure", () => {
  assert.deepEqual(
    hueleHomeBenefits.map((benefit) => benefit.title),
    ["Soroche", "Mareos", "Malos olores", "Energía"]
  );

  assert.deepEqual(
    hueleHomeMoments.map((moment) => moment.key),
    ["trafico", "oficina", "viaje", "sierra", "noche"]
  );
});

test("huele home product cards prefer runtime catalog data over static labels", () => {
  const cards = resolveHueleHomeProductCards([
    {
      id: "prod-1",
      name: "Runtime Verde",
      slug: "clasico-verde",
      categorySlug: "productos",
      tagline: "Runtime tagline",
      description: "Runtime description",
      price: 34.9,
      badge: "Runtime badge",
      tone: "emerald",
      benefits: ["Runtime benefit"],
      sku: "RT-VERDE",
      imageUrl: "/fallback-runtime-image.webp",
      imageAlt: "Fallback runtime image",
      images: [
        {
          id: "img-secondary",
          url: "/media/runtime-secondary.webp",
          altText: "Secondary image",
          sortOrder: 2,
          isPrimary: false
        },
        {
          id: "img-primary",
          url: "/media/runtime-primary.webp",
          altText: "Primary image from database",
          sortOrder: 1,
          isPrimary: true
        }
      ],
      defaultVariantId: "variant-1",
      variantCount: 1,
      isPurchasable: true,
      stockStatus: "available"
    }
  ]);

  assert.equal(cards[0].name, "Runtime Verde");
  assert.equal(cards[0].priceLabel, "S/ 34.90");
  assert.equal(cards[0].href, "/producto/clasico-verde");
  assert.equal(cards[0].ctaLabel, "Comprar ahora");
  assert.equal(cards[0].imageUrl, "/media/runtime-primary.webp");
  assert.equal(cards[0].imageAlt, "Primary image from database");
  assert.equal(cards[0].source, "runtime");
  assert.equal(hueleHomeProducts.length, 3);
});

test("huele home product cards are built from every runtime product before using static fallbacks", () => {
  const cards = resolveHueleHomeProductCards([
    {
      id: "prod-2",
      name: "Producto nuevo desde BD",
      slug: "producto-nuevo-db",
      categorySlug: "productos",
      tagline: "Texto administrado",
      description: "Descripcion administrada",
      price: 49.9,
      badge: "Nuevo",
      tone: "amber",
      benefits: ["Runtime benefit"],
      sku: "RT-NEW",
      imageUrl: "/media/producto-nuevo.webp",
      defaultVariantId: "variant-2",
      variantCount: 1,
      isPurchasable: true,
      stockStatus: "available"
    }
  ]);

  assert.equal(cards.length, 1);
  assert.equal(cards[0].key, "producto-nuevo-db");
  assert.equal(cards[0].name, "Producto nuevo desde BD");
  assert.equal(cards[0].imageUrl, "/media/producto-nuevo.webp");
  assert.equal(cards[0].source, "runtime");
});
