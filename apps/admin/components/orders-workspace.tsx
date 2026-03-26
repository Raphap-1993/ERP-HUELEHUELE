"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminDataTable, Badge, Button, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator, StatusBadge, TimelinePedido } from "@huelegood/ui";
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
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function orderTone(status: OrderStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "paid" || status === "confirmed" || status === "completed") return "success";
  if (status === "cancelled" || status === "refunded" || status === "expired") return "danger";
  if (status === "payment_under_review" || status === "pending_payment") return "warning";
  return "info";
}

function paymentTone(status: PaymentStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "paid") return "success";
  if (status === "failed" || status === "expired") return "danger";
  return "warning";
}

function manualTone(status?: ManualPaymentRequestStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  if (status === "under_review") return "warning";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"detalle" | "timeline">("detalle");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      setLoading(true);
      try {
        const response = await fetchOrders();
        if (!active) return;
        setOrders(response.data);
        setError(null);
        if (!selectedOrderNumber && response.data[0]) {
          setSelectedOrderNumber(response.data[0].orderNumber);
        }
        if (selectedOrderNumber && !response.data.some((o) => o.orderNumber === selectedOrderNumber) && response.data[0]) {
          setSelectedOrderNumber(response.data[0].orderNumber);
        }
      } catch (fetchError) {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar los pedidos.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadOrders();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    if (!orders.length) { setSelectedOrderNumber(null); return; }
    if (!selectedOrderNumber || !orders.some((o) => o.orderNumber === selectedOrderNumber)) {
      setSelectedOrderNumber(orders[0].orderNumber);
    }
  }, [orders, selectedOrderNumber]);

  useEffect(() => {
    const orderNumber = selectedOrderNumber;
    if (!orderNumber) { setSelectedOrder(null); return; }

    let active = true;

    async function loadSelectedOrder() {
      setDetailLoading(true);
      try {
        const response = await fetchOrder(orderNumber!);
        if (active) setSelectedOrder(response.data);
      } catch (fetchError) {
        if (active) setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el detalle del pedido.");
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    void loadSelectedOrder();
    return () => { active = false; };
  }, [refreshKey, selectedOrderNumber]);

  const reviewCount = useMemo(
    () => orders.filter((o) => o.orderStatus === "payment_under_review" || o.manualStatus === "under_review").length,
    [orders]
  );

  const selectedSummary = orders.find((o) => o.orderNumber === selectedOrderNumber) ?? null;

  const allOrdersRows = useMemo(
    () =>
      orders.map((order) => [
        <div key={`${order.orderNumber}-meta`} className="space-y-0.5">
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
        <div key={`${order.orderNumber}-customer`} className="space-y-0.5">
          <div className="font-medium text-[#132016]">{order.customerName}</div>
          <div className="text-xs text-black/45">{order.paymentMethod === "manual" ? "Pago manual" : "Openpay"}</div>
        </div>,
        formatCurrency(order.total),
        <StatusBadge key={`${order.orderNumber}-status`} tone={orderTone(order.orderStatus)} label={orderStatusLabel(order.orderStatus)} />,
        <StatusBadge key={`${order.orderNumber}-payment`} tone={paymentTone(order.paymentStatus)} label={paymentStatusLabel(order.paymentStatus)} />,
        order.manualStatus ? (
          <StatusBadge key={`${order.orderNumber}-manual`} tone={manualTone(order.manualStatus)} label={manualStatusLabel(order.manualStatus)} />
        ) : <span key={`${order.orderNumber}-manual`} className="text-xs text-black/35">—</span>,
        order.vendorCode ?? <span className="text-black/35">—</span>
      ]),
    [orders]
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header compacto */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#132016]">Pedidos</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-black/50">{orders.length} pedido(s)</span>
            {reviewCount > 0 && (
              <Badge tone="warning">{reviewCount} en revisión</Badge>
            )}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
          {loading ? "Actualizando..." : "Refrescar"}
        </Button>
      </div>

      {/* Tabla principal */}
      <AdminDataTable
        title=""
        description=""
        headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Solicitud manual", "Vendedor"]}
        rows={allOrdersRows}
      />

      {/* Modal de detalle */}
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
              <div className="space-y-4">
                {/* Resumen de badges */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={orderTone(selectedOrder.orderStatus)} label={orderStatusLabel(selectedOrder.orderStatus)} />
                    <StatusBadge tone={paymentTone(selectedOrder.paymentStatus)} label={paymentStatusLabel(selectedOrder.paymentStatus)} />
                    {selectedOrder.manualStatus && (
                      <StatusBadge tone={manualTone(selectedOrder.manualStatus)} label={manualStatusLabel(selectedOrder.manualStatus)} />
                    )}
                  </div>
                  <span className="text-lg font-semibold text-[#132016]">{formatCurrency(selectedOrder.total)}</span>
                </div>

                {/* Cliente + Envío */}
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailBlock label="Cliente">
                    <p className="font-medium text-[#132016]">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                    <p className="text-sm text-black/60">{selectedOrder.customer.email}</p>
                    <p className="text-sm text-black/60">{selectedOrder.customer.phone}</p>
                  </DetailBlock>
                  <DetailBlock label="Envío">
                    <p className="font-medium text-[#132016]">{selectedOrder.address.recipientName}</p>
                    <p className="text-sm text-black/60">{selectedOrder.address.line1}</p>
                    {selectedOrder.address.line2 ? <p className="text-sm text-black/60">{selectedOrder.address.line2}</p> : null}
                    <p className="text-sm text-black/60">{selectedOrder.address.city}, {selectedOrder.address.region}</p>
                    <p className="text-sm text-black/60">{selectedOrder.address.countryCode}</p>
                  </DetailBlock>
                </div>

                {/* Items */}
                <DetailBlock label={`Items · ${selectedOrder.items.length}`}>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.slug} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-[#132016]">{item.name}</p>
                          <p className="text-xs text-black/50">{item.sku} · x{item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-[#132016]">{formatCurrency(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </DetailBlock>

                {/* Totales */}
                <div className="space-y-2 rounded-[1.25rem] border border-black/10 bg-white p-4 text-sm text-[#132016]">
                  <div className="flex justify-between"><span className="text-black/55">Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span></div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between"><span className="text-black/55">Descuento</span><span>-{formatCurrency(selectedOrder.discount)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-black/55">Envío</span><span>{formatCurrency(selectedOrder.shipping)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(selectedOrder.total)}</span></div>
                </div>

                {/* Pago + referencia */}
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  <SummaryTile label="Proveedor" value={selectedOrder.payment.provider === "manual" ? "Pago manual" : "Openpay"} />
                  <SummaryTile label="Referencia" value={selectedOrder.providerReference ?? "—"} />
                  <SummaryTile label="Vendedor" value={selectedOrder.vendorCode ?? "—"} />
                </div>

                {/* Solicitud manual con comprobante */}
                {selectedOrder.manualRequest ? (
                  <div className="space-y-3 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-amber-950">Solicitud manual</p>
                      <StatusBadge tone={manualTone(selectedOrder.manualRequest.status)} label={manualStatusLabel(selectedOrder.manualRequest.status)} />
                    </div>

                    {selectedOrder.manualRequest.evidenceImageUrl ? (
                      <div className="space-y-2">
                        <div className="overflow-hidden rounded-[10px] border border-amber-200 bg-white">
                          <img
                            src={selectedOrder.manualRequest.evidenceImageUrl}
                            alt="Comprobante de pago"
                            className="max-h-64 w-full object-contain"
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
                      <p className="text-sm text-amber-950/70">
                        Referencia: {selectedOrder.manualRequest.evidenceReference ?? "Sin comprobante"}
                      </p>
                    )}

                    {selectedOrder.manualRequest.evidenceNotes ? (
                      <p className="text-sm text-amber-950/70">{selectedOrder.manualRequest.evidenceNotes}</p>
                    ) : null}

                    {selectedOrder.manualRequest.reviewer ? (
                      <p className="text-xs text-amber-900/60">
                        Revisado por {selectedOrder.manualRequest.reviewer} · {selectedOrder.manualRequest.reviewedAt}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-900/60">Pendiente de decisión.</p>
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

function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-black/10 bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/40">{label}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-black/10 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-black/40">{label}</div>
      <div className="mt-1 text-sm font-semibold text-[#132016]">{value}</div>
    </div>
  );
}
