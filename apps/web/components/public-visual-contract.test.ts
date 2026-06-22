import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

describe("public visual contract", () => {
  it("keeps public chrome on the Huele green visual system", () => {
    const layout = readSource("app/layout.tsx");
    const home = readSource("components/huele-home-experience.tsx");
    const globals = readSource("app/globals.css");

    assert.match(layout, /data-huele-chrome="true"/);
    assert.match(layout, /hh-public-root/);
    assert.match(layout, /resolvePublicLogoUrl/);
    assert.match(layout, /hh-public-site-header/);
    assert.match(layout, /hh-public-site-footer/);
    assert.match(layout, /hh-public-header-cta/);
    assert.match(home, /logoUrl/);
    assert.match(home, /hh-brand-logo-image/);
    assert.match(readSource("components/catalog-browser.tsx"), /hh-catalog-page/);
    assert.match(readSource("components/storefront-game-product-card.tsx"), /hh-catalog-product-card-inner/);
    assert.match(globals, /\.hh-catalog-control-bar/);
    assert.match(globals, /\.hh-catalog-product-grid/);
    assert.match(globals, /\.hh-public-header-frame\s*\{[\s\S]*width: min\(1120px, calc\(100% - 40px\)\)/);
    assert.match(globals, /\.hh-public-root\s*\{[\s\S]*linear-gradient\(180deg, var\(--hh-chrome-green-900\)/);
    assert.match(globals, /\.hh-catalog-product-grid\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
    assert.match(globals, /\.hh-catalog-product-card-inner\s*\{[\s\S]*grid-template-rows: auto 1fr/);
    assert.match(globals, /\.hh-catalog-product-image-shell > div\s*\{[\s\S]*aspect-ratio: 1 \/ 1/);
    assert.match(globals, /\.hh-catalog-product-price div:first-child\s*\{[\s\S]*font-size: clamp\(2\.1rem, 3vw, 2\.75rem\)/);
    assert.match(globals, /\.hh-page\s*\{[\s\S]*display: flow-root/);
    assert.match(globals, /\.hh-top-nav\s*\{[\s\S]*position: sticky/);
    assert.match(globals, /footer:not\(\[data-site-footer="true"\]\)/);
    assert.doesNotMatch(globals, /body:has\(\[data-checkout-fullscreen="true"\]\) footer\s*\{/);
  });

  it("avoids invalid Tailwind opacity shorthands in critical public surfaces", () => {
    const sources = [
      readSource("components/checkout-workspace.tsx"),
      readSource("components/huele-public-ui.tsx"),
      readSource("app/layout.tsx")
    ].join("\n");

    assert.doesNotMatch(sources, /\bbg-white\/(?:82|84|96|98)\b/);
    assert.doesNotMatch(sources, /\btext-\[[^\]]+\]\/(?:64|72|78)\b/);
  });

  it("routes home menu product links to public pages", () => {
    const home = readSource("components/huele-home-experience.tsx");

    assert.match(home, /<Link href="\/catalogo">Productos<\/Link>/);
    assert.match(home, /<Link href="\/mayoristas">Mayoristas<\/Link>/);
    assert.doesNotMatch(home, /href="#productos"[\s\S]*>Productos/);
    assert.doesNotMatch(home, /href="#mayoristas"[\s\S]*>Mayoristas/);
  });

  it("keeps home footer support content explicit instead of count summaries", () => {
    const homeShell = readSource("components/storefront-game-home.tsx");
    const home = readSource("components/huele-home-experience.tsx");
    const globals = readSource("app/globals.css");

    assert.match(home, /<span>WhatsApp<\/span>/);
    assert.match(home, /<span>Envío gratis<\/span>/);
    assert.match(home, /<span>Soporte<\/span>/);
    assert.match(home, /© 2026 Huele Huele\. Perú\./);
    assert.match(home, /<Link href="\/catalogo">Comprar<\/Link>/);
    assert.match(globals, /\.hh-support-band\s*\{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
    assert.doesNotMatch(homeShell, /testimonios activos|preguntas frecuentes activas|Testimonios listos|FAQ conectada|Cliente:|Pregunta frecuente:/);
    assert.doesNotMatch(home, /Contenido oficial|runtime de catálogo|dirección visual verde|Cliente:|Pregunta frecuente:/);
  });

  it("keeps home product and benefits sections spatially balanced", () => {
    const home = readSource("components/huele-home-experience.tsx");
    const globals = readSource("app/globals.css");

    assert.match(home, /hh-benefits-heading/);
    assert.match(home, /hh-product-card-copy/);
    assert.match(globals, /\.hh-products-section\s*\{[\s\S]*scroll-margin-top: 120px/);
    assert.match(globals, /\.hh-benefits-panel\s*\{[\s\S]*scroll-margin-top: 120px/);
    assert.match(globals, /\.hh-benefits-heading\s*\{[\s\S]*text-align: center/);
    assert.match(globals, /\.hh-benefit-icon\s*\{[\s\S]*width: 120px/);
    assert.match(globals, /\.hh-benefit-icon svg\s*\{[\s\S]*width: 30px/);
    assert.match(globals, /\.hh-product-hero-card\s*\{[\s\S]*gap: clamp\(24px, 2\.7vw, 36px\)/);
    assert.match(globals, /\.hh-product-showcase\s*\{[\s\S]*grid-template-columns: minmax\(300px, 0\.36fr\) minmax\(0, 0\.64fr\)/);
  });

  it("keeps checkout framed as a calmer transactional surface", () => {
    const checkout = readSource("components/checkout-workspace.tsx");

    assert.match(checkout, /hh-checkout-page/);
    assert.match(checkout, /Finaliza tu compra/);
    assert.match(checkout, /bg-\[var\(--hh-public-sun\)\]/);
    assert.doesNotMatch(checkout, /Checkout real|Checkout seguro|Quote manda|lookup documental|ruta transaccional|Pago serio|quote recalculando|total listo/);
    assert.doesNotMatch(checkout, />\s*Paso [1-4]\s*</);
    assert.doesNotMatch(checkout, /Paso \{activeStep\}/);
    assert.doesNotMatch(checkout, /Total a pagar ahora[\s\S]{0,250}formatCurrency\(summary\.grandTotal/);
    assert.doesNotMatch(checkout, /<HuelePanel tone="sun">\s*<p[^>]*>Paso actual/);
    assert.doesNotMatch(checkout, /data-checkout-fullscreen/);
  });

  it("keeps PDP variant selection retail-focused", () => {
    const productPage = readSource("app/producto/[slug]/page.tsx");
    const gallery = readSource("components/product-media-gallery.tsx");
    const selector = readSource("components/product-variant-selector.tsx");
    const globals = readSource("app/globals.css");
    const galleryMainBlock =
      globals.match(/\.hh-pdp-gallery-main\s*\{[^}]+\}/)?.[0] ?? "";

    assert.match(productPage, /ProductMediaGallery/);
    assert.match(productPage, /embedded/);
    assert.match(gallery, /useState/);
    assert.match(gallery, /setSelectedId/);
    assert.match(globals, /\.hh-pdp-detail-grid/);
    assert.match(globals, /\.hh-pdp-gallery-thumbs/);
    assert.match(selector, /hh-pdp-variant-shell/);
    assert.match(selector, /hh-pdp-variant-embed/);
    assert.match(selector, /hh-pdp-variant-reference/);
    assert.match(selector, /images\?: ProductImage\[\]/);
    assert.match(selector, /images\[\]\.variantId|variantId/);
    assert.match(globals, /\.hh-pdp-variant-layout/);
    assert.match(globals, /\.hh-pdp-variant-option/);
    assert.match(globals, /\.hh-pdp-variant-embed \.hh-pdp-variant-option\s*\{[\s\S]*min-height: 68px/);
    assert.match(globals, /\.hh-pdp-variant-embed \.hh-pdp-variant-option\s*\{[\s\S]*grid-template-columns: 48px minmax\(0, 1fr\) auto/);
    assert.doesNotMatch(selector, /hh-pdp-variant-main-media|hh-pdp-variant-thumb-row|hh-pdp-variant-option-price/);
    assert.doesNotMatch(globals, /\.hh-pdp-variant-main-media|\.hh-pdp-variant-thumb|\.hh-pdp-variant-option-price/);
    assert.doesNotMatch(galleryMainBlock, /\bborder:/);
    assert.doesNotMatch(productPage, /Precio por variante|Desde/);
    assert.doesNotMatch(productPage, /Ficha de lectura|Producto real|La variante se elige abajo|Volver al catálogo|Información operativa/);
    assert.doesNotMatch(selector, /configuración|Compra directa con la opción elegida|Agregar variante seleccionada|CTA|variantId\./);
  });
});
