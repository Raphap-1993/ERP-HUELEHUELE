"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
  Badge,
  Button,
  CommissionTable,
  MetricCard,
  ReviewDrawer,
  SectionHeader,
  TimelinePedido
} from "@huelegood/ui";
import {
  type AdminManualPaymentRequestSummary,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type AdminPaymentSummary,
  type CommissionRow,
  type CommissionSummary,
  type ManualPaymentRequestStatus,
  type ReviewItem,
  type TimelineEntry,
  type VendorSummary,
  type OrderStatus,
  type PaymentStatus,
  CommissionStatus
} from "@huelegood/shared";
import { fetchCommissions, fetchManualPaymentRequests, fetchOrder, fetchOrders, fetchVendors, fetchPayments } from "../lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

function orderTone(status: OrderStatus): "neutral" | "success" | "warning" | "danger" | "info" {
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
  if (status === "paid") {
    return "success";
  }

  if (status === "failed" || status === "expired") {
    return "danger";
  }

  return "warning";
}

function manualTone(status?: ManualPaymentRequestStatus): "neutral" | "success" | "warning" | "danger" | "info" {
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
  if (status === "paid") {
    return "success";
  }

  if (status === "payable" || status === "scheduled_for_payout") {
    return "warning";
  }

  if (status === "blocked" || status === "reversed" || status === "cancelled") {
    return "danger";
  }

  if (status === "pending_attribution" || status === "attributed" || status === "approved") {
    return "info";
  }

  return "neutral";
}

function deriveCommissionStatus(commissions: CommissionSummary[]) {
  const priority: CommissionStatus[] = [
    CommissionStatus.Paid,
    CommissionStatus.ScheduledForPayout,
    CommissionStatus.Payable,
    CommissionStatus.Blocked,
    CommissionStatus.Reversed,
    CommissionStatus.Cancelled,
    CommissionStatus.Approved,
    CommissionStatus.Attributed,
    CommissionStatus.PendingAttribution
  ];

  for (const status of priority) {
    if (commissions.some((commission) => commission.status === status)) {
      return status;
    }
  }

  return CommissionStatus.PendingAttribution;
}

function summarizeVendorRows(vendors: VendorSummary[], commissions: CommissionSummary[]): CommissionRow[] {
  return vendors.map((vendor) => {
    const vendorCommissions = commissions.filter((commission) => commission.vendorCode === vendor.code);
    const period = vendorCommissions[0]?.period ?? "Periodo actual";

    return {
      vendor: vendor.name,
      code: vendor.code,
      totalSales: vendor.sales,
      commission: vendor.commissions,
      status: deriveCommissionStatus(vendorCommissions),
      period
    };
  });
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

export function DashboardWorkspace() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [manualRequests, setManualRequests] = useState<AdminManualPaymentRequestSummary[]>([]);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [commissions, setCommissions] = useState<CommissionSummary[]>([]);
  const [latestOrder, setLatestOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);

      try {
        const [ordersResponse, paymentsResponse, requestsResponse, vendorsResponse, commissionsResponse] = await Promise.all([
          fetchOrders(),
          fetchPayments(),
          fetchManualPaymentRequests(),
          fetchVendors(),
          fetchCommissions()
        ]);

        if (!active) {
          return;
        }

        setOrders(ordersResponse.data);
        setPayments(paymentsResponse.data);
        setManualRequests(requestsResponse.data);
        setVendors(vendorsResponse.data);
        setCommissions(commissionsResponse.data);
        setError(null);

        const firstOrderNumber = ordersResponse.data[0]?.orderNumber;
        if (firstOrderNumber) {
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
        } else if (active) {
          setLatestOrder(null);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el dashboard.");
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
  }, [refreshKey]);

  const metrics = useMemo(
    () => [
      {
        label: "Pedidos activos",
        value: String(orders.length),
        detail: "Pedidos visibles en el backoffice."
      },
      {
        label: "Ventas brutas",
        value: formatCurrency(orders.reduce((sum, order) => sum + order.total, 0)),
        detail: "Total agregado desde órdenes reales."
      },
      {
        label: "Pagos confirmados",
        value: String(payments.filter((payment) => payment.status === "paid").length),
        detail: "Cobros conciliados desde el API."
      },
      {
        label: "Vendedores activos",
        value: String(vendors.filter((vendor) => vendor.status === "active").length),
        detail: "Códigos habilitados para atribución."
      }
    ],
    [orders, payments, vendors]
  );

  const recentOrders = useMemo(
    () =>
      orders.slice(0, 4).map((order) => [
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
    [orders]
  );

  const reviewItems = useMemo(() => manualRequests.slice(0, 4).map(toReviewItem), [manualRequests]);

  const timelineItems = useMemo(() => (latestOrder ? toTimeline(latestOrder.statusHistory) : []), [latestOrder]);

  const commissionRows = useMemo(() => summarizeVendorRows(vendors, commissions), [commissions, vendors]);

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          title="Dashboard"
          description="Visión en vivo de pedidos, pagos, comisiones y revisión manual."
        />
        <Button variant="secondary" onClick={refresh} disabled={loading}>
          Refrescar
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <AdminDataTable
          title="Pedidos recientes"
          description="Lista operativa conectada al API."
          headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
          rows={recentOrders}
        />
        <ReviewDrawer title="Revisión de pagos" items={reviewItems} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TimelinePedido items={timelineItems} />
        <CommissionTable rows={commissionRows} />
      </div>

      {latestOrder ? (
        <CardSnapshot order={latestOrder} />
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
