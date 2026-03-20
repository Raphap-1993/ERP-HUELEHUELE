"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminDataTable, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, MetricCard, SectionHeader, Separator, StatusBadge, TimelinePedido } from "@huelegood/ui";
import type { AdminOrderDetail, AdminOrderSummary, OrderStatus, PaymentStatus, ManualPaymentRequestStatus } from "@huelegood/shared";
import { fetchOrder, fetchOrders } from "../lib/api";

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

function orderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    draft: "Borrador",
    pending_payment: "Pendiente de pago",
    payment_under_review: "Pago en revisión",
    paid: "Pagado",
    confirmed: "Confirmado",
    preparing: "Preparando",
    shipped: "Enviado",
    delivered: "Entregado",
    completed: "Completado",
    cancelled: "Cancelado",
    refunded: "Reembolsado",
    expired: "Expirado"
  };

  return labels[status];
}

function paymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    initiated: "Iniciado",
    pending: "Pendiente",
    authorized: "Autorizado",
    paid: "Pagado",
    failed: "Fallido",
    expired: "Expirado"
  };

  return labels[status];
}

function manualStatusLabel(status?: ManualPaymentRequestStatus) {
  const labels: Record<ManualPaymentRequestStatus, string> = {
    submitted: "Enviado",
    under_review: "En revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    expired: "Expirado"
  };

  return status ? labels[status] : "Sin solicitud";
}

