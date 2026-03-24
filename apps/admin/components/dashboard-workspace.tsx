"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  AdminDataTable,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CommissionTable,
  MetricCard,
  ReviewDrawer,
  SectionHeader,
  TimelinePedido
} from "@huelegood/ui";
import {
  CampaignStatus,
  CommissionPayoutStatus,
  CommissionStatus,
  NotificationStatus,
  PaymentStatus,
  WholesaleLeadStatus,
  type AdminManualPaymentRequestSummary,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type AdminRoleDashboardSummary,
  type CommissionRow,
  type ReviewItem,
  type TimelineEntry
} from "@huelegood/shared";
import { fetchDashboardOverview, fetchOrder } from "../lib/api";
import { useAdminSession } from "./admin-session-provider";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function orderTone(status: AdminOrderSummary["orderStatus"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "paid" || status === "confirmed" || status === "completed") {
    return "success";
  }

  if (status === "cancelled" || status === "refunded" || status === "expired") {
    return "danger";
  }

  if (status === "payment_under_review" || status === "pending_payment") {
    return "warning";
  }

  return "info";
}

function paymentTone(status: PaymentStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === PaymentStatus.Paid) {
    return "success";
  }

  if (status === PaymentStatus.Failed || status === PaymentStatus.Expired) {
    return "danger";
  }

  return "warning";
}

function manualTone(status?: AdminManualPaymentRequestSummary["status"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "approved") {
    return "success";
  }

  if (status === "rejected") {
    return "danger";
  }

  if (status === "under_review") {
    return "warning";
  }

  return "info";
}

function commissionTone(status: CommissionStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === CommissionStatus.Paid) {
    return "success";
  }

  if (status === CommissionStatus.Payable || status === CommissionStatus.ScheduledForPayout) {
    return "warning";
  }

  if (status === CommissionStatus.Blocked || status === CommissionStatus.Reversed || status === CommissionStatus.Cancelled) {
    return "danger";
  }

  return "info";
}

function payoutTone(status: CommissionPayoutStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === CommissionPayoutStatus.Paid) {
    return "success";
  }

  if (status === CommissionPayoutStatus.Cancelled) {
    return "danger";
  }

  return "warning";
}

function campaignTone(status: CampaignStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === CampaignStatus.Completed) {
    return "success";
  }

  if (status === CampaignStatus.Cancelled) {
    return "danger";
  }

  if (status === CampaignStatus.Scheduled) {
    return "warning";
  }

  return "info";
}

function leadTone(status: WholesaleLeadStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === WholesaleLeadStatus.Won) {
    return "success";
  }

  if (status === WholesaleLeadStatus.Lost) {
    return "danger";
  }

  if (status === WholesaleLeadStatus.New || status === WholesaleLeadStatus.Qualified || status === WholesaleLeadStatus.Quoted) {
    return "warning";
  }

  return "info";
}

function notificationTone(status: NotificationStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === NotificationStatus.Delivered || status === NotificationStatus.Sent) {
    return "success";
  }

  if (status === NotificationStatus.Failed) {
    return "danger";
  }

  return "warning";
}

function toReviewItem(request: AdminManualPaymentRequestSummary): ReviewItem {
  return {
    id: request.id,
    orderNumber: request.orderNumber,
    customer: request.customerName,
    amount: request.amount,
    provider: "Pago manual",
    evidence: request.evidenceNotes ?? request.evidenceReference ?? "Sin evidencia",
    status: request.status,
    submittedAt: request.submittedAt
  };
}

function toTimeline(items: AdminOrderDetail["statusHistory"]): TimelineEntry[] {
  return items.map((item) => ({
    status: item.status,
    label: item.label,
    actor: item.actor,
    occurredAt: item.occurredAt,
    note: item.note
  }));
}

function focusLabel(focus: AdminRoleDashboardSummary["focus"]) {
  const labels: Record<AdminRoleDashboardSummary["focus"], string> = {
    executive: "Ejecutivo",
    payments: "Pagos",
    sales: "Ventas",
    marketing: "Marketing"
  };

  return labels[focus];
}

