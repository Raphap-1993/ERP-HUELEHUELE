"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { featuredProducts } from "@huelegood/shared";
import type { CatalogSummaryResponse } from "@huelegood/shared";
import { fetchCatalogSummary } from "../lib/api";

const STATIC_PRODUCTS = [
  {
    slug: "premium-negro",
    name: "Premium Negro",
    badge: "⭐ Más popular",
    badgeStyle: "bg-[#c9a84c] text-[#1a3a2e]",
    emoji: "🖤",
    imgBg: "bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]",
    desc: "Fórmula intensificada. El del gym, las noches y los viajes a la sierra. Mentol potente de efecto inmediato.",
    tags: ["Gym", "Altitud", "Noche", "Foco"],
    price: "S/ 39.90",
    priceNote: "+ recarga incluida",
    priceOld: undefined as string | undefined,
    priceSave: undefined as string | undefined,
    cat: "ind",
    featured: false,
    btnClass: "bg-[#1c1c1c] hover:bg-black",
    btnLabel: "Lo quiero",
  },
  {
    slug: "clasico-verde",
    name: "Clásico Verde",
    badge: "🌿 Nuevo",
    badgeStyle: "bg-[#1a3a2e] text-white",
    emoji: "🌿",
    imgBg: "bg-gradient-to-br from-[#e8f5e9] to-[#d8f3dc]",
    desc: "Frescura herbal suave para el día a día. Tráfico, oficina, estudio y viajes largos. Ideal para el soroche.",
    tags: ["Diario", "Viaje", "Oficina", "Soroche"],
    price: "S/ 34.90",
    priceNote: "+ recarga incluida",
    priceOld: undefined as string | undefined,
    priceSave: undefined as string | undefined,
    cat: "ind",
    featured: false,
    btnClass: "bg-[#2d6a4f] hover:bg-[#1a3a2e]",
    btnLabel: "Lo quiero",
  },
  {
    slug: "pack-x3",
    name: "Pack x3 — Escoge tus aromas",
    badge: "🔥 Mejor valor",
    badgeStyle: "bg-[#c9a84c] text-[#1a3a2e]",
    emoji: "✨",
    imgBg: "bg-gradient-to-br from-[#fffbeb] to-[#fef3c7]",
    desc: "3 inhaladores con recarga incluida. Combina Verde y Negro como quieras. El pack ideal para tener en casa, en el trabajo y en la mochila.",
    tags: ["3 inhaladores", "Eliges el aroma", "Con recarga"],
    price: "S/ 99.90",
    priceNote: undefined as string | undefined,
    priceOld: "S/ 119.70",
    priceSave: "Ahorras S/ 19.80",
    cat: "pack",
    featured: true,
    btnClass: "bg-[#c9a84c] hover:bg-[#f0d080] text-[#1a3a2e] shadow-[0_8px_30px_rgba(201,168,76,0.3)]",
    btnLabel: "¡Quiero el Pack! →",
  },
  {
    slug: "combo-duo-perfecto",
    name: "Pack Dúo Perfecto",
    badge: "🎁 Regalo",
    badgeStyle: "bg-[#1a1a1a] text-white",
    emoji: "🎁",
    imgBg: "bg-gradient-to-r from-[#e8f5e9] to-[#1e1e1e]",
    desc: "1 Verde + 1 Negro. Frescura suave y potencia máxima juntos. El detalle perfecto para regalar.",
    tags: ["Verde + Negro", "Para regalar"],
    price: "S/ 69.90",
    priceNote: undefined as string | undefined,
    priceOld: "S/ 74.80",
    priceSave: undefined as string | undefined,
    cat: "pack regalo",
    featured: false,
    btnClass: "bg-[#2d6a4f] hover:bg-[#1a3a2e]",
    btnLabel: "Lo quiero",
  },
  {
    slug: "pack-regalo-premium",
    name: "Pack Regalo Premium",
    badge: "💜 Premium",
    badgeStyle: "bg-[#9333ea] text-white",
    emoji: "🌸",
    imgBg: "bg-gradient-to-br from-[#fdf2f8] to-[#fce7f3]",
    desc: "2 inhaladores + empaque especial. El detalle perfecto para cumpleaños o cualquier ocasión especial.",
    tags: ["Presentación especial", "2 und."],
    price: "S/ 74.90",
    priceNote: "Con empaque regalo",
    priceOld: undefined as string | undefined,
    priceSave: undefined as string | undefined,
    cat: "regalo",
    featured: false,
    btnClass: "bg-[#2d6a4f] hover:bg-[#1a3a2e]",
    btnLabel: "Lo quiero",
  },
];

const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "ind", label: "Individuales" },
  { id: "pack", label: "Packs" },
  { id: "regalo", label: "Regalos" },
];

