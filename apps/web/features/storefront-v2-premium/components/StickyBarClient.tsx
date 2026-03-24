"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCatalogSummary } from "../../../lib/api";

function formatPrice(value: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `S/ ${value.toFixed(2)}`;
  }
}

export function StickyBarClient() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [comboPriceLabel, setComboPriceLabel] = useState<string | null>(null);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadPrice() {
      try {
        const response = await fetchCatalogSummary();
        const currencyCode = response.data.currencyCode || "PEN";
        const combo = (response.data.products ?? []).find((product) => product.slug === "combo-duo-perfecto");
        if (active && combo) {
          setComboPriceLabel(formatPrice(combo.price, currencyCode));
        }
      } catch {
        if (active) {
          setComboPriceLabel(null);
        }
      }
    }

    void loadPrice();
    return () => {
      active = false;
    };
  }, []);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-[#1a3a2e] px-4 py-4 shadow-[0_-4px_30px_rgba(0,0,0,0.25)] transition-transform duration-400 md:px-8 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      role="banner"
    >
      <p className="text-sm font-medium text-white/90">
        <strong className="text-white">🔥 Oferta limitada:</strong> Combo Dúo Perfecto (Verde + Negro) a solo{" "}
        <strong className="text-white">{comboPriceLabel ?? "S/ 79.90"}</strong> — Envío rápido a todo el Perú
      </p>
      <div className="flex flex-shrink-0 items-center gap-2">
        <Link
          href="#tienda"
          onClick={() => setDismissed(true)}
          className="rounded-full bg-[#c9a84c] px-5 py-2.5 text-xs font-bold text-[#1a3a2e] transition hover:bg-[#f0d080]"
        >
          Ver oferta →
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition hover:text-white"
          aria-label="Cerrar barra de oferta"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
