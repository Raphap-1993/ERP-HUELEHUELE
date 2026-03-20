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
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
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
        <p className="text-xs uppercase tracking-[0.24em] text-black/42">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-[#132016]">{title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-black/58">{description}</p>
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
    <div className="space-y-6 pb-8">
      <Card className="overflow-hidden border-black/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.98)_0%,rgba(242,246,239,0.96)_100%)] shadow-soft">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <SectionHeader title={overview?.title ?? "Dashboard"} description={overview?.description ?? "Cargando vista operacional por rol."} />
            {overview ? <Badge tone="info">Vista {focusLabel(overview.focus)}</Badge> : null}
          </div>
          <Button variant="secondary" onClick={refresh} disabled={loading}>
            Refrescar
          </Button>
        </CardHeader>
        {overview ? (
          <CardContent className="grid gap-4 border-t border-black/6 pt-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div key={item} className="rounded-3xl border border-black/8 bg-white/78 px-4 py-4 text-sm leading-6 text-[#132016]">
                {item}
              </div>
            ))}
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {(overview?.metrics ?? []).map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {overview?.focus === "payments" ? (
        <>
          <DashboardSection eyebrow="Prioridad" title="Resolución inmediata" description="Primero lo que bloquea cobro, aprobación manual o conciliación.">
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <ReviewDrawer title="Revisión manual" items={reviewItems} />
              {latestOrder ? <CardSnapshot order={latestOrder} /> : <EmptyDashboardCard title="Sin pedido destacado" description="Todavía no hay un pedido reciente para mostrar en detalle." />}
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Seguimiento" title="Cola de cobro" description="Vista operativa de pagos y pedidos que impactan la conciliación.">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <AdminDataTable
                title="Cola de pagos"
                description="Cobros y conciliaciones que requieren atención."
                headers={["Pedido", "Cliente", "Proveedor", "Monto", "Estado", "Manual", "Actualizado"]}
                rows={paymentRows}
              />
              <AdminDataTable
                title="Pedidos relacionados"
                description="Últimos pedidos con impacto en la conciliación."
                headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
                rows={recentOrdersRows}
              />
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Trazabilidad" title="Último timeline operativo" description="Secuencia reciente del pedido más representativo de esta vista.">
            <TimelinePedido items={timelineItems} />
          </DashboardSection>
        </>
      ) : null}

      {overview?.focus === "sales" ? (
        <>
          <DashboardSection eyebrow="Pipeline comercial" title="Ventas, comisión y red de vendedores" description="La vista comercial se ordena por tres frentes: pedidos atribuidos, rendimiento vendedor y liquidaciones.">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <CommissionTable rows={commissionRows as CommissionRow[]} />
              <AdminDataTable
                title="Vendedores activos"
                description="Rendimiento comercial y saldo pendiente."
                headers={["Vendedor", "Código", "Estado", "Ventas", "Pendiente", "Pedidos", "Actualizado"]}
                rows={vendorRows}
              />
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Pedidos" title="Pedidos atribuidos" description="Pedidos recientes que ya cargan trazabilidad comercial por código vendedor.">
            <AdminDataTable
              title="Pedidos atribuidos"
              description="Pedidos recientes con código vendedor."
              headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
              rows={recentOrdersRows}
            />
          </DashboardSection>
          <DashboardSection eyebrow="Liquidación" title="Pagos a sellers" description="Estado actual de las liquidaciones visibles para el equipo comercial.">
            <AdminDataTable
              title="Liquidaciones"
              description="Estado actual de pagos a sellers."
              headers={["Liquidación", "Vendedor", "Periodo", "Monto", "Estado", "Actualizado"]}
              rows={payoutRows}
            />
          </DashboardSection>
        </>
      ) : null}

      {overview?.focus === "marketing" ? (
        <>
          <DashboardSection eyebrow="Adquisición" title="Campañas y leads" description="Primero visibilidad de demanda activa y pipeline mayorista abierto.">
            <div className="grid gap-6 xl:grid-cols-2">
              <AdminDataTable
                title="Campañas"
                description="Campañas activas y programadas."
                headers={["Campaña", "Segmento", "Canal", "Estado", "Recipients", "Actualizado"]}
                rows={campaignRows}
              />
              <AdminDataTable
                title="Leads mayoristas"
                description="Pipeline comercial abierto."
                headers={["Empresa", "Contacto", "Ciudad", "Estado", "Cotizaciones", "Actualizado"]}
                rows={leadRows}
              />
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Retención" title="Mensajería y fidelización" description="Luego seguimiento de notificaciones y comportamiento de cuentas con puntos.">
            <div className="grid gap-6 xl:grid-cols-2">
              <AdminDataTable
                title="Notificaciones"
                description="Despachos comerciales recientes."
                headers={["Asunto", "Audiencia", "Canal", "Estado", "Origen", "Actualizado"]}
                rows={notificationRows}
              />
              <AdminDataTable
                title="Fidelización"
                description="Cuentas con puntos disponibles o en espera."
                headers={["Cliente", "Disponibles", "Pendientes", "Canjeados", "Movimiento", "Canje"]}
                rows={loyaltyRows}
              />
            </div>
          </DashboardSection>
        </>
      ) : null}

      {overview?.focus === "executive" ? (
        <>
          <DashboardSection eyebrow="Atención inmediata" title="Operación transversal" description="Lo primero es ver pagos por revisar, pedido reciente y el estado general de la operación.">
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <ReviewDrawer title="Revisión de pagos" items={reviewItems} />
              {latestOrder ? <CardSnapshot order={latestOrder} /> : <EmptyDashboardCard title="Sin pedido destacado" description="Todavía no hay un pedido reciente para mostrar en detalle." />}
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Pedidos" title="Últimos movimientos" description="Pedidos recientes y timeline del pedido más representativo para mantener contexto operativo.">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <AdminDataTable
                title="Pedidos recientes"
                description="Vista transversal de la operación."
                headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
                rows={recentOrdersRows}
              />
              <TimelinePedido items={timelineItems} />
            </div>
          </DashboardSection>
          <DashboardSection eyebrow="Frente comercial" title="Comisiones, campañas y leads" description="Una vista ejecutiva compacta del frente seller y del pipeline comercial.">
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <CommissionTable rows={commissionRows as CommissionRow[]} />
              <div className="grid gap-6">
                <AdminDataTable
                  title="Campañas y CRM"
                  description="Señales del frente comercial."
                  headers={["Campaña", "Segmento", "Canal", "Estado", "Recipients", "Actualizado"]}
                  rows={campaignRows}
                />
                <AdminDataTable
                  title="Leads abiertos"
                  description="Mayoristas y distribuidores en seguimiento."
                  headers={["Empresa", "Contacto", "Ciudad", "Estado", "Cotizaciones", "Actualizado"]}
                  rows={leadRows}
                />
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
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-soft xl:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-black/45">Último pedido</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#132016]">{order.orderNumber}</h2>
            <p className="mt-2 text-sm text-black/60">
              {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
            </p>
          </div>
          <Badge tone="info">{order.paymentMethod}</Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">Total</p>
            <p className="mt-2 text-3xl font-semibold text-[#132016]">{formatCurrency(order.total)}</p>
            <p className="mt-2 text-sm text-black/60">
              {order.items.length} artículo(s) · {order.orderStatus}
            </p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">Dirección</p>
            <p className="mt-2 text-sm font-medium text-[#132016]">{order.address.recipientName}</p>
            <p className="text-sm text-black/60">{order.address.line1}</p>
            <p className="text-sm text-black/60">
              {order.address.city}, {order.address.region} · {order.address.postalCode}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-black/10 bg-[#132016] p-6 text-white shadow-soft">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Resumen financiero</p>
        <div className="mt-4 space-y-3 text-sm text-white/80">
          <p>Subtotal: {formatCurrency(order.subtotal)}</p>
          <p>Descuento: {formatCurrency(order.discount)}</p>
          <p>Envío: {formatCurrency(order.shipping)}</p>
          <p className="pt-2 text-base font-semibold text-white">Total: {formatCurrency(order.total)}</p>
          <p>Pago: {order.paymentStatus}</p>
          <p>Comprobante: {order.manualEvidenceReference ?? "No aplica"}</p>
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
    <Card className="rounded-[1.75rem] border-black/10 shadow-soft">
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