export function OrdersWorkspace() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      try {
        const response = await fetchOrders();
        if (!active) {
          return;
        }

        setOrders(response.data);
        setError(null);

        if (!selectedOrderNumber && response.data[0]) {
          setSelectedOrderNumber(response.data[0].orderNumber);
        }

        if (selectedOrderNumber && !response.data.some((order) => order.orderNumber === selectedOrderNumber) && response.data[0]) {
          setSelectedOrderNumber(response.data[0].orderNumber);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar los pedidos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!orders.length) {
      setSelectedOrderNumber(null);
      return;
    }

    if (!selectedOrderNumber || !orders.some((order) => order.orderNumber === selectedOrderNumber)) {
      setSelectedOrderNumber(orders[0].orderNumber);
    }
  }, [orders, selectedOrderNumber]);

  useEffect(() => {
    const orderNumber = selectedOrderNumber;

    if (!orderNumber) {
      setSelectedOrder(null);
      return;
    }

    let active = true;

    async function loadSelectedOrder() {
      setDetailLoading(true);
      try {
        const response = await fetchOrder(orderNumber!);
        if (active) {
          setSelectedOrder(response.data);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el detalle del pedido.");
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    void loadSelectedOrder();

    return () => {
      active = false;
    };
  }, [refreshKey, selectedOrderNumber]);

  const metrics = useMemo(
    () => [
      {
        label: "Pedidos activos",
        value: String(orders.length),
        detail: "Pedidos visibles en operación."
      },
      {
        label: "Pagados",
        value: String(orders.filter((order) => order.paymentStatus === "paid").length),
        detail: "Cobros confirmados y conciliados."
      },
      {
        label: "En revisión",
        value: String(orders.filter((order) => order.manualStatus === "under_review").length),
        detail: "Solicitudes manuales esperando decisión."
      },
      {
        label: "Pendientes",
        value: String(orders.filter((order) => order.orderStatus === "pending_payment").length),
        detail: "Checkout preparado pero sin pago final."
      }
    ],
    [orders]
  );

  const selectedSummary = orders.find((order) => order.orderNumber === selectedOrderNumber) ?? null;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          title="Pedidos"
          description="Listado operativo de órdenes con trazabilidad de estado, pago y comprobante manual."
        />
        <Button type="button" variant="secondary" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading}>
          {loading ? "Actualizando..." : "Refrescar"}
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <AdminDataTable
          title="Pedidos activos"
          description={error ?? "Resumen operativo del flujo comercial."}
          headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
          rows={orders.map((order) => [
            <Button
              key={order.orderNumber}
              type="button"
              variant="ghost"
              className="px-0 font-semibold"
              onClick={() => setSelectedOrderNumber(order.orderNumber)}
            >
              {order.orderNumber}
            </Button>,
            order.customerName,
            formatCurrency(order.total),
            <StatusBadge key={`${order.orderNumber}-status`} tone={orderTone(order.orderStatus)} label={orderStatusLabel(order.orderStatus)} />,
            <StatusBadge
              key={`${order.orderNumber}-payment`}
              tone={paymentTone(order.paymentStatus)}
              label={paymentStatusLabel(order.paymentStatus)}
            />,
            order.vendorCode ?? "Sin código",
            order.updatedAt
          ])}
        />

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Detalle del pedido</CardTitle>
            <CardDescription>
              {detailLoading
                ? "Cargando detalle..."
                : selectedSummary
                  ? `${selectedSummary.orderNumber} · ${selectedSummary.customerName}`
                  : "Selecciona un pedido para ver su traza completa."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedOrder ? (
              <>
                <div className="space-y-3 rounded-3xl border border-black/10 bg-black/[0.02] p-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={orderTone(selectedOrder.orderStatus)} label={orderStatusLabel(selectedOrder.orderStatus)} />
                    <StatusBadge tone={paymentTone(selectedOrder.paymentStatus)} label={paymentStatusLabel(selectedOrder.paymentStatus)} />
                    <StatusBadge tone={manualTone(selectedOrder.manualStatus)} label={manualStatusLabel(selectedOrder.manualStatus)} />
                  </div>
                  <div className="space-y-1 text-sm text-[#132016]">
                    <p>
                      <strong>Proveedor:</strong> {selectedOrder.payment.provider === "manual" ? "Pago manual" : "Openpay"}
                    </p>
                    <p>
                      <strong>Referencia:</strong> {selectedOrder.providerReference}
                    </p>
                    <p>
                      <strong>Total:</strong> {formatCurrency(selectedOrder.total)}
                    </p>
                    <p>
                      <strong>Vendedor:</strong> {selectedOrder.vendorCode ?? "Sin código"}
                    </p>
                    <p>
                      <strong>Actualizado:</strong> {selectedOrder.updatedAt}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-black/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Cliente</p>
                    <p className="mt-2 font-semibold text-[#132016]">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                    <p className="text-sm text-black/60">{selectedOrder.customer.email}</p>
                    <p className="text-sm text-black/60">{selectedOrder.customer.phone}</p>
                  </div>
                  <div className="rounded-3xl border border-black/10 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Envío</p>
                    <p className="mt-2 font-semibold text-[#132016]">{selectedOrder.address.recipientName}</p>
                    <p className="text-sm text-black/60">{selectedOrder.address.line1}</p>
                    {selectedOrder.address.line2 ? <p className="text-sm text-black/60">{selectedOrder.address.line2}</p> : null}
                    <p className="text-sm text-black/60">
                      {selectedOrder.address.city}, {selectedOrder.address.region}
                    </p>
                    <p className="text-sm text-black/60">{selectedOrder.address.postalCode}, {selectedOrder.address.countryCode}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border border-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Items</p>
                    <Badge tone="neutral">{selectedOrder.items.length} líneas</Badge>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.slug} className="flex items-center justify-between gap-4 rounded-2xl bg-black/[0.02] px-4 py-3">
                        <div>
                          <p className="font-semibold text-[#132016]">{item.name}</p>
                          <p className="text-sm text-black/55">{item.sku} · x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#132016]">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 rounded-3xl border border-black/10 p-4 text-sm text-[#132016]">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Descuento</span>
                    <span>{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Envío</span>
                    <span>{formatCurrency(selectedOrder.shipping)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {selectedOrder.manualRequest ? (
                  <div className="space-y-2 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-950">Solicitud manual</p>
                    <p className="text-sm text-amber-950/80">
                      {selectedOrder.manualRequest.id} · {manualStatusLabel(selectedOrder.manualRequest.status)}
                    </p>
                    <p className="text-sm text-amber-950/80">
                      Evidencia: {selectedOrder.manualRequest.evidenceReference ?? "Sin comprobante"}
                    </p>
                    {selectedOrder.manualRequest.evidenceNotes ? (
                      <p className="text-sm text-amber-950/80">{selectedOrder.manualRequest.evidenceNotes}</p>
                    ) : null}
                    {selectedOrder.manualRequest.reviewer ? (
                      <p className="text-sm text-amber-950/80">
                        Revisión: {selectedOrder.manualRequest.reviewer} · {selectedOrder.manualRequest.reviewedAt}
                      </p>
                    ) : (
                      <p className="text-sm text-amber-950/80">Pendiente de decisión operativa.</p>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-black/15 bg-black/[0.015] p-6 text-sm text-black/55">
                No hay un pedido seleccionado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedOrder ? <TimelinePedido items={selectedOrder.statusHistory} /> : null}
    </div>
  );
}
