import test from "node:test";
import assert from "node:assert/strict";
import { resolveStorefrontMediaRequestSrc } from "./media";

test("resolveStorefrontMediaRequestSrc mantiene URLs locales sin mutarlas", () => {
  assert.equal(resolveStorefrontMediaRequestSrc("/brand/game/hero.png"), "/brand/game/hero.png");
});

test("resolveStorefrontMediaRequestSrc agrega parametros de optimizacion para media remota storefront", () => {
  const result = resolveStorefrontMediaRequestSrc("https://media.huelegood.com/hero/runtime-home.webp", {
    width: 960,
    quality: 78
  });

  assert.equal(
    result,
    "https://media.huelegood.com/hero/runtime-home.webp?width=960&quality=78&format=auto"
  );
});
