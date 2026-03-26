"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminDataTable, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, MetricCard, SectionHeader, Separator, StatusBadge, TimelinePedido } from "@huelegood/ui";
import type { AdminOrderDetail, AdminOrderSummary, OrderStatus, PaymentStatus, ManualPaymentRequestStatus } from "@huelegood/shared";
import { fetchOrder, fetchOrders } from "../lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
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

function orderPriorityWeight(order: AdminOrderSummary) {
  if (order.manualStatus === "under_review" || order.orderStatus === "payment_under_review") {
    return 4;
  }

  if (order.orderStatus === "pending_payment") {
    return 3;
  }

  if (order.paymentStatus === "paid" && (order.orderStatus === "paid" || order.orderStatus === "confirmed")) {
    return 2;
  }

  return 1;
}

function orderPriorityLabel(order: AdminOrderSummary) {
  if (order.manualStatus === "under_review" || order.orderStatus === "payment_under_review") {
    return { label: "Requiere revisión", tone: "warning" as const };
  }

  if (order.orderStatus === "pending_payment") {
    return { label: "Cobro pendiente", tone: "info" as const };
  }

  if (order.orderStatus === "paid" || order.orderStatus === "confirmed") {
    return { label: "Listo para avanzar", tone: "success" as const };
  }

  return { label: "Seguimiento", tone: "neutral" as const };
}

