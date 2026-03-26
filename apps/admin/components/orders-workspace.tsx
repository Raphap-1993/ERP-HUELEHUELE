"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminDataTable, Badge, Button, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator, StatusBadge, TimelinePedido } from "@huelegood/ui";
import type { AdminOrderDetail, AdminOrderSummary, OrderStatus, PaymentStatus, ManualPaymentRequestStatus, ProductAdminSummary } from "@huelegood/shared";
import { approveManualPaymentRequest, createBackofficeOrder, deleteOrder, fetchAdminProducts, fetchOrder, fetchOrders, rejectManualPaymentRequest } from "../lib/api";

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
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create order state
  const [createOpen, setCreateOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductAdminSummary[]>([]);
  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    line1: "", city: "",
    notes: "", vendorCode: "",
    initialStatus: "pending_payment" as "paid" | "pending_payment"
  });
  const [createItems, setCreateItems] = useState<Array<{ slug: string; name: string; sku: string; variantId?: string; quantity: number; unitPrice: number }>>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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

  async function handleApprove() {
    if (!selectedOrder?.manualRequest) return;
    setActionLoading("approve");
    setActionError(null);
    try {
      await approveManualPaymentRequest(selectedOrder.manualRequest.id, { reviewer: "admin", notes: "Aprobado desde backoffice." });
      setRefreshKey((k) => k + 1);
      setModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo aprobar. Intenta de nuevo.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!selectedOrder?.manualRequest) return;
    setActionLoading("reject");
    setActionError(null);
    try {
      await rejectManualPaymentRequest(selectedOrder.manualRequest.id, { reviewer: "admin", notes: "Rechazado desde backoffice." });
      setRefreshKey((k) => k + 1);
      setModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo rechazar. Intenta de nuevo.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!selectedOrderNumber) return;
    setDeleteLoading(true);
    try {
      await deleteOrder(selectedOrderNumber);
      setDeleteConfirmOpen(false);
      setDeleteConfirmText("");
      setModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo eliminar el pedido.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function openCreateModal() {
    setCreateForm({ firstName: "", lastName: "", email: "", phone: "", line1: "", city: "", notes: "", vendorCode: "", initialStatus: "pending_payment" });
    setCreateItems([]);
    setCreateError(null);
    setCreateOpen(true);
    if (!availableProducts.length) {
      try {
        const res = await fetchAdminProducts();
        setAvailableProducts(res.data ?? []);
      } catch { /* no-op */ }
    }
  }

  function addItem(product: ProductAdminSummary) {
    setCreateItems((prev) => {
      const existing = prev.find((i) => i.slug === product.slug);
      if (existing) return prev.map((i) => i.slug === product.slug ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { slug: product.slug, name: product.name, sku: product.sku, variantId: product.defaultVariantId, quantity: 1, unitPrice: product.price }];
    });
  }

  function removeItem(slug: string) {
    setCreateItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  function updateItem(slug: string, field: "quantity" | "unitPrice", value: number) {
    setCreateItems((prev) => prev.map((i) => i.slug === slug ? { ...i, [field]: value } : i));
  }

  async function handleCreate() {
    if (!createItems.length) { setCreateError("Agrega al menos un producto."); return; }
    if (!createForm.firstName.trim()) { setCreateError("El nombre del cliente es obligatorio."); return; }
    if (!createForm.line1.trim() || !createForm.city.trim()) { setCreateError("La dirección y ciudad son obligatorias."); return; }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await createBackofficeOrder({
        customer: { firstName: createForm.firstName.trim(), lastName: createForm.lastName.trim(), email: createForm.email.trim(), phone: createForm.phone.trim() },
        address: { line1: createForm.line1.trim(), city: createForm.city.trim() },
        items: createItems,
        initialStatus: createForm.initialStatus,
        notes: createForm.notes.trim() || undefined,
        vendorCode: createForm.vendorCode.trim() || undefined
      });
      setCreateOpen(false);
      setRefreshKey((k) => k + 1);
      // Open the new order's detail
      setSelectedOrderNumber(res.orderNumber);
      setActiveTab("detalle");
      setModalOpen(true);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "No se pudo crear el pedido.");
    } finally {
      setCreateLoading(false);
    }
  }

  const selectedSummary = orders.find((o) => o.orderNumber === selectedOrderNumber) ?? null;

  const allOrdersRows = useMemo(
    () =>
      orders.map((order) => [
        <div key={`${order.orderNumber}-meta`} className="space-y-1.5">
          <div className="font-semibold text-[#132016]">{order.orderNumber}</div>
          <div className="text-xs text-black/45">{formatDateTime(order.createdAt)}</div>
          <button
            type="button"
            onClick={() => { setSelectedOrderNumber(order.orderNumber); setActiveTab("detalle"); setModalOpen(true); }}
            className="inline-flex items-center gap-1 rounded-[8px] bg-[#1a3a2e] px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-[#2d6a4f] active:scale-95"
          >
            Ver detalles →
          </button>
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
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
            {loading ? "Actualizando..." : "Refrescar"}
          </Button>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-[10px] bg-[#1a3a2e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2d6a4f]"
          >
            + Nuevo pedido
          </button>
        </div>
      </div>

      {/* Tabla principal */}
      <AdminDataTable
        title=""
        description=""
        headers={["Pedido", "Cliente", "Total", "Estado", "Pago", "Solicitud manual", "Vendedor"]}
        rows={allOrdersRows}
      />

      {/* Modal crear pedido manual */}
      <Dialog open={createOpen} onClose={() => { if (!createLoading) setCreateOpen(false); }} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo pedido manual</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5">
            {/* Productos */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/45">Productos</p>
              {createItems.length > 0 && (
                <div className="mb-3 space-y-2">
                  {createItems.map((item) => (
                    <div key={item.slug} className="flex items-center gap-3 rounded-[10px] border border-black/10 bg-white px-3 py-2 text-sm">
                      <div className="flex-1">
                        <div className="font-medium text-[#132016]">{item.name}</div>
                        <div className="text-xs text-black/45">{item.sku}</div>
                      </div>
                      <input type="number" min={1} value={item.quantity}
                        onChange={(e) => updateItem(item.slug, "quantity", Math.max(1, Number(e.target.value)))}
                        className="w-14 rounded-[8px] border border-black/15 px-2 py-1 text-center text-sm"
                      />
                      <span className="text-black/45">×</span>
                      <input type="number" min={0} step={0.5} value={item.unitPrice}
                        onChange={(e) => updateItem(item.slug, "unitPrice", Number(e.target.value))}
                        className="w-20 rounded-[8px] border border-black/15 px-2 py-1 text-right text-sm"
                      />
                      <span className="w-16 text-right text-sm font-semibold text-[#132016]">
                        S/ {(item.unitPrice * item.quantity).toFixed(0)}
                      </span>
                      <button type="button" onClick={() => removeItem(item.slug)} className="text-red-400 hover:text-red-600">✕</button>
                    </div>
                  ))}
                  <div className="flex justify-end border-t border-black/10 pt-2 text-sm font-semibold text-[#132016]">
                    Total: S/ {createItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0).toFixed(0)}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1.5 text-[11px] text-black/40">Agregar producto</p>
                <div className="grid gap-1.5 md:grid-cols-2">
                  {availableProducts.filter((p) => p.status === "active" || p.status === "draft").map((product) => (
                    <button key={product.id} type="button" onClick={() => addItem(product)}
                      className="flex items-center justify-between gap-2 rounded-[10px] border border-black/10 bg-[#f9f9f7] px-3 py-2 text-left text-sm transition hover:border-[#52b788] hover:bg-[#f0faf4]"
                    >
                      <div>
                        <div className="font-medium text-[#132016]">{product.name}</div>
                        <div className="text-xs text-black/40">{product.sku} · S/ {product.price}</div>
                      </div>
                      <span className="text-[#52b788]">+</span>
                    </button>
                  ))}
                  {!availableProducts.length && (
                    <p className="col-span-2 text-xs text-black/40">Cargando productos...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Cliente */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/45">Cliente</p>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { key: "firstName", label: "Nombre *", placeholder: "Pedro" },
                  { key: "lastName", label: "Apellido", placeholder: "García" },
                  { key: "phone", label: "WhatsApp / Teléfono", placeholder: "+51 999 000 000" },
                  { key: "email", label: "Email", placeholder: "pedro@example.com" }
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="mb-1 block text-[11px] text-black/50">{label}</label>
                    <input
                      type="text" placeholder={placeholder}
                      value={createForm[key as keyof typeof createForm] as string}
                      onChange={(e) => setCreateForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-[10px] border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/45">Dirección de entrega</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] text-black/50">Dirección *</label>
                  <input type="text" placeholder="Av. Larco 123"
                    value={createForm.line1}
                    onChange={(e) => setCreateForm((f) => ({ ...f, line1: e.target.value }))}
                    className="w-full rounded-[10px] border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-black/50">Distrito / Ciudad *</label>
                  <input type="text" placeholder="Miraflores"
                    value={createForm.city}
                    onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-[10px] border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-black/50">Vendedor (opcional)</label>
                  <input type="text" placeholder="VND-001"
                    value={createForm.vendorCode}
                    onChange={(e) => setCreateForm((f) => ({ ...f, vendorCode: e.target.value }))}
                    className="w-full rounded-[10px] border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                  />
                </div>
              </div>
            </div>

            {/* Estado de pago */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/45">Estado de pago</p>
              <div className="grid gap-2 md:grid-cols-2">
                {([
                  { value: "pending_payment", label: "Pendiente de cobro", desc: "El cliente aún no ha pagado" },
                  { value: "paid", label: "Ya cobrado", desc: "El pago ya fue recibido y confirmado" }
                ] as const).map(({ value, label, desc }) => (
                  <button key={value} type="button" onClick={() => setCreateForm((f) => ({ ...f, initialStatus: value }))}
                    className={`rounded-[12px] border-2 p-3 text-left transition ${
                      createForm.initialStatus === value
                        ? "border-[#52b788] bg-[#f0faf4]"
                        : "border-black/10 bg-white hover:border-black/20"
                    }`}
                  >
                    <div className="text-sm font-semibold text-[#132016]">{label}</div>
                    <div className="text-xs text-black/50">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div>
              <label className="mb-1 block text-[11px] text-black/50">Notas internas (opcional)</label>
              <textarea placeholder="Pedido por WhatsApp, entregar en horario de tarde..."
                value={createForm.notes}
                onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded-[10px] border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
              />
            </div>

            {createError && <p className="text-sm text-red-600">{createError}</p>}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancelar</Button>
            <button
              type="button" onClick={handleCreate} disabled={createLoading || !createItems.length}
              className="rounded-[10px] bg-[#1a3a2e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d6a4f] disabled:opacity-50"
            >
              {createLoading ? "Creando..." : "Crear pedido"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {actionError && (
              <p className="mr-auto text-sm text-red-600">{actionError}</p>
            )}
            <button
              type="button"
              onClick={() => { setDeleteConfirmText(""); setDeleteConfirmOpen(true); }}
              disabled={!!actionLoading || !selectedOrder}
              className="mr-auto rounded-[9px] border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
            >
              Eliminar pedido
            </button>
            {selectedOrder?.manualRequest?.status === "under_review" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={!!actionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleReject}
                  disabled={!!actionLoading}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  {actionLoading === "reject" ? "Rechazando..." : "Rechazar"}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={!!actionLoading}
                  className="bg-[#1a3a2e] text-white hover:bg-[#2d6a4f]"
                >
                  {actionLoading === "approve" ? "Aprobando..." : "Aprobar pago ✓"}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cerrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirmación de eliminación */}
      <Dialog open={deleteConfirmOpen} onClose={() => { if (!deleteLoading) setDeleteConfirmOpen(false); }} size="sm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar pedido</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm text-[#132016]">
              Estás a punto de eliminar permanentemente el pedido <span className="font-semibold">{selectedOrderNumber}</span>. Esta acción no se puede deshacer.
            </p>
            <div>
              <label className="mb-1.5 block text-xs text-black/50">
                Escribe <span className="font-semibold text-red-600">eliminar</span> para confirmar
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="eliminar"
                autoComplete="off"
                className="w-full rounded-[10px] border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-red-400"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => { void handleDelete(); }}
              disabled={deleteLoading || deleteConfirmText !== "eliminar"}
              className="rounded-[10px] bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-40"
            >
              {deleteLoading ? "Eliminando..." : "Eliminar definitivamente"}
            </button>
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
