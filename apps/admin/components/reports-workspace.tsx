"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  AdminDataTable,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  MetricCard,
  SectionHeader
} from "@huelegood/ui";
import { type AdminMetric } from "@huelegood/shared";
import { fetchAdminReport, downloadAdminReportCsv, type AdminReportPeriodData } from "../lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function startOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const PRESETS = [
  { label: "Hoy", from: () => today(), to: () => today() },
  { label: "7 días", from: () => daysAgo(6), to: () => today() },
  { label: "30 días", from: () => daysAgo(29), to: () => today() },
  { label: "Este mes", from: () => startOfMonth(), to: () => today() }
] as const;

// ── Inline chart ──────────────────────────────────────────────────────────────

function DailyChart({ byDay }: { byDay: AdminReportPeriodData["orders"]["byDay"] }) {
  if (byDay.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-black/40">
        Sin datos para el periodo
      </div>
    );
  }

  const maxRevenue = Math.max(...byDay.map((d) => d.revenue), 1);
  const showLabel = (i: number) =>
    byDay.length <= 10 || i === 0 || i === byDay.length - 1 || i % Math.ceil(byDay.length / 7) === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-[3px]" style={{ height: "96px" }}>
        {byDay.map((d, i) => (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
            {/* Paid portion overlay */}
            <div className="absolute bottom-0 w-full">
              <div
                className="w-full rounded-t-[2px] bg-[#2d6a4f]/40"
                style={{ height: `${(d.paid / Math.max(d.count, 1)) * ((d.revenue / maxRevenue) * 96)}px` }}
              />
              <div
                className="w-full rounded-t-[2px] bg-[#52b788] transition-all"
                style={{ height: `${(d.revenue / maxRevenue) * 96}px`, minHeight: d.count > 0 ? "3px" : "0" }}
              />
            </div>
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1a3a2e] px-2.5 py-1.5 text-[10px] text-white shadow-lg group-hover:block">
              {d.date.slice(5)} · {d.count} ped · {formatCurrency(d.revenue)}
            </div>
            {showLabel(i) && (
              <span className="absolute -bottom-5 text-[9px] text-black/35 select-none">{d.date.slice(5)}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 pt-6">
        <span className="flex items-center gap-1 text-[11px] text-black/50">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#52b788]" /> Ingresos
        </span>
        <span className="flex items-center gap-1 text-[11px] text-black/50">
          <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#2d6a4f]/40" /> Pagados
        </span>
      </div>
    </div>
  );
}

function MethodBreakdown({ byMethod, total }: { byMethod: Record<string, number>; total: number }) {
  const methodLabels: Record<string, string> = {
    manual: "Pago manual",
    openpay: "Openpay",
    culqi: "Culqi",
    backoffice: "Backoffice",
    unknown: "Desconocido"
  };

  const entries = Object.entries(byMethod).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) {
    return <p className="text-sm text-black/40">Sin datos</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([method, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={method} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-black/65">{methodLabels[method] ?? method}</span>
              <span className="font-semibold text-[#1a3a2e]">
                {count} <span className="font-normal text-black/40">({pct}%)</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/6">
              <div
                className="h-full rounded-full bg-[#52b788] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReportsWorkspace() {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(today());
  const [activePreset, setActivePreset] = useState<string>("30 días");
  const [report, setReport] = useState<AdminReportPeriodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(
    async (f: string, t: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminReport(f, t);
        setReport(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar el reporte.");
        setReport(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadReport(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const f = preset.from();
    const t = preset.to();
    setFrom(f);
    setTo(t);
    setActivePreset(preset.label);
    void loadReport(f, t);
  }

  function handleManualLoad() {
    setActivePreset("");
    void loadReport(from, to);
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadAdminReportCsv(from, to);
    } finally {
      setExporting(false);
    }
  }

  // Build MetricCard data from report
  const metrics: AdminMetric[] = report
    ? [
        {
          label: "Pedidos",
          value: String(report.orders.total),
          detail: `${report.orders.paid} pagados · ${report.orders.pending} pendientes`
        },
        {
          label: "Ingresos totales",
          value: formatCurrency(report.orders.revenue),
          detail: "Suma de todos los pedidos del periodo"
        },
        {
          label: "Ingresos cobrados",
          value: formatCurrency(report.orders.paidRevenue),
          detail: "Solo pedidos con pago confirmado"
        },
        {
          label: "Conversión",
          value: `${report.orders.conversionRate}%`,
          detail: "Pedidos pagados / pedidos totales"
        },
        {
          label: "Ticket promedio",
          value: formatCurrency(report.orders.avgOrderValue),
          detail: "Promedio por pedido en el periodo"
        }
      ]
    : [];

  const recentRows = (report?.orders.recent ?? []).map((o) => [
    o.orderNumber,
    o.customerName,
    formatCurrency(o.total),
    o.paymentMethod ?? "—",
    o.orderStatus,
    o.paymentStatus,
    o.createdAt.slice(0, 10)
  ]);

  const vendorRows = (report?.vendors.rows ?? []).map((row) => [
    row.vendorName,
    row.vendorCode ?? "—",
    String(row.salesCount),
    formatCurrency(row.totalRevenue),
    formatCurrency(row.avgOrderValue),
    formatDateTime(row.lastSaleAt)
  ]);

  const productRows = (report?.products.rows ?? []).map((row) => [
    `${row.productName} · ${row.sku}`,
    String(row.unitsSold),
    formatCurrency(row.totalRevenue),
    `${row.webUnitsSold} web / ${row.manualUnitsSold} manual`,
    formatDateTime(row.lastSoldAt)
  ]);

  const detailRows = (report?.sales.details ?? []).map((row) => [
    formatDateTime(row.confirmedAt),
    row.orderNumber,
    row.salesChannel === "manual" ? "Manual" : "Web",
    row.vendorName ? `${row.vendorName}${row.vendorCode ? ` (${row.vendorCode})` : ""}` : row.vendorCode ?? "—",
    `${row.productName} · ${row.sku}`,
    String(row.quantity),
    formatCurrency(row.lineTotal)
  ]);

  return (
    <div className="space-y-6 py-6 md:py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          title="Reportes"
          description="Analiza pedidos, ingresos y conversión por periodo."
        />
      </div>

      {/* Date range controls */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Presets */}
            {PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant={activePreset === preset.label ? "primary" : "secondary"}
                onClick={() => applyPreset(preset)}
                disabled={loading}
              >
                {preset.label}
              </Button>
            ))}

            {/* Separator */}
            <span className="text-black/20">|</span>

            {/* Manual inputs */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => { setFrom(e.target.value); setActivePreset(""); }}
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-[#1a3a2e] focus:border-[#52b788] focus:outline-none"
              />
              <span className="text-sm text-black/35">→</span>
              <input
                type="date"
                value={to}
                min={from}
                max={today()}
                onChange={(e) => { setTo(e.target.value); setActivePreset(""); }}
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-[#1a3a2e] focus:border-[#52b788] focus:outline-none"
              />
              <Button onClick={handleManualLoad} disabled={loading}>
                {loading ? "Cargando…" : "Cargar"}
              </Button>
            </div>

            {report && (
              <>
                <Badge tone="success">
                  {report.period.from} → {report.period.to}
                </Badge>
                <Button
                  variant="secondary"
                  onClick={() => { void handleExport(); }}
                  disabled={exporting || loading}
                >
                  {exporting ? "Exportando…" : "Exportar CSV"}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      )}

      {/* Metrics */}
      {!loading && report && (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Daily chart */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por día</CardTitle>
                <CardDescription>Evolución de ingresos y pedidos en el periodo seleccionado.</CardDescription>
              </CardHeader>
              <CardContent>
                <DailyChart byDay={report.orders.byDay} />
              </CardContent>
            </Card>

            {/* Methods breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Métodos de pago</CardTitle>
                <CardDescription>
                  Distribución de {report.sales.totalConfirmed} ventas confirmadas por método.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MethodBreakdown
                  byMethod={report.orders.byPaymentMethod}
                  total={report.orders.total}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent orders */}
          <AdminDataTable
            title="Pedidos del periodo"
            description={`${report.orders.total} pedido${report.orders.total !== 1 ? "s" : ""} entre ${report.period.from} y ${report.period.to}`}
            headers={["Pedido", "Cliente", "Total", "Método", "Estado", "Pago", "Fecha"]}
            rows={recentRows}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminDataTable
              title="Ventas por vendedor"
              description={`${report.sales.totalConfirmed} venta${report.sales.totalConfirmed !== 1 ? "s" : ""} confirmada${report.sales.totalConfirmed !== 1 ? "s" : ""} para el periodo.`}
              headers={["Vendedor", "Código", "Ventas", "Monto", "Ticket prom.", "Última venta"]}
              rows={vendorRows}
            />

            <AdminDataTable
              title="Ventas por producto"
              description="Unidades e ingresos agrupados por producto y SKU."
              headers={["Producto", "Unidades", "Ingresos", "Canales", "Última venta"]}
              rows={productRows}
            />
          </div>

          <AdminDataTable
            title="Detalle de ventas"
            description="Fecha de venta confirmada por producto, canal y vendedor."
            headers={["Fecha venta", "Pedido", "Canal", "Vendedor", "Producto", "Cant.", "Total línea"]}
            rows={detailRows}
          />

          {/* Status breakdown + Commissions summary */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Status breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de pedidos</CardTitle>
                <CardDescription>Distribución por estado en el periodo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(report.orders.byStatus).length === 0 ? (
                    <p className="text-sm text-black/40">Sin pedidos en el periodo</p>
                  ) : (
                    Object.entries(report.orders.byStatus)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between rounded-lg bg-black/[0.025] px-4 py-2.5 text-sm">
                          <span className="text-black/65">{status}</span>
                          <span className="font-semibold text-[#1a3a2e]">{count}</span>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Commissions summary */}
            <Card>
              <CardHeader>
                <CardTitle>Comisiones</CardTitle>
                <CardDescription>Estado acumulado de comisiones de vendedores.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Total comisiones", value: formatCurrency(report.commissions.totalAmount), detail: `${report.commissions.total} registros` },
                    { label: "Por liquidar", value: formatCurrency(report.commissions.payableAmount), detail: `${report.commissions.payable} payable${report.commissions.payable !== 1 ? "s" : ""}` },
                    { label: "Ya pagado", value: formatCurrency(report.commissions.paidAmount), detail: `${report.commissions.paid} liquidado${report.commissions.paid !== 1 ? "s" : ""}` }
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-black/[0.025] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[#1a3a2e]">{item.label}</p>
                        <p className="text-xs text-black/45">{item.detail}</p>
                      </div>
                      <p className="font-serif text-lg font-bold text-[#1a3a2e]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !error && !report && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-black/40">Selecciona un periodo para ver el reporte.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
