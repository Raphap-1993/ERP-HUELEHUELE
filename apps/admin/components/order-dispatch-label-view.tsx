"use client";

import { useEffect, useState } from "react";
import { siteSetting, type AdminDispatchLabelSummary } from "@huelegood/shared";
import { fetchDispatchLabel, recordDispatchLabelPrint } from "../lib/api";

function deliveryModeLabel(label: AdminDispatchLabelSummary) {
  if (label.destination.deliveryMode === "province_shalom_pickup") {
    return `Shalom${label.destination.agencyName ? ` · ${label.destination.agencyName}` : ""}`;
  }

  if (label.destination.carrier === "shalom") {
    return "Shalom";
  }

  if (label.destination.carrier === "olva_courier") {
    return "Olva Courier";
  }

  return "Entrega estándar";
}

function resolveBackLink(source: "pedidos" | "despachos") {
  return source === "despachos"
    ? { href: "/despachos", label: "Volver a despachos" }
    : { href: "/pedidos", label: "Volver a pedidos" };
}

function sanitizeFileNamePart(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
}

function formatPrintTimestamp(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");

  return `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}`;
}

function buildDispatchLabelFileName(label: AdminDispatchLabelSummary, options?: { unique?: boolean }) {
  const parts = [sanitizeFileNamePart(label.orderNumber) ?? "ETIQUETA"].filter(Boolean);

  if (options?.unique) {
    parts.push(formatPrintTimestamp());
  }

  return parts.join("_");
}

