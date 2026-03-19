"use client";

import { useEffect, useMemo, useState } from "react";
import { featuredProducts, type CatalogProduct, type CatalogSummaryResponse } from "@huelegood/shared";
import { Button, Card, CardContent, CardDescription, Input, ProductGrid, SectionHeader, Badge } from "@huelegood/ui";
import { fetchCatalogSummary } from "../lib/api";

function fallbackCategories() {
  const map = new Map<string, { slug: string; name: string; description: string; productCount: number }>();

  for (const product of featuredProducts) {
    const current = map.get(product.categorySlug) ?? {
      slug: product.categorySlug,
      name: product.categorySlug === "bundles" ? "Bundles" : "Productos",
      description: product.categorySlug === "bundles" ? "Combos y ofertas activas." : "Referencias principales para venta directa.",
      productCount: 0
    };

    current.productCount += 1;
    map.set(product.categorySlug, current);
  }

  return Array.from(map.values());
}

export function CatalogBrowser() {
  const [catalog, setCatalog] = useState<CatalogSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetchCatalogSummary();
        if (!active) {
          return;
        }
        setCatalog(response.data);
        setError(null);
      } catch (fetchError) {
        if (!active) {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el catálogo.");
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

  const products = catalog?.products ?? featuredProducts;
  const categories = catalog?.categories ?? fallbackCategories();

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      if (category !== "all" && product.categorySlug !== category) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [product.name, product.tagline, product.description, product.sku, product.badge]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [category, products, search]);

  return (
    <div className="space-y-8 py-6 md:py-10">
      <SectionHeader
        title="Catálogo"
        description="Productos visibles, bundles y ofertas activas para una compra clara."
        action={{ label: "Ir al checkout", href: "/checkout" }}
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.22em] text-black/40">Buscar</label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Clásico Verde, Premium Negro, combo..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={category === "all" ? "primary" : "secondary"} onClick={() => setCategory("all")}>
                Todas
              </Button>
              {categories.map((item) => (
                <Button
                  key={item.slug}
                  type="button"
                  variant={category === item.slug ? "primary" : "secondary"}
                  onClick={() => setCategory(item.slug)}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-black/55">
            <Badge tone="info">{loading ? "Cargando catálogo..." : `${filteredProducts.length} productos visibles`}</Badge>
            {error ? <span className="text-rose-700">{error}</span> : null}
          </div>
        </CardContent>
      </Card>

      {filteredProducts.length > 0 ? (
        <ProductGrid products={filteredProducts as CatalogProduct[]} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-black/60">No encontramos productos con esos filtros.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
