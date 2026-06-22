import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HueleCommerceAction } from "./huele-commerce-action";

describe("HueleCommerceAction", () => {
  it("renders a direct purchase link to checkout", () => {
    const html = renderToStaticMarkup(
      <HueleCommerceAction
        productSlug="clasico-verde"
        action={{ mode: "direct", label: "Comprar ahora", variantId: "variant-1" }}
      />
    );

    assert.match(html, /href="\/checkout"/);
    assert.match(html, /Comprar ahora/);
  });

  it("renders a variant-selection link when required", () => {
    const html = renderToStaticMarkup(
      <HueleCommerceAction
        productSlug="premium-negro"
        action={{ mode: "select_variant", label: "Elegir variante", href: "/producto/premium-negro#product-variants" }}
      />
    );

    assert.match(html, /href="\/producto\/premium-negro#product-variants"/);
    assert.match(html, /Elegir variante/);
  });

  it("renders sold out actions as disabled", () => {
    const html = renderToStaticMarkup(
      <HueleCommerceAction
        productSlug="combo-duo-perfecto"
        action={{ mode: "sold_out", label: "Sin stock" }}
      />
    );

    assert.match(html, /aria-disabled="true"/);
    assert.match(html, /Sin stock/);
  });
});