export function OrderDispatchLabelView({
  orderNumber,
  source = "pedidos"
}: {
  orderNumber: string;
  source?: "pedidos" | "despachos";
}) {
  const [label, setLabel] = useState<AdminDispatchLabelSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const backLink = resolveBackLink(source);

  useEffect(() => {
    let active = true;

    async function loadLabel() {
      setLoading(true);

      try {
        const response = await fetchDispatchLabel(orderNumber);
        if (!active) {
          return;
        }

        setLabel(response.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setLabel(null);
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el sticker operativo.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadLabel();
    return () => {
      active = false;
    };
  }, [orderNumber]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const previousTitle = document.title;
    document.title = label ? buildDispatchLabelFileName(label) : `HUELEGOOD_ETIQUETA_${sanitizeFileNamePart(orderNumber) ?? orderNumber}`;

    return () => {
      document.title = previousTitle;
    };
  }, [label, orderNumber]);

  async function handlePrint() {
    setPrinting(true);
    setNotice(null);

    const previousTitle = typeof document !== "undefined" ? document.title : undefined;

    try {
      if (typeof document !== "undefined" && label) {
        document.title = buildDispatchLabelFileName(label);
      }
      window.print();
      await recordDispatchLabelPrint(orderNumber, {
        templateVersion: label?.templateVersion ?? "dispatch-label-v1",
        format: "html",
        channel: "single"
      });
    } catch (printError) {
      setNotice(
        printError instanceof Error
          ? `El sticker se abrió para impresión, pero no pudimos registrar la trazabilidad: ${printError.message}`
          : "El sticker se abrió para impresión, pero no pudimos registrar la trazabilidad."
      );
    } finally {
      if (typeof document !== "undefined" && previousTitle) {
        document.title = previousTitle;
      }
      setPrinting(false);
    }
  }

  return (
    <div className="dispatch-print-page min-h-screen bg-[#eef1eb] px-4 py-5 md:px-6 md:py-8">
      <style jsx global>{`
        @page {
          size: A6 portrait;
          margin: 8mm;
        }

        @media print {
          body {
            background: #ffffff !important;
          }

          .dispatch-print-toolbar {
            display: none !important;
          }

          .dispatch-print-page {
            background: #ffffff !important;
            padding: 0 !important;
          }

          .dispatch-print-card {
            box-shadow: none !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      <div className="dispatch-print-toolbar mx-auto mb-4 flex max-w-[460px] flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#132016]">Sticker operativo</h1>
          <p className="text-sm text-black/55">Vista print-ready de caja. No reemplaza la guía de remisión.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={backLink.href}
            className="rounded-[10px] border border-black/10 px-4 py-2 text-sm font-medium text-[#132016] transition hover:bg-black/[0.03]"
          >
            {backLink.label}
          </a>
          <button
            type="button"
            onClick={() => void handlePrint()}
            disabled={!label || printing}
            className="rounded-[10px] bg-[#1a3a2e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d6a4f] disabled:opacity-50"
          >
            {printing ? "Abriendo..." : "Imprimir sticker"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mx-auto max-w-[460px] rounded-[1.5rem] border border-black/8 bg-white px-6 py-10 text-sm text-black/55 shadow-[0_18px_54px_rgba(18,34,20,0.08)]">
          Cargando sticker operativo...
        </div>
      ) : error ? (
        <div className="mx-auto max-w-[460px] rounded-[1.5rem] border border-red-200 bg-white px-6 py-10 text-sm text-red-600 shadow-[0_18px_54px_rgba(18,34,20,0.08)]">
          {error}
        </div>
      ) : label ? (
        <div className="mx-auto max-w-[460px]">
          <div className="dispatch-print-toolbar mb-3 rounded-[1rem] border border-[#d9e7dd] bg-[#f7fbf8] px-4 py-3 text-sm text-[#1a3a2e]">
            El sticker debe coincidir con el paquete y con la guía de remisión cuando el traslado lo requiera.
          </div>
          {notice ? (
            <div className="dispatch-print-toolbar mb-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {notice}
            </div>
          ) : null}

          <article className="dispatch-print-card w-full rounded-[1.75rem] border border-black/10 bg-white p-5 text-[#132016] shadow-[0_22px_60px_rgba(18,34,20,0.12)]">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-black/42">Huelegood</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">{siteSetting.brandName}</h2>
                <p className="mt-1 text-sm text-black/55">Sticker operativo de caja</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/42">Pedido</p>
                <p className="mt-1 text-2xl font-bold">{label.orderNumber}</p>
              </div>
            </div>

            <div className="grid gap-3 pt-4">
              <section className="rounded-[1.25rem] border border-black/10 bg-[#f7f8f4] px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/42">Destinatario</p>
                <p className="mt-2 text-xl font-semibold">{label.recipient.name}</p>
                <p className="mt-1 text-sm text-black/62">{label.recipient.phone}</p>
              </section>

              <section className="rounded-[1.25rem] border border-black/10 bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/42">Destino</p>
                <p className="mt-2 text-base font-medium">{label.destination.line1}</p>
                {label.destination.line2 ? <p className="text-sm text-black/62">{label.destination.line2}</p> : null}
                <p className="mt-1 text-sm text-black/62">
                  {label.destination.city}, {label.destination.region}
                </p>
                <p className="text-sm text-black/62">{label.destination.countryCode}</p>
                <div className="mt-3 rounded-[0.95rem] bg-[#f2f8f4] px-3 py-2 text-sm text-[#1a3a2e]">
                  {deliveryModeLabel(label)}
                </div>
                {label.destination.deliveryMode === "province_shalom_pickup" && label.destination.payOnPickup ? (
                  <p className="mt-2 text-sm text-black/62">Flete: pago al recoger</p>
                ) : null}
              </section>

              <section className="rounded-[1.25rem] border border-black/10 bg-white px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/42">Contenido</p>
                <div className="mt-2 space-y-2">
                  {label.order.items.map((item) => (
                    <div key={`${item.sku}-${item.name}`} className="flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-xs text-black/48">{item.sku}</p>
                      </div>
                      <span className="rounded-full bg-[#eef7f1] px-2.5 py-1 text-xs font-semibold text-[#2d6a4f]">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <InfoTile label="Referencia" value={label.order.reference} />
                <InfoTile label="Canal" value={label.order.salesChannel === "manual" ? "Manual" : "Web"} />
                <InfoTile label="Vendedor" value={label.order.vendorName ? `${label.order.vendorName}${label.order.vendorCode ? ` (${label.order.vendorCode})` : ""}` : label.order.vendorCode ?? "—"} />
                <InfoTile label="Unidades" value={String(label.order.totalUnits)} />
              </section>

              <section className="rounded-[1.25rem] border border-dashed border-black/18 bg-[#fcfcfa] px-4 py-4 text-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-black/42">Código operativo</p>
                <p className="mt-2 font-mono text-2xl font-bold tracking-[0.3em] text-[#132016]">{label.barcode.value}</p>
              </section>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-black/10 bg-white px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-black/42">{label}</p>
      <p className="mt-2 text-sm font-medium text-[#132016]">{value}</p>
    </div>
  );
}