export function CatalogBrowser() {
  const [activeFilter, setActiveFilter] = useState("todos");
  const [catalog, setCatalog] = useState<CatalogSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetchCatalogSummary();
        if (!active) return;
        setCatalog(response.data);
      } catch {
        // silently fall back to static products
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  // catalog and loading kept for future use; suppress unused-var lint
  void catalog;
  void loading;

  const visibleProducts = useMemo(
    () =>
      STATIC_PRODUCTS.filter(
        (p) => activeFilter === "todos" || p.cat.includes(activeFilter)
      ),
    [activeFilter]
  );

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-[1120px] px-6">
        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-6 mb-13 flex-wrap">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[#d8f3dc] text-[#2d6a4f]">
              Nuestros productos
            </span>
            <h2 className="font-serif text-5xl font-black text-[#1a3a2e] mt-4 mb-3">
              Todo Huele Huele,
              <br />
              en un solo lugar
            </h2>
            <p className="text-[17px] text-[#6b7280] leading-7 max-w-[560px]">
              Elige el que va contigo. Todos incluyen cartucho de recarga y aceites esenciales 100% naturales.
            </p>
          </div>

          {/* Filters */}
          <div className="flex gap-2.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border-[1.5px] transition ${
                  activeFilter === f.id
                    ? "bg-[#d8f3dc] border-[#52b788] text-[#1a3a2e]"
                    : "border-[rgba(45,106,79,0.22)] text-[#6b7280] hover:bg-[#d8f3dc] hover:border-[#52b788] hover:text-[#1a3a2e]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Product grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product) =>
            product.featured ? (
              /* Featured card — spans 2 columns with side-by-side layout */
              <div
                key={product.slug}
                className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 rounded-2xl overflow-hidden border border-[rgba(45,106,79,0.12)] shadow-sm"
              >
                {/* Image side */}
                <div className={`relative flex items-center justify-center min-h-[220px] ${product.imgBg}`}>
                  <span className="text-7xl select-none">{product.emoji}</span>
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${product.badgeStyle}`}
                  >
                    {product.badge}
                  </span>
                </div>

                {/* Body side */}
                <div className="flex flex-col justify-between p-6 bg-white">
                  <div>
                    <h3 className="font-serif text-xl font-black text-[#1a3a2e] mb-2 leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-sm text-[#6b7280] leading-6 mb-4">{product.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {product.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full bg-[#d8f3dc] text-[#1a3a2e] text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-serif text-2xl font-bold text-[#1a3a2e]">
                        {product.price}
                      </div>
                      {product.priceOld && (
                        <div className="text-sm text-[#6b7280] line-through">{product.priceOld}</div>
                      )}
                      {product.priceSave && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#d8f3dc] text-[#2d6a4f] text-xs font-semibold">
                          {product.priceSave}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/checkout?producto=${product.slug}`}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white transition ${product.btnClass}`}
                    >
                      {product.btnLabel}
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Standard vertical card */
              <div
                key={product.slug}
                className="relative flex flex-col rounded-2xl overflow-hidden border border-[rgba(45,106,79,0.12)] shadow-sm bg-white"
              >
                {/* Image */}
                <div className={`relative flex items-center justify-center min-h-[180px] ${product.imgBg}`}>
                  <span className="text-6xl select-none">{product.emoji}</span>
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold ${product.badgeStyle}`}
                  >
                    {product.badge}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-serif text-lg font-black text-[#1a3a2e] mb-2 leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-sm text-[#6b7280] leading-6 mb-4 flex-1">{product.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 rounded-full bg-[#d8f3dc] text-[#1a3a2e] text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-end justify-between gap-3 flex-wrap mt-auto">
                    <div>
                      <div className="font-serif text-2xl font-bold text-[#1a3a2e]">
                        {product.price}
                      </div>
                      {product.priceOld && (
                        <div className="text-sm text-[#6b7280] line-through">{product.priceOld}</div>
                      )}
                      {product.priceSave && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#d8f3dc] text-[#2d6a4f] text-xs font-semibold">
                          {product.priceSave}
                        </span>
                      )}
                      {product.priceNote && (
                        <div className="text-xs text-[#6b7280] mt-0.5">{product.priceNote}</div>
                      )}
                    </div>
                    <Link
                      href={`/checkout?producto=${product.slug}`}
                      className={`rounded-full px-4 py-2.5 text-sm font-semibold text-white transition ${product.btnClass}`}
                    >
                      {product.btnLabel}
                    </Link>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* ── Footer ── */}
        <div className="text-center mt-12">
          <p className="text-sm text-[#6b7280] mb-4">
            💳 Yape · Plin · Transferencia · Contra-entrega &nbsp;|&nbsp; 🚚 Envíos 24-72h a todo el Perú
          </p>
          <a
            href="https://www.instagram.com/huele.good/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[rgba(45,106,79,0.3)] text-[#1a3a2e] text-sm font-medium hover:border-[#2d6a4f] hover:bg-[#d8f3dc] transition"
          >
            Ver más en @huele.good →
          </a>
        </div>
      </div>
    </section>
  );
}
