"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Badge,
  Button,
  AdminDataTable,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  MetricCard,
  SectionHeader
} from "@huelegood/ui";
import { type AdminMetric, type AdminReportFiltersInput } from "@huelegood/shared";
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

type ReportChannelFilter = "all" | AdminReportPeriodData["sales"]["details"][number]["salesChannel"];
type ReportFilterDraft = {
  salesChannel: ReportChannelFilter;
  vendorCode: string;
  productSlug: string;
  sku: string;
};

const EMPTY_REPORT_FILTER_DRAFT: ReportFilterDraft = {
  salesChannel: "all",
  vendorCode: "",
  productSlug: "",
  sku: ""
};

function channelLabel(value: ReportChannelFilter) {
  if (value === "web") {
    return "Web";
  }

  if (value === "manual") {
    return "Manual";
  }

  return "Todos";
}

function formatChannelActivity(
  webCount: number,
  manualCount: number,
  activeChannel: ReportChannelFilter
) {
  if (activeChannel === "all") {
    return `${webCount} web / ${manualCount} manual`;
  }

  const visibleCount = activeChannel === "web" ? webCount : manualCount;
  return `${visibleCount} ${channelLabel(activeChannel).toLowerCase()}`;
}

function normalizeReportFilterDraft(draft: ReportFilterDraft): ReportFilterDraft {
  return {
    salesChannel: draft.salesChannel,
    vendorCode: draft.vendorCode.trim().toUpperCase(),
    productSlug: draft.productSlug.trim().toLowerCase(),
    sku: draft.sku.trim().toUpperCase()
  };
}

function buildAppliedReportFilters(draft: ReportFilterDraft): AdminReportFiltersInput {
  const normalizedDraft = normalizeReportFilterDraft(draft);
  return {
    salesChannel: normalizedDraft.salesChannel === "all" ? undefined : normalizedDraft.salesChannel,
    vendorCode: normalizedDraft.vendorCode || undefined,
    productSlug: normalizedDraft.productSlug || undefined,
    sku: normalizedDraft.sku || undefined
  };
}

function hasAppliedReportFilters(filters: AdminReportFiltersInput) {
  return Boolean(filters.salesChannel || filters.vendorCode || filters.productSlug || filters.sku);
}

function areAppliedReportFiltersEqual(left: AdminReportFiltersInput, right: AdminReportFiltersInput) {
  return (
    left.salesChannel === right.salesChannel &&
    left.vendorCode === right.vendorCode &&
    left.productSlug === right.productSlug &&
    left.sku === right.sku
  );
}

const PRESETS = [
  { label: "Hoy", from: () => today(), to: () => today() },
  { label: "7 días", from: () => daysAgo(6), to: () => today() },
  { label: "30 días", from: () => daysAgo(29), to: () => today() },
  { label: "Este mes", from: () => startOfMonth(), to: () => today() }
] as const;

function ReportsSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge tone="info">{eyebrow}</Badge>
          <h2 className="mt-2 text-xl font-semibold text-[#132016]">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-black/55">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

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
  const [filterDraft, setFilterDraft] = useState<ReportFilterDraft>(EMPTY_REPORT_FILTER_DRAFT);
  const [appliedFilters, setAppliedFilters] = useState<AdminReportFiltersInput>({});
  const [report, setReport] = useState<AdminReportPeriodData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(
    async (f: string, t: string, filters: AdminReportFiltersInput = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminReport(f, t, filters);
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
    void loadReport(from, to, {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    const f = preset.from();
    const t = preset.to();
    setFrom(f);
    setTo(t);
    setActivePreset(preset.label);
    void loadReport(f, t, appliedFilters);
  }

  function handleManualLoad() {
    setActivePreset("");
    void loadReport(from, to, appliedFilters);
  }

  function handleApplyFilters() {
    const normalizedDraft = normalizeReportFilterDraft(filterDraft);
    const nextFilters = buildAppliedReportFilters(normalizedDraft);
    setFilterDraft(normalizedDraft);
    setAppliedFilters(nextFilters);
    void loadReport(from, to, nextFilters);
  }

  function handleClearFilters() {
    setFilterDraft(EMPTY_REPORT_FILTER_DRAFT);
    setAppliedFilters({});
    void loadReport(from, to, {});
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadAdminReportCsv(from, to, appliedFilters);
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

  const draftFilters = buildAppliedReportFilters(filterDraft);
  const filtersDirty = !areAppliedReportFiltersEqual(draftFilters, appliedFilters);
  const appliedChannelFilter: ReportChannelFilter = appliedFilters.salesChannel ?? "all";
  const hasAppliedFiltersActive = hasAppliedReportFilters(appliedFilters);

  const recentRows = (report?.orders.recent ?? []).map((o) => [
    o.orderNumber,
    o.customerName,
    o.salesChannel === "manual" ? "Manual" : "Web",
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
    formatChannelActivity(row.webSalesCount, row.manualSalesCount, appliedChannelFilter),
    formatCurrency(row.totalRevenue),
    formatCurrency(row.avgOrderValue),
    formatDateTime(row.lastSaleAt)
  ]);

  const productRows = (report?.products.rows ?? []).map((row) => [
    `${row.productName} · ${row.sku}`,
    String(row.unitsSold),
    formatCurrency(row.totalRevenue),
    formatChannelActivity(row.webUnitsSold, row.manualUnitsSold, appliedChannelFilter),
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
      <SectionHeader
        title="Reportes"
        description="Define el alcance una vez, revisa el resumen y baja luego al detalle operativo."
      />

      <ReportsSection
        eyebrow="Control"
        title="Periodo y filtros"
        description="Todo el reporte, las tablas y el CSV usan este mismo alcance."
      >
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Periodo</CardTitle>
              <CardDescription>Usa un preset o define fechas exactas antes de exportar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
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
              </div>

              <div className="flex flex-wrap items-center gap-2">
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

              {report ? (
                <div className="flex flex-wrap items-center gap-2">
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
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Acota por canal, vendedor, producto o SKU antes de revisar resultados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["all", "web", "manual"] as const).map((value) => {
                  return (
                    <Button
                      key={value}
                      variant={filterDraft.salesChannel === value ? "primary" : "secondary"}
                      onClick={() => setFilterDraft((current) => ({ ...current, salesChannel: value }))}
                      disabled={loading}
                    >
                      {channelLabel(value)}
                    </Button>
                  );
                })}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                    Código de vendedor
                  </span>
                  <Input
                    value={filterDraft.vendorCode}
                    onChange={(event) => setFilterDraft((current) => ({ ...current, vendorCode: event.target.value }))}
                    placeholder="Ej. VENDEDOR-LIMA"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                    Producto
                  </span>
                  <Input
                    value={filterDraft.productSlug}
                    onChange={(event) => setFilterDraft((current) => ({ ...current, productSlug: event.target.value }))}
                    placeholder="Ej. premium-negro"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                    SKU
                  </span>
                  <Input
                    value={filterDraft.sku}
                    onChange={(event) => setFilterDraft((current) => ({ ...current, sku: event.target.value }))}
                    placeholder="Ej. HG-PREMIUM"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={handleApplyFilters} disabled={loading || !filtersDirty}>
                  {loading ? "Aplicando…" : "Aplicar filtros"}
                </Button>
                {hasAppliedFiltersActive ? (
                  <Button variant="ghost" onClick={handleClearFilters} disabled={loading}>
                    Limpiar filtros
                  </Button>
                ) : null}
                {filtersDirty ? <Badge tone="warning">Hay cambios sin aplicar</Badge> : null}
              </div>

              {report ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={appliedChannelFilter === "all" ? "neutral" : "info"}>
                    Canal: {channelLabel(appliedChannelFilter)}
                  </Badge>
                  {appliedFilters.vendorCode ? <Badge tone="neutral">Código: {appliedFilters.vendorCode}</Badge> : null}
                  {appliedFilters.productSlug ? <Badge tone="neutral">Producto: {appliedFilters.productSlug}</Badge> : null}
                  {appliedFilters.sku ? <Badge tone="neutral">SKU: {appliedFilters.sku}</Badge> : null}
                  <Badge tone="neutral">{report.orders.total} pedidos</Badge>
                  <Badge tone="neutral">{report.products.rows.length} productos</Badge>
                  <Badge tone="neutral">{report.sales.details.length} líneas</Badge>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </ReportsSection>

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

      {!loading && report && (
        <>
          <ReportsSection
            eyebrow="Resumen"
            title="Vista ejecutiva"
            description="Primero muestra salud comercial del periodo: volumen, ingresos, pagos, estados y comisiones."
          >
            <>
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                {metrics.map((metric) => (
                  <MetricCard key={metric.label} metric={metric} />
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por día</CardTitle>
                    <CardDescription>Evolución de ingresos y pedidos en el periodo seleccionado.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DailyChart byDay={report.orders.byDay} />
                  </CardContent>
                </Card>

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
                      total={report.sales.totalConfirmed}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
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
          </ReportsSection>

          <ReportsSection
            eyebrow="Detalle"
            title="Listas operativas"
            description="Después baja a pedidos, productos, vendedores y líneas confirmadas."
          >
            <>
              <AdminDataTable
                title="Pedidos del periodo"
                description={
                  recentRows.length > 0
                    ? `Mostrando ${recentRows.length} pedido${recentRows.length !== 1 ? "s" : ""} recientes de ${report.orders.total} dentro del scope ${report.period.from} → ${report.period.to}.`
                    : "No hay pedidos dentro del scope activo."
                }
                headers={["Pedido", "Cliente", "Canal", "Total", "Método", "Estado", "Pago", "Fecha"]}
                rows={recentRows}
              />

              <div className="grid gap-6 lg:grid-cols-2">
                <AdminDataTable
                  title="Ventas por producto"
                  description={
                    productRows.length > 0
                      ? "Unidades e ingresos agrupados por producto y SKU dentro del scope cargado."
                      : "No hay productos en el scope activo."
                  }
                  headers={["Producto", "Unidades", "Ingresos periodo", "Actividad", "Última venta"]}
                  rows={productRows}
                />

                <AdminDataTable
                  title="Ventas por vendedor"
                  description={
                    vendorRows.length > 0
                      ? `${vendorRows.length} vendedor${vendorRows.length !== 1 ? "es" : ""} agregado${vendorRows.length !== 1 ? "s" : ""} en el scope cargado.`
                      : "No hay vendedores en el scope activo."
                  }
                  headers={["Vendedor", "Código", "Ventas", "Actividad", "Monto periodo", "Ticket prom.", "Última venta"]}
                  rows={vendorRows}
                />
              </div>

              <AdminDataTable
                title="Detalle de ventas"
                description={
                  detailRows.length > 0
                    ? `Detalle visible de ${detailRows.length} línea${detailRows.length !== 1 ? "s" : ""} confirmada${detailRows.length !== 1 ? "s" : ""} dentro del scope cargado.`
                    : "No hay líneas de detalle en el scope activo."
                }
                headers={["Fecha venta", "Pedido", "Canal", "Vendedor", "Producto", "Cant.", "Total línea"]}
                rows={detailRows}
              />
            </>
          </ReportsSection>
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
