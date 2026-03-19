"use client";

import { useEffect, useMemo, useState } from "react";
import { featuredProducts, type CatalogProduct, type CatalogSummaryResponse } from "@huelegood/shared";
import { Button, Card, CardContent, Input, Badge } from "@huelegood/ui";
import { fetchCatalogSummary } from "../lib/api";
import { EditorialMedia, EditorialProductGrid } from "./public-brand";
import { brandArt } from "./public-brand-art";
import { PublicChecklist, PublicPageHero, PublicPanel, PublicSectionHeading } from "./public-shell";

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
    <div className="space-y-10 py-6 md:space-y-14 md:py-10">
      <PublicPageHero
        eyebrow="Colección Huele Huele"
        title="Un catálogo corto, claro y visual para comprar bien."
        description="La selección pública debe verse curada y fácil de recorrer. Aquí no hay ruido: solo los formatos activos, sus diferencias y una salida clara hacia compra directa o volumen."
        actions={[
          { label: "Comprar ahora", href: "/checkout" },
          { label: "Compra por volumen", href: "/mayoristas", variant: "secondary" }
        ]}
        metrics={[
          { label: "Selección", value: `${products.length}`, detail: "Referencias visibles hoy en producción." },
          { label: "Compra", value: "Directa", detail: "Desde catálogo o checkout sin navegación confusa." },
          { label: "Ruta", value: "Rápida", detail: "Filtros simples y decisiones visuales claras." }
        ]}
        aside={<EditorialMedia src={brandArt.hero} alt="Visual editorial del catálogo Huele Huele" className="min-h-[440px]" />}
      />

      <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
        <PublicPanel className="space-y-5">
          <PublicSectionHeading
            eyebrow="Filtrar"
            title="Encuentra el formato correcto en segundos."
            description="La navegación del catálogo tiene que sentirse simple y premium. Filtro, búsqueda y producto, sin más."
          />
          <Card className="rounded-[2rem] border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(243,246,238,0.98)_100%)] shadow-none">
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
        </PublicPanel>

        <Card className="overflow-hidden rounded-[2.4rem] border-black/8 bg-[#132016] text-white shadow-[0_28px_90px_rgba(19,32,22,0.24)]">
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Badge className="w-fit bg-white/14 text-white">Guía rápida</Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">Cómo elegir sin perder tiempo.</h2>
              <p className="text-sm leading-7 text-white/74">
                El catálogo tiene sentido cuando el cliente entiende de inmediato qué formato le conviene más.
              </p>
            </div>
            <PublicChecklist
              tone="dark"
              items={[
                "Clásico Verde para uso diario y entrada natural a la marca.",
                "Premium Negro si priorizas una presencia más sobria y pulida.",
                "Combo Dúo Perfecto si quieres más valor y cobertura de varios momentos."
              ]}
            />
            <EditorialMedia
              src={brandArt.travel}
              alt="Uso editorial de Huele Huele en movimiento"
              className="min-h-[260px] border-white/10 bg-white/8 shadow-none"
            />
          </CardContent>
        </Card>
      </section>

      {filteredProducts.length > 0 ? (
        <section className="space-y-6">
          <PublicSectionHeading
            eyebrow="Productos activos"
            title="Formatos listos para compra inmediata."
            description="Cada referencia mantiene una ficha visual clara, beneficios visibles y una salida directa al checkout."
          />
          <EditorialProductGrid products={filteredProducts as CatalogProduct[]} />
        </section>
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
