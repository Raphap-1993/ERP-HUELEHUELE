import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  HueleBadge,
  HueleMascot,
  HuelePanel,
  HuelePublicPage
} from "./huele-public-ui";

describe("Huele public UI primitives", () => {
  it("renders the public green page scope and preserves child content", () => {
    const html = renderToStaticMarkup(
      <HuelePublicPage eyebrow="Catalogo" title="Frescura real" description="Compra publica">
        <HuelePanel>
          <HueleBadge tone="sun">Stock real</HueleBadge>
        </HuelePanel>
      </HuelePublicPage>
    );

    assert.match(html, /data-huele-public="true"/);
    assert.match(html, /Frescura real/);
    assert.match(html, /Stock real/);
  });

  it("renders mascot variants without requiring visible alt text for decorative use", () => {
    const decorative = renderToStaticMarkup(<HueleMascot size="sm" decorative />);
    const labelled = renderToStaticMarkup(<HueleMascot size="md" alt="Lorito guia" />);

    assert.match(decorative, /aria-hidden="true"/);
    assert.match(labelled, /alt="Lorito guia"/);
  });
});