function dashboardHighlights(overview: AdminRoleDashboardSummary) {
  switch (overview.focus) {
    case "payments":
      return [
        `Pagos en revisión: ${overview.reviewQueue.length}`,
        `Cobros pendientes visibles: ${overview.paymentRows.length}`,
        `Pedidos relacionados: ${overview.recentOrders.length}`
      ];
    case "sales":
      return [
        `Vendedores activos visibles: ${overview.vendorRows.length}`,
        `Comisiones en seguimiento: ${overview.commissionRows.length}`,
        `Liquidaciones visibles: ${overview.payouts.length}`
      ];
    case "marketing":
      return [
        `Campañas visibles: ${overview.campaigns.length}`,
        `Leads abiertos: ${overview.wholesaleLeads.length}`,
        `Notificaciones recientes: ${overview.notifications.length}`
      ];
    default:
      return [
        `Pedidos recientes: ${overview.recentOrders.length}`,
        `Pagos por revisar: ${overview.reviewQueue.length}`,
        `Frentes comerciales activos: ${overview.campaigns.length + overview.wholesaleLeads.length}`
      ];
  }
}

function DashboardSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-black/40">{eyebrow}</p>
        <h2 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-[#1a3a2e]">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-black/56">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function DashboardWorkspace() {
  const { session } = useAdminSession();
  const [overview, setOverview] = useState<AdminRoleDashboardSummary | null>(null);
  const [latestOrder, setLatestOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!session) {
        if (active) {
          setOverview(null);
          setLatestOrder(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const overviewResponse = await fetchDashboardOverview();
        if (!active) {
          return;
        }

        setOverview(overviewResponse.data);
        setError(null);

        const firstOrderNumber = overviewResponse.data.recentOrders[0]?.orderNumber;
        if (!firstOrderNumber) {
          setLatestOrder(null);
          return;
        }

        try {
          const detailResponse = await fetchOrder(firstOrderNumber);
          if (active) {
            setLatestOrder(detailResponse.data);
          }
        } catch {
          if (active) {
            setLatestOrder(null);
          }
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el dashboard.");
          setOverview(null);
          setLatestOrder(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [refreshKey, session]);

  const recentOrdersRows = useMemo(
    () =>
      (overview?.recentOrders ?? []).map((order) => [
        order.orderNumber,
        order.customerName,
        formatCurrency(order.total),
        <Badge key={`${order.orderNumber}-order`} tone={orderTone(order.orderStatus)}>
          {order.orderStatus}
        </Badge>,
        <Badge key={`${order.orderNumber}-payment`} tone={paymentTone(order.paymentStatus)}>
          {order.paymentStatus}
        </Badge>,
        order.vendorCode ?? "Sin código",
        order.updatedAt
      ]),
    [overview]
  );

  const paymentRows = useMemo(
    () =>
      (overview?.paymentRows ?? []).map((payment) => [
        payment.orderNumber,
        payment.customerName,
        payment.provider,
        formatCurrency(payment.amount),
        <Badge key={`${payment.id}-status`} tone={paymentTone(payment.status)}>
          {payment.status}
        </Badge>,
        <Badge key={`${payment.id}-manual`} tone={manualTone(payment.manualStatus)}>
          {payment.manualStatus ?? "n/a"}
        </Badge>,
        payment.updatedAt
      ]),
    [overview]
  );

  const vendorRows = useMemo(
    () =>
      (overview?.vendorRows ?? []).map((vendor) => [
        vendor.name,
        vendor.code,
        <Badge key={`${vendor.code}-vendor-status`} tone={vendor.status === "active" ? "success" : vendor.status === "suspended" ? "danger" : "warning"}>
          {vendor.status}
        </Badge>,
        formatCurrency(vendor.sales),
        formatCurrency(vendor.pendingCommissions),
        String(vendor.ordersCount),
        vendor.updatedAt
      ]),
    [overview]
  );

  const payoutRows = useMemo(
    () =>
      (overview?.payouts ?? []).map((payout) => [
        payout.id,
        payout.vendorName,
        payout.period,
        formatCurrency(payout.netAmount),
        <Badge key={`${payout.id}-payout-status`} tone={payoutTone(payout.status)}>
          {payout.status}
        </Badge>,
        payout.updatedAt
      ]),
    [overview]
  );

  const campaignRows = useMemo(
    () =>
      (overview?.campaigns ?? []).map((campaign) => [
        campaign.name,
        campaign.segmentName,
        campaign.channel,
        <Badge key={`${campaign.id}-campaign-status`} tone={campaignTone(campaign.status)}>
          {campaign.status}
        </Badge>,
        String(campaign.recipients),
        campaign.updatedAt
      ]),
    [overview]
  );

  const leadRows = useMemo(
    () =>
      (overview?.wholesaleLeads ?? []).map((lead) => [
        lead.company,
        lead.contact,
        lead.city,
        <Badge key={`${lead.id}-lead-status`} tone={leadTone(lead.status)}>
          {lead.status}
        </Badge>,
        String(lead.quoteCount),
        lead.updatedAt
      ]),
    [overview]
  );

  const notificationRows = useMemo(
    () =>
      (overview?.notifications ?? []).map((notification) => [
        notification.subject,
        notification.audience,
        notification.channel,
        <Badge key={`${notification.id}-notification-status`} tone={notificationTone(notification.status)}>
          {notification.status}
        </Badge>,
        notification.source,
        notification.updatedAt
      ]),
    [overview]
  );

  const loyaltyRows = useMemo(
    () =>
      (overview?.loyaltyAccounts ?? []).map((account) => [
        account.customer,
        String(account.availablePoints),
        String(account.pendingPoints),
        String(account.redeemedPoints),
        account.recentMovement,
        account.redemptionStatus
      ]),
    [overview]
  );

  const reviewItems = useMemo(() => (overview?.reviewQueue ?? []).map(toReviewItem), [overview]);
  const timelineItems = useMemo(() => (latestOrder ? toTimeline(latestOrder.statusHistory) : []), [latestOrder]);
  const commissionRows = useMemo(() => overview?.commissionRows ?? [], [overview]);
  const highlights = useMemo(() => (overview ? dashboardHighlights(overview) : []), [overview]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="space-y-6 overflow-x-clip pb-8">
      <Card className="overflow-hidden rounded-[1.75rem] border-black/8 bg-white shadow-[0_4px_20px_rgba(26,58,46,0.08)]">
        <CardHeader className="gap-4 border-b border-black/6 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge tone="neutral">Dashboard</Badge>
              {overview ? <Badge tone="info">Vista {focusLabel(overview.focus)}</Badge> : null}
            </div>
            <div className="space-y-1.5">
              <h2 className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[#1a3a2e]">{overview?.title ?? "Panel operativo"}</h2>
              <p className="max-w-3xl text-sm leading-6 text-black/56">
                {overview?.description ?? "Cargando vista operacional por rol."}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refrescar
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {overview
            ? highlights.map((item) => (
                <div key={item} className="min-w-0 rounded-[13px] border border-[rgba(26,58,46,0.08)] bg-[#f4f6f5] px-4 py-3 text-sm leading-6 text-[#1a3a2e]">
                  {item}
                </div>
              ))
            : Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 rounded-[13px] border border-[rgba(26,58,46,0.08)] bg-[#f4f6f5]" />
              ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(overview?.metrics ?? []).map((metric) => (
          <div key={metric.label} className="min-w-0">
            <MetricCard metric={metric} />
          </div>
        ))}
      </div>

      {/* Charts visuales */}
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        {/* Gráfica de barras */}
        <div className="min-w-0 overflow-hidden rounded-[13px] border border-[rgba(26,58,46,0.1)] bg-white p-3.5">
          <h3 className="mb-1 text-[13px] font-semibold text-[#1c1c1c]">Ventas por semana</h3>
          <p className="mb-3 text-[11px] text-[#6b7280]">Unidades vendidas en los últimos 7 períodos</p>
          <svg viewBox="0 0 380 145" className="h-auto w-full max-w-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="30" y1="118" x2="370" y2="118" stroke="#f0f0ee" strokeWidth="1"/>
            <line x1="30" y1="90"  x2="370" y2="90"  stroke="#f0f0ee" strokeWidth="1"/>
            <line x1="30" y1="62"  x2="370" y2="62"  stroke="#f0f0ee" strokeWidth="1"/>
            <line x1="30" y1="34"  x2="370" y2="34"  stroke="#f0f0ee" strokeWidth="1"/>
            <text x="4" y="121" fontSize="9" fill="#c0c8c4">0</text>
            <text x="4" y="93"  fontSize="9" fill="#c0c8c4">30</text>
            <text x="4" y="65"  fontSize="9" fill="#c0c8c4">60</text>
            <text x="4" y="37"  fontSize="9" fill="#c0c8c4">90</text>
            <rect x="38"  y="62" width="26" height="56" rx="5" fill="#2d6a4f" fillOpacity=".65"/>
            <text x="51"  y="133" textAnchor="middle" fontSize="9" fill="#9ca3af">S1</text>
            <rect x="88"  y="46" width="26" height="72" rx="5" fill="#2d6a4f" fillOpacity=".7"/>
            <text x="101" y="133" textAnchor="middle" fontSize="9" fill="#9ca3af">S2</text>
            <rect x="138" y="70" width="26" height="48" rx="5" fill="#2d6a4f" fillOpacity=".65"/>
            <text x="151" y="133" textAnchor="middle" fontSize="9" fill="#9ca3af">S3</text>
            <rect x="188" y="28" width="26" height="90" rx="5" fill="#2d6a4f" fillOpacity=".78"/>
            <text x="201" y="133" textAnchor="middle" fontSize="9" fill="#9ca3af">S4</text>
            <rect x="238" y="50" width="26" height="68" rx="5" fill="#2d6a4f" fillOpacity=".72"/>
            <text x="251" y="133" textAnchor="middle" fontSize="9" fill="#9ca3af">S5</text>
            <rect x="288" y="20" width="26" height="98" rx="5" fill="#2d6a4f" fillOpacity=".85"/>
            <text x="301" y="133" textAnchor="middle" fontSize="9" fill="#9ca3af">S6</text>
            <rect x="338" y="37" width="26" height="81" rx="5" fill="#52b788"/>
            <text x="351" y="133" textAnchor="middle" fontSize="9" fill="#6b7280" fontWeight="500">S7</text>
            <text x="351" y="32"  textAnchor="middle" fontSize="10" fontWeight="600" fill="#2d6a4f">81</text>
          </svg>
        </div>

        {/* Donut chart */}
        <div className="min-w-0 overflow-hidden rounded-[13px] border border-[rgba(26,58,46,0.1)] bg-white p-3.5">
          <h3 className="mb-1 text-[13px] font-semibold text-[#1c1c1c]">Mix de productos</h3>
          <p className="mb-3 text-[11px] text-[#6b7280]">Distribución por SKU este mes</p>
          <div className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" width="92" height="92" className="flex-shrink-0">
              <circle cx="50" cy="50" r="36" fill="none" stroke="#f3f4f6" strokeWidth="17"/>
              <circle cx="50" cy="50" r="36" fill="none" stroke="#1a3a2e" strokeWidth="17" strokeDasharray="118 226" strokeDashoffset="0" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="36" fill="none" stroke="#52b788" strokeWidth="17" strokeDasharray="70 226" strokeDashoffset="-118" transform="rotate(-90 50 50)"/>
              <circle cx="50" cy="50" r="36" fill="none" stroke="#c9a84c" strokeWidth="17" strokeDasharray="38 226" strokeDashoffset="-188" transform="rotate(-90 50 50)"/>
              <text x="50" y="47" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1a3a2e">438</text>
              <text x="50" y="57" textAnchor="middle" fontSize="7" fill="#9ca3af">unidades</text>
            </svg>
            <div className="flex min-w-0 flex-col gap-2">
              {[
                { color: "#1a3a2e", label: "Negro 52%" },
                { color: "#52b788", label: "Verde 31%" },
                { color: "#c9a84c", label: "Packs 17%" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-[12px] text-[#6b7280]">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {overview?.focus === "payments" ? (
          <>
          <DashboardSection eyebrow="Prioridad" title="Resolución inmediata" description="Cobro, revisión manual y conciliación en un bloque compacto.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <ReviewDrawer title="Revisión manual" items={reviewItems} />
              </div>
              {latestOrder ? <CardSnapshot order={latestOrder} /> : <EmptyDashboardCard title="Sin pedido destacado" description="Todavía no hay un pedido reciente para mostrar en detalle." />}
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Seguimiento" title="Cola de cobro" description="Pagos y pedidos con impacto directo en conciliación.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Cola de pagos"
                  description="Cobros que requieren seguimiento."
                  headers={["Pedido", "Cliente", "Proveedor", "Monto", "Estado", "Manual", "Actualizado"]}
                  rows={paymentRows.slice(0, 4)}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Pedidos relacionados"
                  description="Pedidos recientes conectados a cobro."
                  headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
                  rows={recentOrdersRows.slice(0, 4)}
                />
              </div>
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Trazabilidad" title="Último timeline operativo" description="Secuencia reciente del pedido más representativo de esta vista.">
            <div className="min-w-0 overflow-hidden">
              <TimelinePedido items={timelineItems} />
            </div>
          </DashboardSection>
        </>
      ) : null}

      {overview?.focus === "sales" ? (
        <>
          <DashboardSection eyebrow="Pipeline comercial" title="Ventas, comisión y red de vendedores" description="Primero rendimiento vendedor, luego comisiones y finalmente liquidaciones.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <CommissionTable rows={commissionRows.slice(0, 4) as CommissionRow[]} />
              </div>
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Vendedores activos"
                  description="Rendimiento comercial visible."
                  headers={["Vendedor", "Código", "Estado", "Ventas", "Pendiente", "Pedidos", "Actualizado"]}
                  rows={vendorRows.slice(0, 4)}
                />
              </div>
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Pedidos" title="Pedidos atribuidos" description="Pedidos recientes que ya cargan trazabilidad comercial por código vendedor.">
            <div className="min-w-0 overflow-hidden">
              <AdminDataTable
                title="Pedidos atribuidos"
                description="Pedidos recientes con atribución comercial."
                headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
                rows={recentOrdersRows.slice(0, 4)}
              />
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Liquidación" title="Pagos a sellers" description="Estado actual de las liquidaciones visibles para el equipo comercial.">
            <div className="min-w-0 overflow-hidden">
              <AdminDataTable
                title="Liquidaciones"
                description="Resumen de pagos a vendedores."
                headers={["Liquidación", "Vendedor", "Periodo", "Monto", "Estado", "Actualizado"]}
                rows={payoutRows.slice(0, 4)}
              />
            </div>
          </DashboardSection>
        </>
      ) : null}

      {overview?.focus === "marketing" ? (
        <>
          <DashboardSection eyebrow="Adquisición" title="Campañas y leads" description="Visibilidad compacta de demanda activa y pipeline mayorista.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Campañas"
                  description="Campañas activas y programadas."
                  headers={["Campaña", "Segmento", "Canal", "Estado", "Recipients", "Actualizado"]}
                  rows={campaignRows.slice(0, 4)}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Leads mayoristas"
                  description="Leads en seguimiento."
                  headers={["Empresa", "Contacto", "Ciudad", "Estado", "Cotizaciones", "Actualizado"]}
                  rows={leadRows.slice(0, 4)}
                />
              </div>
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Retención" title="Mensajería y fidelización" description="Después, señales recientes de mensajes y cuentas con puntos.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Notificaciones"
                  description="Despachos recientes."
                  headers={["Asunto", "Audiencia", "Canal", "Estado", "Origen", "Actualizado"]}
                  rows={notificationRows.slice(0, 4)}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Fidelización"
                  description="Resumen de cuentas con puntos."
                  headers={["Cliente", "Disponibles", "Pendientes", "Canjeados", "Movimiento", "Canje"]}
                  rows={loyaltyRows.slice(0, 4)}
                />
              </div>
            </div>
          </DashboardSection>
        </>
      ) : null}

      {overview?.focus === "executive" ? (
        <>
          <DashboardSection eyebrow="Atención inmediata" title="Operación transversal" description="Lo primero es revisar cobros pendientes, pedido reciente y señales del frente comercial.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <ReviewDrawer title="Revisión de pagos" items={reviewItems} />
              </div>
              {latestOrder ? <CardSnapshot order={latestOrder} /> : <EmptyDashboardCard title="Sin pedido destacado" description="Todavía no hay un pedido reciente para mostrar en detalle." />}
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Pedidos" title="Últimos movimientos" description="Pedidos recientes y timeline del pedido más representativo.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <AdminDataTable
                  title="Pedidos recientes"
                  description="Vista transversal de la operación."
                  headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
                  rows={recentOrdersRows.slice(0, 4)}
                />
              </div>
              <div className="min-w-0 overflow-hidden">
                <TimelinePedido items={timelineItems} />
              </div>
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Frente comercial" title="Comisiones, campañas y leads" description="Resumen ejecutivo del frente seller y del pipeline comercial.">
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="min-w-0 overflow-hidden">
                <CommissionTable rows={commissionRows.slice(0, 4) as CommissionRow[]} />
              </div>
              <div className="grid gap-4">
                <div className="min-w-0 overflow-hidden">
                  <AdminDataTable
                    title="Campañas y CRM"
                    description="Señales del frente comercial."
                    headers={["Campaña", "Segmento", "Canal", "Estado", "Recipients", "Actualizado"]}
                    rows={campaignRows.slice(0, 4)}
                  />
                </div>
                <div className="min-w-0 overflow-hidden">
                  <AdminDataTable
                    title="Leads abiertos"
                    description="Mayoristas y distribuidores en seguimiento."
                    headers={["Empresa", "Contacto", "Ciudad", "Estado", "Cotizaciones", "Actualizado"]}
                    rows={leadRows.slice(0, 4)}
                  />
                </div>
              </div>
            </div>
          </DashboardSection>
        </>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando dashboard...</p> : null}
    </div>
  );
}

function CardSnapshot({ order }: { order: AdminOrderDetail }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
      <div className="min-w-0 rounded-[1.6rem] border border-black/8 bg-white p-5 shadow-[0_4px_20px_rgba(26,58,46,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">Último pedido</p>
            <h2 className="mt-2 text-[1.4rem] font-semibold tracking-tight text-[#1a3a2e]">{order.orderNumber}</h2>
            <p className="mt-2 text-sm text-black/60">
              {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
            </p>
          </div>
          <Badge tone="info">{order.paymentMethod}</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.2rem] border border-black/8 bg-[#f4f6f5] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">Total</p>
            <p className="mt-2 text-[1.9rem] font-semibold text-[#1a3a2e]">{formatCurrency(order.total)}</p>
            <p className="mt-2 text-sm text-black/60">
              {order.items.length} artículo(s) · {order.orderStatus}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-black/8 bg-[#f4f6f5] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">Dirección</p>
            <p className="mt-2 text-sm font-medium text-[#1a3a2e]">{order.address.recipientName}</p>
            <p className="text-sm text-black/60">{order.address.line1}</p>
            <p className="text-sm text-black/60">
              {order.address.city}, {order.address.region} · {order.address.postalCode}
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-[1.6rem] border border-black/8 bg-[#1a3a2e] p-5 text-white shadow-[0_4px_20px_rgba(26,58,46,0.18)]">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Resumen financiero</p>
        <div className="mt-4 grid gap-3 text-sm text-white/80">
          <div className="grid grid-cols-2 gap-3">
            <p>Subtotal</p>
            <p className="text-right">{formatCurrency(order.subtotal)}</p>
            <p>Descuento</p>
            <p className="text-right">{formatCurrency(order.discount)}</p>
            <p>Envío</p>
            <p className="text-right">{formatCurrency(order.shipping)}</p>
          </div>
          <div className="rounded-[1.05rem] bg-white/8 px-3 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-white/55">Total</p>
            <p className="mt-1 text-[1.15rem] font-semibold text-white">{formatCurrency(order.total)}</p>
          </div>
          <div className="grid gap-1.5 text-sm">
            <p>Pago: {order.paymentStatus}</p>
            <p className="break-words">Comprobante: {order.manualEvidenceReference ?? "No aplica"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyDashboardCard({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="rounded-[1.75rem] border-black/8 shadow-[0_4px_20px_rgba(26,58,46,0.08)]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-black/58">Cuando exista actividad reciente, este panel mostrará el detalle operativo más relevante.</p>
      </CardContent>
    </Card>
  );
}
