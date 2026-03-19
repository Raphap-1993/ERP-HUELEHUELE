"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  AdminDataTable,
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

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <SectionHeader
            title={overview?.title ?? "Dashboard"}
            description={overview?.description ?? "Cargando vista operacional por rol."}
          />
          {overview ? <Badge tone="info">Vista {focusLabel(overview.focus)}</Badge> : null}
        </div>
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          Refrescar
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {(overview?.metrics ?? []).map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {overview?.focus === "payments" ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <AdminDataTable
              title="Cola de pagos"
              description="Cobros y conciliaciones que requieren atención."
              headers={["Pedido", "Cliente", "Proveedor", "Monto", "Estado", "Manual", "Actualizado"]}
              rows={paymentRows}
            />
            <ReviewDrawer title="Revisión manual" items={reviewItems} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <TimelinePedido items={timelineItems} />
            <AdminDataTable
              title="Pedidos relacionados"
              description="Últimos pedidos con impacto en la conciliación."
              headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
              rows={recentOrdersRows}
            />
          </div>
          {latestOrder ? <CardSnapshot order={latestOrder} /> : null}
        </>
      ) : null}

      {overview?.focus === "sales" ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <AdminDataTable
              title="Pedidos atribuidos"
              description="Pedidos recientes con código vendedor."
              headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
              rows={recentOrdersRows}
            />
            <CommissionTable rows={commissionRows as CommissionRow[]} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <AdminDataTable
              title="Vendedores activos"
              description="Rendimiento comercial y saldo pendiente."
              headers={["Vendedor", "Código", "Estado", "Ventas", "Pendiente", "Pedidos", "Actualizado"]}
              rows={vendorRows}
            />
            <AdminDataTable
              title="Liquidaciones"
              description="Estado actual de pagos a sellers."
              headers={["Liquidación", "Vendedor", "Periodo", "Monto", "Estado", "Actualizado"]}
              rows={payoutRows}
            />
          </div>
        </>
      ) : null}

      {overview?.focus === "marketing" ? (
        <>
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
        </>
      ) : null}

      {overview?.focus === "executive" ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <AdminDataTable
              title="Pedidos recientes"
              description="Vista transversal de la operación."
              headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
              rows={recentOrdersRows}
            />
            <ReviewDrawer title="Revisión de pagos" items={reviewItems} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <TimelinePedido items={timelineItems} />
            <CommissionTable rows={commissionRows as CommissionRow[]} />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
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
          {latestOrder ? <CardSnapshot order={latestOrder} /> : null}
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
