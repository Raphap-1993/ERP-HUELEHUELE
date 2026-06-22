"use client";

import { useEffect, useMemo, useState } from "react";
import { featuredProducts, type CatalogSummaryResponse } from "@huelegood/shared";
import { fetchCatalogSummary } from "../lib/api";
import { isStorefrontStaticFallbackEnabled } from "../lib/storefront-runtime";
import {
  HueleBadge,
  HueleButton,
  HuelePanel,
  HuelePublicPage,
  HueleSection,
  HueleStatusCard
} from "./huele-public-ui";
import { StorefrontGameProductCard } from "./storefront-game-product-card";

const CATEGORY_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "productos", label: "Individuales" },
  { id: "bundles", label: "Bundles" }
];

const allowStaticStorefrontFallbacks = isStorefrontStaticFallbackEnabled();

function buildFallbackCatalog(): CatalogSummaryResponse {
  const categories = Array.from(new Set(featuredProducts.map((product) => product.categorySlug))).map((slug) => ({
    slug,
    name: slug === "bundles" ? "Bundles" : "Productos",
    description: "Fallback técnico para desarrollo local",
    productCount: featuredProducts.filter((product) => product.categorySlug === slug).length
  }));

  return {
    products: featuredProducts,
    categories,
    currencyCode: "PEN",
    filters: {}
  };
}

export function CatalogBrowser() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [catalog, setCatalog] = useState<CatalogSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetchCatalogSummary();
        if (!active) {
          return;
        }

        setCatalog(response.data);
      } catch {
        if (active) {
          setCatalog(allowStaticStorefrontFallbacks ? buildFallbackCatalog() : null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const products = catalog?.products ?? [];
  const filters = catalog?.categories?.length
    ? CATEGORY_FILTERS.filter(
        (filter) => filter.id === "todos" || catalog.categories.some((category) => category.slug === filter.id)
      )
    : CATEGORY_FILTERS;

  const visibleProducts = useMemo(() => {
    if (!products.length) {
      return [];
    }

    return products.filter((product) => activeFilter === "todos" || product.categorySlug === activeFilter);
  }, [activeFilter, products]);

  const hasError = !loading && !catalog;

  return (
    <HuelePublicPage
      className="hh-catalog-page"
      eyebrow="Catálogo público"
      title="Catálogo Huele Huele"
      description="Productos disponibles con precio, stock y compra directa."
      actions={
        <>
          <HueleBadge tone="sun">{visibleProducts.length} visibles</HueleBadge>
          <HueleBadge tone="mint">{catalog?.currencyCode ?? "PEN"}</HueleBadge>
        </>
      }
    >
      <HueleSection className="hh-catalog-controls-section">
        <HuelePanel tone="cream" className="hh-catalog-control-bar">
          <div className="hh-catalog-filter-summary">
            <HueleBadge tone="green">Filtro activo</HueleBadge>
            <strong>{filters.find((filter) => filter.id === activeFilter)?.label ?? "Todos"}</strong>
          </div>

          <div className="hh-catalog-filter-buttons" aria-label="Filtrar catálogo">
            {filters.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <HueleButton
                  key={filter.id}
                  type="button"
                  tone={active ? "dark" : "secondary"}
                  aria-pressed={active}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </HueleButton>
              );
            })}
          </div>

          <div className="hh-catalog-stats" aria-label="Resumen del catálogo">
            <span><strong>{products.length}</strong> productos</span>
            <span><strong>{filters.length}</strong> categorías</span>
            <span><strong>{visibleProducts.length}</strong> en vista</span>
          </div>
        </HuelePanel>
      </HueleSection>

      <HueleSection className="hh-catalog-products-section">
        <div className="hh-catalog-product-heading">
          <div>
            <span className="hh-public-kicker">Productos</span>
            <h2>Listos para comprar</h2>
          </div>
          <HueleBadge tone="mint">{visibleProducts.length} resultados</HueleBadge>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <HueleStatusCard title="Cargando" tone="sun" mascot>
              <p>Sincronizando inventario público...</p>
            </HueleStatusCard>
          ) : null}

          {hasError ? (
            <HueleStatusCard title="Catálogo no disponible" tone="dark">
              <p>No pudimos cargar el inventario en este momento. Reintenta en unos segundos.</p>
            </HueleStatusCard>
          ) : null}

          {!loading && !hasError && visibleProducts.length === 0 ? (
            <HueleStatusCard title="Sin resultados" tone="cream" mascot>
              <p>
                No hay productos para ese filtro. Vuelve a `Todos` para ver el surtido completo.
              </p>
            </HueleStatusCard>
          ) : null}

          {!loading && !hasError && visibleProducts.length > 0 ? (
            <section className="hh-catalog-product-grid">
              {visibleProducts.map((product) => (
                <StorefrontGameProductCard key={product.id} product={product} compact />
              ))}
            </section>
          ) : null}
        </div>
      </HueleSection>
    </HuelePublicPage>
  );
}