export function OrdersWorkspace() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"detalle" | "timeline">("detalle");

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
  const priorityOrders = useMemo(
    () =>
      [...orders]
        .sort((left, right) => {
          const byPriority = orderPriorityWeight(right) - orderPriorityWeight(left);
          if (byPriority !== 0) {
            return byPriority;
          }

          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        })
        .slice(0, 6),
    [orders]
  );
  const reviewCount = useMemo(
    () => orders.filter((order) => order.orderStatus === "payment_under_review" || order.manualStatus === "under_review").length,
    [orders]
  );
  const pendingCollectionCount = useMemo(() => orders.filter((order) => order.orderStatus === "pending_payment").length, [orders]);
  const fulfilledCount = useMemo(
    () => orders.filter((order) => ["confirmed", "preparing", "shipped", "delivered", "completed"].includes(order.orderStatus)).length,
    [orders]
  );
  const averageTicket = useMemo(
    () => (orders.length ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0),
    [orders]
  );
  const spotlightText = reviewCount
    ? `${reviewCount} pedido(s) requieren validación inmediata.`
    : pendingCollectionCount
      ? `${pendingCollectionCount} pedido(s) siguen esperando pago.`
      : "La cola operativa está estable y lista para seguimiento normal.";
  const allOrdersRows = useMemo(
    () =>
      orders.map((order) => [
        <div key={`${order.orderNumber}-meta`} className="space-y-1">
          <Button
            type="button"
            variant="ghost"
            className="h-auto px-0 py-0 text-left font-semibold"
            onClick={() => { setSelectedOrderNumber(order.orderNumber); setActiveTab("detalle"); setModalOpen(true); }}
          >
            {order.orderNumber}
          </Button>
          <div className="text-xs text-black/45">{formatDateTime(order.createdAt)}</div>
        </div>,
        <div key={`${order.orderNumber}-customer`} className="space-y-1">
          <div className="font-medium text-[#132016]">{order.customerName}</div>
          <div className="text-xs text-black/45">{order.paymentMethod === "manual" ? "Pago manual" : "Openpay"}</div>
        </div>,
        formatCurrency(order.total),
        <StatusBadge key={`${order.orderNumber}-status`} tone={orderTone(order.orderStatus)} label={orderStatusLabel(order.orderStatus)} />,
        <StatusBadge
          key={`${order.orderNumber}-payment`}
          tone={paymentTone(order.paymentStatus)}
          label={paymentStatusLabel(order.paymentStatus)}
        />,
        order.vendorCode ?? "Sin código",
        formatDateTime(order.updatedAt)
      ]),
    [orders]
  );

  return (
    <div className="space-y-6 pb-8">
      <Card className="overflow-hidden border-black/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(241,246,239,0.96)_45%,rgba(247,244,238,0.98)_100%)]">
        <CardContent className="grid gap-6 px-6 py-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionHeader
                title="Pedidos"
                description="Vista priorizada para cobro, validación y trazabilidad del pedido completo."
              />
              <Button type="button" variant="secondary" onClick={() => setRefreshKey((current) => current + 1)} disabled={loading}>
                {loading ? "Actualizando..." : "Refrescar"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={reviewCount ? "warning" : "success"}>{spotlightText}</Badge>
              <Badge tone="neutral">Ticket promedio {formatCurrency(averageTicket)}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <HeroFact label="En revisión" value={String(reviewCount)} detail="Pedidos bloqueando decisión operativa." />
              <HeroFact label="Cobro pendiente" value={String(pendingCollectionCount)} detail="Órdenes listas pero sin pago final." />
              <HeroFact label="En curso" value={String(fulfilledCount)} detail="Pedidos ya pagados o avanzando logística." />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <OperationalCallout
              title="Prioridad de hoy"
              description="Primero revisar comprobantes y pagos retenidos. Luego confirmar órdenes pagadas para que pasen a preparación."
            />
            <OperationalCallout
              title="Cobertura"
              description={`${orders.length} pedido(s) visibles con ${orders.filter((order) => order.vendorCode).length} atribuido(s) a vendedor y ${orders.filter((order) => order.paymentMethod === "manual").length} por pago manual.`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cola prioritaria</CardTitle>
          <CardDescription>{error ?? "Los pedidos más urgentes para decisión o seguimiento inmediato."}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {priorityOrders.length ? (
              priorityOrders.map((order) => {
                const priority = orderPriorityLabel(order);

                return (
                  <button
                    key={order.orderNumber}
                    type="button"
                    onClick={() => { setSelectedOrderNumber(order.orderNumber); setActiveTab("detalle"); setModalOpen(true); }}
                    className="w-full rounded-[1.5rem] border border-black/10 bg-black/[0.02] p-4 text-left text-[#132016] transition hover:border-black/15 hover:bg-black/[0.035]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{order.orderNumber}</div>
                        <div className="text-sm text-black/58">{order.customerName}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={priority.tone}>{priority.label}</Badge>
                        <Badge tone="neutral">{formatCurrency(order.total)}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-black/62 md:grid-cols-2">
                      <div>Estado: {orderStatusLabel(order.orderStatus)}</div>
                      <div>Pago: {paymentStatusLabel(order.paymentStatus)}</div>
                      <div>Método: {order.paymentMethod === "manual" ? "Pago manual" : "Openpay"}</div>
                      <div>Actualizado: {formatDateTime(order.updatedAt)}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full rounded-[1.5rem] border border-dashed border-black/15 bg-black/[0.015] p-6 text-sm leading-6 text-black/55">
                Cuando entren nuevas órdenes o cambien de estado, aparecerán aquí por prioridad.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        title="Cola completa"
        description="Listado completo para búsqueda rápida y navegación entre órdenes visibles."
        headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Vendedor", "Actualizado"]}
        rows={allOrdersRows}
      />

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} size="xl">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {detailLoading ? "Cargando..." : selectedSummary ? `${selectedSummary.orderNumber} · ${selectedSummary.customerName}` : "Detalle del pedido"}
            </DialogTitle>
            <div className="mt-3 flex gap-1 border-b border-black/10">
              {(["detalle", "timeline"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-t-xl px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "border-b-2 border-[#132016] text-[#132016]"
                      : "text-black/50 hover:text-black/70"
                  }`}
                >
                  {tab === "detalle" ? "Detalle" : `Timeline${selectedOrder?.statusHistory.length ? ` (${selectedOrder.statusHistory.length})` : ""}`}
                </button>
              ))}
            </div>
          </DialogHeader>
          <DialogBody>
            {detailLoading ? (
              <p className="text-sm text-black/55">Cargando detalle del pedido...</p>
            ) : selectedOrder && activeTab === "detalle" ? (
              <div className="space-y-5">
                <div className="rounded-[1.75rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,237,0.94)_100%)] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-black/42">Resumen inmediato</p>
                      <h3 className="text-2xl font-semibold tracking-tight text-[#132016]">{selectedOrder.orderNumber}</h3>
                      <p className="text-sm text-black/58">
                        {selectedOrder.customer.firstName} {selectedOrder.customer.lastName} · {selectedOrder.customer.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={orderTone(selectedOrder.orderStatus)} label={orderStatusLabel(selectedOrder.orderStatus)} />
                      <StatusBadge tone={paymentTone(selectedOrder.paymentStatus)} label={paymentStatusLabel(selectedOrder.paymentStatus)} />
                      <StatusBadge tone={manualTone(selectedOrder.manualStatus)} label={manualStatusLabel(selectedOrder.manualStatus)} />
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryTile label="Proveedor" value={selectedOrder.payment.provider === "manual" ? "Pago manual" : "Openpay"} />
                    <SummaryTile label="Referencia" value={selectedOrder.providerReference} />
                    <SummaryTile label="Total" value={formatCurrency(selectedOrder.total)} />
                    <SummaryTile label="Vendedor" value={selectedOrder.vendorCode ?? "Sin código"} />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-black/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Cliente</p>
                    <p className="mt-2 font-semibold text-[#132016]">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                    <p className="text-sm text-black/60">{selectedOrder.customer.email}</p>
                    <p className="text-sm text-black/60">{selectedOrder.customer.phone}</p>
                  </div>
                  <div className="rounded-[1.5rem] border border-black/10 bg-white p-4">
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

                <div className="space-y-3 rounded-[1.5rem] border border-black/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Items</p>
                    <Badge tone="neutral">{selectedOrder.items.length} líneas</Badge>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.slug} className="flex items-center justify-between gap-4 rounded-2xl border border-black/8 bg-black/[0.02] px-4 py-3">
                        <div>
                          <p className="font-semibold text-[#132016]">{item.name}</p>
                          <p className="text-sm text-black/55">{item.sku} · x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#132016]">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 rounded-[1.5rem] border border-black/10 bg-white p-4 text-sm text-[#132016]">
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
                  <div className="space-y-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-950">Solicitud manual</p>
                    <p className="text-sm text-amber-950/80">
                      {selectedOrder.manualRequest.id} · {manualStatusLabel(selectedOrder.manualRequest.status)}
                    </p>

                    {/* Imagen del comprobante Yape */}
                    {selectedOrder.manualRequest.evidenceImageUrl ? (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-amber-900/60">Comprobante</p>
                        <div className="overflow-hidden rounded-[12px] border border-amber-200 bg-white">
                          <img
                            src={selectedOrder.manualRequest.evidenceImageUrl}
                            alt="Comprobante de pago"
                            className="max-h-72 w-full object-contain"
                          />
                        </div>
                        <a
                          href={selectedOrder.manualRequest.evidenceImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-amber-800 underline underline-offset-2 hover:text-amber-950"
                        >
                          Ver imagen completa →
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-950/80">
                        Evidencia: {selectedOrder.manualRequest.evidenceReference ?? "Sin comprobante"}
                      </p>
                    )}

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
              </div>
            ) : selectedOrder && activeTab === "timeline" ? (
              <TimelinePedido items={selectedOrder.statusHistory} />
            ) : (
              <p className="text-sm text-black/55">Selecciona un pedido para ver su detalle.</p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HeroFact({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/8 bg-white/78 px-4 py-4">
      <div className="text-xs uppercase tracking-[0.22em] text-black/40">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[#132016]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-black/58">{detail}</p>
    </div>
  );
}

function OperationalCallout({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-black/8 bg-white/78 px-4 py-4">
      <div className="text-sm font-semibold text-[#132016]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-black/58">{description}</p>
    </div>
  );
}

function SummaryTile({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/8 bg-white/76 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.2em] text-black/42">{label}</div>
      <div className="mt-2 text-sm font-semibold text-[#132016]">{value}</div>
    </div>
  );
}
