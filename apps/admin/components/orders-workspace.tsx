"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AdminDataTable, Badge, Button, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator, StatusBadge, TimelinePedido } from "@huelegood/ui";
import { CHECKOUT_DOCUMENT_TYPE_OPTIONS, CrmStage, type AdminOrderDetail, type AdminOrderSummary, type ManualReviewActionInput, type OrderStatus, type PaymentStatus, type ManualPaymentRequestStatus, type ProductAdminSummary, type VendorSummary } from "@huelegood/shared";
import { approveManualPaymentRequest, confirmOnlinePayment, createBackofficeOrder, deleteOrder, fetchAdminProducts, fetchOrder, fetchOrders, fetchVendors, registerAdminManualPayment, rejectManualPaymentRequest, resendOrderApprovalEmail, transitionOrderStatus } from "../lib/api";

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

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getProductSearchRank(product: ProductAdminSummary, query: string) {
  const name = normalizeSearchValue(product.name);
  const sku = normalizeSearchValue(product.sku);
  const slug = normalizeSearchValue(product.slug);
  const category = normalizeSearchValue(product.categoryName ?? "");

  if (name.startsWith(query)) return 0;
  if (sku.startsWith(query)) return 1;
  if (slug.startsWith(query)) return 2;
  if (category.startsWith(query)) return 3;
  if (name.includes(query)) return 4;
  if (sku.includes(query)) return 5;
  if (slug.includes(query)) return 6;
  if (category.includes(query)) return 7;
  return 99;
}

function documentTypeLabel(value?: string) {
  return CHECKOUT_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? "Documento";
}

function orderTone(status?: OrderStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (!status) return "neutral";
  if (status === "paid" || status === "confirmed" || status === "completed") return "success";
  if (status === "cancelled" || status === "refunded" || status === "expired") return "danger";
  if (status === "payment_under_review" || status === "pending_payment") return "warning";
  return "info";
}

function paymentTone(status?: PaymentStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (!status) return "neutral";
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

function orderStatusLabel(status?: OrderStatus) {
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
  return status ? labels[status] : "Sin estado";
}

function paymentStatusLabel(status?: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    initiated: "Iniciado",
    pending: "Pendiente",
    authorized: "Autorizado",
    paid: "Pagado",
    failed: "Fallido",
    expired: "Expirado"
  };
  return status ? labels[status] : "Sin estado";
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

function formatStageLabel(stage?: string) {
  if (!stage) {
    return "Sin etapa";
  }

  const labels: Record<string, string> = {
    [CrmStage.ReadyForFollowUp]: "Listo para seguimiento",
    [CrmStage.FollowUp]: "Seguimiento en curso",
    [CrmStage.Closed]: "Cerrado"
  };

  return labels[stage] ?? stage.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function stageTone(stage?: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (!stage) {
    return "neutral";
  }

  if (stage === CrmStage.Closed) {
    return "success";
  }

  if (stage === CrmStage.ReadyForFollowUp) {
    return "warning";
  }

  return "info";
}

function crmFollowUpLabel(stage?: CrmStage) {
  if (stage === CrmStage.ReadyForFollowUp) {
    return "Listo para contactar al cliente";
  }

  if (stage === CrmStage.FollowUp) {
    return "Seguimiento activo";
  }

  if (stage === CrmStage.Closed) {
    return "Gestión cerrada";
  }

  return "Pendiente de resolución";
}

function hasOrderDetailPayload(order: unknown): order is AdminOrderDetail {
  if (!order || typeof order !== "object") {
    return false;
  }

  const candidate = order as Partial<AdminOrderDetail>;
  return (
    typeof candidate.orderNumber === "string" &&
    typeof candidate.orderStatus === "string" &&
    typeof candidate.paymentStatus === "string" &&
    Array.isArray(candidate.items) &&
    Array.isArray(candidate.statusHistory) &&
    typeof candidate.customer === "object" &&
    candidate.customer !== null &&
    typeof candidate.address === "object" &&
    candidate.address !== null &&
    typeof candidate.payment === "object" &&
    candidate.payment !== null
  );
}

function availableOperationalStatuses(order?: AdminOrderDetail | null): OrderStatus[] {
  if (!order?.orderStatus) {
    return [];
  }

  const transitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    draft: ["pending_payment" as OrderStatus, "cancelled" as OrderStatus],
    pending_payment: ["payment_under_review" as OrderStatus, "cancelled" as OrderStatus, "expired" as OrderStatus],
    payment_under_review: ["cancelled" as OrderStatus],
    paid: ["confirmed" as OrderStatus, "refunded" as OrderStatus],
    confirmed: ["preparing" as OrderStatus, "shipped" as OrderStatus, "delivered" as OrderStatus, "completed" as OrderStatus, "refunded" as OrderStatus],
    preparing: ["shipped" as OrderStatus, "delivered" as OrderStatus, "completed" as OrderStatus, "refunded" as OrderStatus],
    shipped: ["delivered" as OrderStatus, "completed" as OrderStatus, "refunded" as OrderStatus],
    delivered: ["completed" as OrderStatus, "refunded" as OrderStatus]
  };

  return transitions[order.orderStatus] ?? [];
}

export function OrdersWorkspace() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"detalle" | "timeline">("detalle");
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | "resend" | "transition" | "manual_payment" | "online_payment" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [approveSendEmailNow, setApproveSendEmailNow] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [nextOrderStatus, setNextOrderStatus] = useState<OrderStatus | "">("");
  const [transitionNote, setTransitionNote] = useState("Actualización operativa desde backoffice.");
  const [manualPaymentAmount, setManualPaymentAmount] = useState("");
  const [manualPaymentReference, setManualPaymentReference] = useState("");
  const [manualPaymentNotes, setManualPaymentNotes] = useState("Pago confirmado manualmente desde backoffice.");

  // Create order state
  const [createOpen, setCreateOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<ProductAdminSummary[]>([]);
  const [availableVendors, setAvailableVendors] = useState<VendorSummary[]>([]);
  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    line1: "", city: "",
    notes: "", vendorCode: "",
    initialStatus: "pending_payment" as "paid" | "pending_payment"
  });
  const [createItems, setCreateItems] = useState<Array<{ slug: string; name: string; sku: string; variantId?: string; quantity: number; unitPrice: number }>>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createOptionsLoading, setCreateOptionsLoading] = useState(false);
  const [createOptionsNotice, setCreateOptionsNotice] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const activeOrder = selectedOrder?.orderNumber === selectedOrderNumber ? selectedOrder : null;

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
    if (!orderNumber) {
      setSelectedOrder(null);
      setDetailError(null);
      return;
    }
    const orderNumberToLoad = orderNumber;

    let active = true;

    async function loadSelectedOrder() {
      setDetailLoading(true);
      setSelectedOrder(null);
      setDetailError(null);
      try {
        const response = await fetchOrder(orderNumberToLoad);
        if (active) {
          if (!hasOrderDetailPayload(response.data)) {
            throw new Error(`El detalle del pedido ${orderNumberToLoad} llegó incompleto desde el API.`);
          }
          setSelectedOrder(response.data);
          setActionError(null);
        }
      } catch (fetchError) {
        if (active) {
          setSelectedOrder(null);
          setDetailError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar el detalle del pedido.");
        }
      } finally {
        if (active) setDetailLoading(false);
      }
    }

    void loadSelectedOrder();
    return () => { active = false; };
  }, [refreshKey, selectedOrderNumber]);

  useEffect(() => {
    if (!approveConfirmOpen) {
      return;
    }

    setApproveSendEmailNow(true);
  }, [approveConfirmOpen, selectedOrderNumber]);

  useEffect(() => {
    setActionNotice(null);
    setActionError(null);
  }, [selectedOrderNumber]);

  useEffect(() => {
    const available = availableOperationalStatuses(activeOrder);
    setNextOrderStatus(available[0] ?? "");
    setTransitionNote("Actualización operativa desde backoffice.");
    setManualPaymentAmount(activeOrder ? String(activeOrder.total) : "");
    setManualPaymentReference(activeOrder?.providerReference ?? "");
    setManualPaymentNotes("Pago confirmado manualmente desde backoffice.");
  }, [activeOrder]);

  const reviewCount = useMemo(
    () => orders.filter((o) => o.orderStatus === "payment_under_review" || o.manualStatus === "under_review").length,
    [orders]
  );
  const selectedOrderStage = activeOrder?.crmStage;
  const availableStatuses = useMemo(() => availableOperationalStatuses(activeOrder), [activeOrder]);
  const canRegisterManualPayment = Boolean(activeOrder && activeOrder.paymentStatus !== "paid" && !activeOrder.manualRequest);
  const canConfirmOnlinePayment = Boolean(activeOrder && activeOrder.paymentMethod === "openpay" && activeOrder.paymentStatus !== "paid");
  const selectableProducts = availableProducts.filter((product) => product.status === "active" || product.status === "draft");
  const selectedQuantityBySlug = useMemo(
    () => new Map(createItems.map((item) => [item.slug, item.quantity])),
    [createItems]
  );
  const filteredSelectableProducts = useMemo(() => {
    const query = normalizeSearchValue(productSearch);
    const sortedProducts = [...selectableProducts].sort((left, right) => left.name.localeCompare(right.name, "es"));

    if (!query) {
      return sortedProducts;
    }

    return sortedProducts
      .filter((product) => getProductSearchRank(product, query) < 99)
      .sort((left, right) => {
        const rankDifference = getProductSearchRank(left, query) - getProductSearchRank(right, query);
        if (rankDifference !== 0) {
          return rankDifference;
        }

        return left.name.localeCompare(right.name, "es");
      });
  }, [productSearch, selectableProducts]);
  const visibleSelectableProducts = useMemo(
    () => filteredSelectableProducts.slice(0, productSearch.trim() ? 12 : 8),
    [filteredSelectableProducts, productSearch]
  );
  const hiddenSelectableProductsCount = Math.max(filteredSelectableProducts.length - visibleSelectableProducts.length, 0);
  const createItemsCount = useMemo(
    () => createItems.reduce((sum, item) => sum + item.quantity, 0),
    [createItems]
  );
  const createItemsTotal = useMemo(
    () => createItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [createItems]
  );

  function openApproveConfirm() {
    if (!activeOrder?.manualRequest) return;
    setActionError(null);
    setActionNotice(null);
    setApproveConfirmOpen(true);
  }

  async function handleApproveConfirmed() {
    if (!activeOrder?.manualRequest) return;

    setActionLoading("approve");
    setActionError(null);

    try {
      const payload: ManualReviewActionInput = {
        reviewer: "admin",
        notes: approveSendEmailNow
          ? "Aprobado desde backoffice. Email de confirmación confirmado por operación."
          : "Aprobado desde backoffice.",
        sendEmailNow: approveSendEmailNow
      };

      const response = await approveManualPaymentRequest(activeOrder.manualRequest.id, payload);

      setApproveConfirmOpen(false);
      setActionNotice(response.message);
      setRefreshKey((k) => k + 1);

      if (response.status === "queued") {
        window.setTimeout(() => setRefreshKey((k) => k + 1), 1200);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo aprobar. Intenta de nuevo.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!activeOrder?.manualRequest) return;
    setActionLoading("reject");
    setActionError(null);
    setActionNotice(null);
    try {
      await rejectManualPaymentRequest(activeOrder.manualRequest.id, { reviewer: "admin", notes: "Rechazado desde backoffice." });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo rechazar. Intenta de nuevo.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResendApprovalEmail() {
    if (!activeOrder?.manualRequest || activeOrder.manualRequest.status !== "approved") {
      return;
    }

    setActionLoading("resend");
    setActionError(null);
    setActionNotice(null);

    try {
      const response = await resendOrderApprovalEmail(activeOrder.orderNumber);
      setActionNotice(response.message);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo reenviar el email al cliente.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!selectedOrderNumber) return;
    setDeleteLoading(true);
    try {
      await deleteOrder(selectedOrderNumber);
      setActionNotice(null);
      setApproveConfirmOpen(false);
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

  async function handleTransitionStatus() {
    if (!activeOrder || !nextOrderStatus) {
      return;
    }

    setActionLoading("transition");
    setActionError(null);
    setActionNotice(null);

    try {
      const response = await transitionOrderStatus(activeOrder.orderNumber, {
        status: nextOrderStatus,
        actor: "admin",
        note: transitionNote.trim() || "Actualización operativa desde backoffice."
      });
      setActionNotice(response.message);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar el estado del pedido.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRegisterManualPayment() {
    if (!activeOrder) {
      return;
    }

    setActionLoading("manual_payment");
    setActionError(null);
    setActionNotice(null);

    try {
      const response = await registerAdminManualPayment(activeOrder.orderNumber, {
        reviewer: "admin",
        amount: Number(manualPaymentAmount),
        reference: manualPaymentReference.trim() || undefined,
        notes: manualPaymentNotes.trim() || undefined
      });
      setActionNotice(response.message);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo registrar el pago manual.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirmOnlinePayment() {
    if (!activeOrder) {
      return;
    }

    setActionLoading("online_payment");
    setActionError(null);
    setActionNotice(null);

    try {
      const response = await confirmOnlinePayment(activeOrder.orderNumber, {
        reviewer: "admin",
        reference: manualPaymentReference.trim() || undefined,
        notes: "Conciliacion manual de pago online desde backoffice."
      });
      setActionNotice(response.message);
      setRefreshKey((current) => current + 1);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo confirmar el pago online.");
    } finally {
      setActionLoading(null);
    }
  }

  async function openCreateModal() {
    setCreateForm({ firstName: "", lastName: "", email: "", phone: "", line1: "", city: "", notes: "", vendorCode: "", initialStatus: "pending_payment" });
    setCreateItems([]);
    setCreateError(null);
    setCreateOptionsNotice(null);
    setProductSearch("");
    setCreateOpen(true);
    const shouldLoadProducts = availableProducts.length === 0;
    const shouldLoadVendors = availableVendors.length === 0;

    if (!shouldLoadProducts && !shouldLoadVendors) {
      return;
    }

    setCreateOptionsLoading(true);

    try {
      const [productsResponse, vendorsResponse] = await Promise.allSettled([
        shouldLoadProducts ? fetchAdminProducts() : Promise.resolve({ data: availableProducts }),
        shouldLoadVendors ? fetchVendors() : Promise.resolve({ data: availableVendors })
      ]);

      const notices: string[] = [];

      if (productsResponse.status === "fulfilled") {
        setAvailableProducts(productsResponse.value.data ?? []);
      } else {
        setAvailableProducts([]);
        notices.push("No pudimos cargar productos.");
      }

      if (vendorsResponse.status === "fulfilled") {
        setAvailableVendors(vendorsResponse.value.data ?? []);
      } else {
        setAvailableVendors([]);
        notices.push("No pudimos cargar vendedores. Puedes continuar sin vendedor asociado.");
      }

      setCreateOptionsNotice(notices.length ? notices.join(" ") : null);
    } finally {
      setCreateOptionsLoading(false);
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
          <div className="text-xs text-black/45">
            {order.salesChannel === "manual" ? "Canal manual" : "Canal web"} · {order.paymentMethod === "manual" ? "Pago manual" : "Openpay"}
          </div>
        </div>,
        formatCurrency(order.total),
        <StatusBadge key={`${order.orderNumber}-status`} tone={orderTone(order.orderStatus)} label={orderStatusLabel(order.orderStatus)} />,
        <StatusBadge key={`${order.orderNumber}-payment`} tone={paymentTone(order.paymentStatus)} label={paymentStatusLabel(order.paymentStatus)} />,
        order.manualStatus ? (
          <StatusBadge key={`${order.orderNumber}-manual`} tone={manualTone(order.manualStatus)} label={manualStatusLabel(order.manualStatus)} />
        ) : <span key={`${order.orderNumber}-manual`} className="text-xs text-black/35">—</span>,
        order.vendorName ? `${order.vendorName}${order.vendorCode ? ` (${order.vendorCode})` : ""}` : order.vendorCode ?? <span className="text-black/35">—</span>
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
              <div>
                <p className="mb-1.5 text-[11px] text-black/40">Buscar y agregar producto</p>
                <div className="overflow-hidden rounded-[16px] border border-black/10 bg-[#fbfbf8] p-2.5">
                  {createItems.length > 0 ? (
                    <div className="mb-3 rounded-[12px] border border-[#d9e9df] bg-white p-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2d6a4f]">Seleccionados</p>
                          <p className="mt-1 text-xs text-black/50">
                            {createItems.length} producto(s) distintos · {createItemsCount} item(s) en el pedido
                          </p>
                        </div>
                        <div className="rounded-full bg-[#eef7f1] px-3 py-1 text-xs font-semibold text-[#2d6a4f]">
                          Total S/ {createItemsTotal.toFixed(0)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {createItems.map((item) => (
                          <div key={item.slug} className="flex items-center gap-3 rounded-[10px] border border-black/10 bg-[#fbfbf8] px-3 py-2 text-sm">
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-[#132016]">{item.name}</div>
                              <div className="text-xs text-black/45">{item.sku}</div>
                            </div>
                            <input type="number" min={1} value={item.quantity}
                              onChange={(e) => updateItem(item.slug, "quantity", Math.max(1, Number(e.target.value)))}
                              className="w-14 rounded-[8px] border border-black/15 bg-white px-2 py-1 text-center text-sm"
                            />
                            <span className="text-black/45">×</span>
                            <input type="number" min={0} step={0.5} value={item.unitPrice}
                              onChange={(e) => updateItem(item.slug, "unitPrice", Number(e.target.value))}
                              className="w-20 rounded-[8px] border border-black/15 bg-white px-2 py-1 text-right text-sm"
                            />
                            <span className="w-16 text-right text-sm font-semibold text-[#132016]">
                              S/ {(item.unitPrice * item.quantity).toFixed(0)}
                            </span>
                            <button type="button" onClick={() => removeItem(item.slug)} className="text-red-400 transition hover:text-red-600">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8679]">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <circle cx="11" cy="11" r="7" />
                        <path d="m20 20-3.5-3.5" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && visibleSelectableProducts[0]) {
                          event.preventDefault();
                          addItem(visibleSelectableProducts[0]);
                        }
                      }}
                      placeholder="Busca por nombre, SKU o slug"
                      className="w-full rounded-[10px] border border-black/10 bg-white pl-9 pr-3 py-2 text-sm outline-none transition focus:border-[#52b788] focus:ring-2 focus:ring-[#52b788]/15"
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-black/45">
                    <span>
                      {createOptionsLoading
                        ? "Cargando catálogo..."
                        : productSearch.trim()
                          ? `${filteredSelectableProducts.length} resultado(s)`
                          : `${selectableProducts.length} producto(s) disponibles`}
                    </span>
                    {hiddenSelectableProductsCount > 0 ? (
                      <span>Mostrando {visibleSelectableProducts.length}; sigue escribiendo para refinar</span>
                    ) : null}
                  </div>

                  <div className="mt-2 overflow-hidden rounded-[12px] border border-black/8 bg-white">
                    <div className="max-h-56 space-y-1.5 overflow-y-auto p-2 pr-1">
                    {createOptionsLoading ? (
                      <p className="rounded-[10px] border border-dashed border-black/10 bg-white px-3 py-3 text-xs text-black/45">
                        Cargando productos...
                      </p>
                    ) : null}
                    {!createOptionsLoading && !selectableProducts.length ? (
                      <p className="rounded-[10px] border border-dashed border-black/10 bg-white px-3 py-3 text-xs text-black/45">
                        {createOptionsNotice?.includes("productos")
                          ? "No pudimos cargar productos."
                          : "No hay productos disponibles todavía."}
                      </p>
                    ) : null}
                    {!createOptionsLoading && selectableProducts.length > 0 && !visibleSelectableProducts.length ? (
                      <p className="rounded-[10px] border border-dashed border-black/10 bg-white px-3 py-3 text-xs text-black/45">
                        No encontramos coincidencias para esa búsqueda.
                      </p>
                    ) : null}
                    {visibleSelectableProducts.map((product) => {
                      const selectedQuantity = selectedQuantityBySlug.get(product.slug) ?? 0;

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addItem(product)}
                          className="flex w-full items-center justify-between gap-3 rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-left text-sm transition hover:border-[#52b788] hover:bg-[#f0faf4]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-[#132016]">{product.name}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/45">
                              <span>{product.sku}</span>
                              <span>{product.categoryName ?? "Sin categoría"}</span>
                              <span>S/ {product.price}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedQuantity > 0 ? (
                              <span className="rounded-full bg-[#e8f4ec] px-2 py-1 text-[11px] font-medium text-[#2d6a4f]">
                                x{selectedQuantity} en pedido
                              </span>
                            ) : null}
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef7f1] text-[#52b788]">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path d="M12 5v14" />
                                <path d="M5 12h14" />
                              </svg>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                  {createOptionsNotice ? (
                    <p className="mt-2 px-1 text-xs text-amber-700">{createOptionsNotice}</p>
                  ) : null}
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
                  <select
                    value={createForm.vendorCode}
                    onChange={(e) => setCreateForm((f) => ({ ...f, vendorCode: e.target.value }))}
                    className="w-full rounded-[10px] border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-[#52b788]"
                  >
                    <option value="">Sin vendedor asociado</option>
                    {availableVendors
                      .filter((vendor) => vendor.status === "active")
                      .map((vendor) => (
                        <option key={vendor.code} value={vendor.code}>
                          {vendor.code} · {vendor.name}
                        </option>
                      ))}
                  </select>
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
      <Dialog open={modalOpen} onClose={() => { setApproveConfirmOpen(false); setActionNotice(null); setModalOpen(false); }} size="xl">
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
                  {tab === "detalle" ? "Detalle" : `Timeline${activeOrder?.statusHistory?.length ? ` (${activeOrder.statusHistory.length})` : ""}`}
                </button>
              ))}
            </div>
          </DialogHeader>

          <DialogBody>
            {detailLoading ? (
              <p className="text-sm text-black/55">Cargando detalle del pedido...</p>
            ) : activeOrder && activeTab === "detalle" ? (
              <div className="space-y-4">
                {/* Resumen de badges */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={orderTone(activeOrder.orderStatus)} label={orderStatusLabel(activeOrder.orderStatus)} />
                    <StatusBadge tone={paymentTone(activeOrder.paymentStatus)} label={paymentStatusLabel(activeOrder.paymentStatus)} />
                    {activeOrder.manualStatus && (
                      <StatusBadge tone={manualTone(activeOrder.manualStatus)} label={manualStatusLabel(activeOrder.manualStatus)} />
                    )}
                    {selectedOrderStage && (
                      <StatusBadge tone={stageTone(selectedOrderStage)} label={formatStageLabel(selectedOrderStage)} />
                    )}
                  </div>
                  <span className="text-lg font-semibold text-[#132016]">{formatCurrency(activeOrder.total)}</span>
                </div>

                {/* Cliente + Envío */}
                <div className="grid gap-3 md:grid-cols-2">
                  <DetailBlock label="Cliente">
                    <p className="font-medium text-[#132016]">{activeOrder.customer.firstName} {activeOrder.customer.lastName}</p>
                    <p className="text-sm text-black/60">{activeOrder.customer.email}</p>
                    <p className="text-sm text-black/60">{activeOrder.customer.phone}</p>
                    {activeOrder.customer.documentNumber ? (
                      <p className="text-sm text-black/60">{documentTypeLabel(activeOrder.customer.documentType)}: {activeOrder.customer.documentNumber}</p>
                    ) : null}
                  </DetailBlock>
                  <DetailBlock label="Envío">
                    <p className="font-medium text-[#132016]">{activeOrder.address.recipientName}</p>
                    <p className="text-sm text-black/60">{activeOrder.address.line1}</p>
                    {activeOrder.address.line2 ? <p className="text-sm text-black/60">{activeOrder.address.line2}</p> : null}
                    <p className="text-sm text-black/60">{activeOrder.address.city}, {activeOrder.address.region}</p>
                    <p className="text-sm text-black/60">{activeOrder.address.countryCode}</p>
                    {activeOrder.address.deliveryMode === "province_shalom_pickup" ? (
                      <>
                        <p className="text-sm text-black/60">Modalidad: Provincia por Shalom</p>
                        <p className="text-sm text-black/60">Sucursal: {activeOrder.address.agencyName ?? "Sin sucursal registrada"}</p>
                        <p className="text-sm text-black/60">Flete: pago al recoger</p>
                      </>
                    ) : null}
                  </DetailBlock>
                </div>

                {/* Items */}
                <DetailBlock label={`Items · ${activeOrder.items.length}`}>
                  <div className="space-y-2">
                    {activeOrder.items.map((item) => (
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
                  <div className="flex justify-between"><span className="text-black/55">Subtotal</span><span>{formatCurrency(activeOrder.subtotal)}</span></div>
                  {activeOrder.discount > 0 && (
                    <div className="flex justify-between"><span className="text-black/55">Descuento</span><span>-{formatCurrency(activeOrder.discount)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-black/55">Envío</span><span>{formatCurrency(activeOrder.shipping)}</span></div>
                  <Separator />
                  <div className="flex justify-between font-semibold"><span>Total</span><span>{formatCurrency(activeOrder.total)}</span></div>
                </div>

                {/* Pago + referencia */}
                <div className="grid gap-3 md:grid-cols-4 text-sm">
                  <SummaryTile label="Proveedor" value={activeOrder.payment.provider === "manual" ? "Pago manual" : "Openpay"} />
                  <SummaryTile label="Canal" value={activeOrder.salesChannel === "manual" ? "Manual" : "Web"} />
                  <SummaryTile label="Referencia" value={activeOrder.providerReference ?? "—"} />
                  <SummaryTile label="Vendedor" value={activeOrder.vendorName ? `${activeOrder.vendorName}${activeOrder.vendorCode ? ` (${activeOrder.vendorCode})` : ""}` : activeOrder.vendorCode ?? "—"} />
                </div>

                <div className="grid gap-3 md:grid-cols-4 text-sm">
                  <SummaryTile label="Estado operativo" value={orderStatusLabel(activeOrder.orderStatus)} />
                  <SummaryTile label="Etapa CRM" value={formatStageLabel(activeOrder.crmStage)} />
                  <SummaryTile label="Seguimiento" value={crmFollowUpLabel(activeOrder.crmStage)} />
                  <SummaryTile label="Venta confirmada" value={activeOrder.confirmedAt ? formatDateTime(activeOrder.confirmedAt) : "Pendiente"} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <DetailBlock label="Transición operativa">
                    <div className="space-y-3">
                      <select
                        value={nextOrderStatus}
                        onChange={(event) => setNextOrderStatus(event.target.value as OrderStatus | "")}
                        className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#132016]"
                        disabled={!availableStatuses.length || !!actionLoading}
                      >
                        {availableStatuses.length ? null : <option value="">Sin transición disponible</option>}
                        {availableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {orderStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={transitionNote}
                        onChange={(event) => setTransitionNote(event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#132016]"
                        placeholder="Nota operativa"
                      />
                      <Button onClick={() => void handleTransitionStatus()} disabled={!nextOrderStatus || !!actionLoading}>
                        {actionLoading === "transition" ? "Actualizando..." : "Aplicar transición"}
                      </Button>
                    </div>
                  </DetailBlock>

                  <DetailBlock label="Pago manual directo">
                    <div className="space-y-3">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={manualPaymentAmount}
                        onChange={(event) => setManualPaymentAmount(event.target.value)}
                        className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#132016]"
                        placeholder="Monto"
                      />
                      <input
                        type="text"
                        value={manualPaymentReference}
                        onChange={(event) => setManualPaymentReference(event.target.value)}
                        className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#132016]"
                        placeholder="Referencia u operación"
                      />
                      <textarea
                        value={manualPaymentNotes}
                        onChange={(event) => setManualPaymentNotes(event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[#132016]"
                        placeholder="Notas del registro manual"
                      />
                      <Button onClick={() => void handleRegisterManualPayment()} disabled={!canRegisterManualPayment || !!actionLoading}>
                        {actionLoading === "manual_payment" ? "Registrando..." : "Registrar pago manual"}
                      </Button>
                      {!canRegisterManualPayment ? (
                        <p className="text-xs text-black/45">
                          Disponible sólo para pedidos impagos sin solicitud manual en revisión.
                        </p>
                      ) : null}
                    </div>
                  </DetailBlock>
                </div>

                {activeOrder.paymentMethod === "openpay" ? (
                  <DetailBlock label="Conciliación pago online">
                    <div className="space-y-3">
                      <p className="text-sm text-black/55">
                        Usa esta acción cuando el pedido web ya tiene validación operativa del cobro online y falta consolidar venta, stock y reportes.
                      </p>
                      <Button onClick={() => void handleConfirmOnlinePayment()} disabled={!canConfirmOnlinePayment || !!actionLoading}>
                        {actionLoading === "online_payment" ? "Confirmando..." : "Confirmar pago online"}
                      </Button>
                      {!canConfirmOnlinePayment ? (
                        <p className="text-xs text-black/45">
                          Disponible sólo para pedidos `openpay` aún no conciliados como pagados.
                        </p>
                      ) : null}
                    </div>
                  </DetailBlock>
                ) : null}

                {/* Solicitud manual con comprobante */}
                {activeOrder.manualRequest ? (
                  <div className="space-y-3 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-amber-950">Solicitud manual</p>
                      <StatusBadge tone={manualTone(activeOrder.manualRequest.status)} label={manualStatusLabel(activeOrder.manualRequest.status)} />
                    </div>

                    {activeOrder.manualRequest.evidenceImageUrl ? (
                      <div className="space-y-2">
                        <div className="overflow-hidden rounded-[10px] border border-amber-200 bg-white">
                          <img
                            src={activeOrder.manualRequest.evidenceImageUrl}
                            alt="Comprobante de pago"
                            className="max-h-64 w-full object-contain"
                          />
                        </div>
                        <a
                          href={activeOrder.manualRequest.evidenceImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-amber-800 underline underline-offset-2 hover:text-amber-950"
                        >
                          Ver imagen completa →
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-950/70">
                        Referencia: {activeOrder.manualRequest.evidenceReference ?? "Sin comprobante"}
                      </p>
                    )}

                    {activeOrder.manualRequest.evidenceNotes ? (
                      <p className="text-sm text-amber-950/70">{activeOrder.manualRequest.evidenceNotes}</p>
                    ) : null}

                    {activeOrder.manualRequest.reviewer ? (
                      <p className="text-xs text-amber-900/60">
                        Revisado por {activeOrder.manualRequest.reviewer} · {activeOrder.manualRequest.reviewedAt}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-900/60">Pendiente de decisión.</p>
                    )}

                    {activeOrder.manualRequest.status === "approved" && activeOrder.customer.email ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { void handleResendApprovalEmail(); }}
                          disabled={!!actionLoading}
                          className="rounded-[9px] border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100 disabled:opacity-40"
                        >
                          {actionLoading === "resend" ? "Reenviando email..." : "Reenviar email al cliente"}
                        </button>
                        <span className="text-xs text-amber-900/60">{activeOrder.customer.email}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : activeOrder && activeTab === "timeline" ? (
              <TimelinePedido items={activeOrder.statusHistory} />
            ) : detailError ? (
              <p className="text-sm text-red-600">{detailError}</p>
            ) : (
              <p className="text-sm text-black/55">Selecciona un pedido para ver su detalle.</p>
            )}
          </DialogBody>

          <DialogFooter>
            <div className="mr-auto space-y-1">
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}
              {actionNotice && <p className="text-sm text-[#2d6a4f]">{actionNotice}</p>}
            </div>
            <button
              type="button"
              onClick={() => { setDeleteConfirmText(""); setDeleteConfirmOpen(true); }}
              disabled={!!actionLoading || !activeOrder}
              className="mr-auto rounded-[9px] border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
            >
              Eliminar pedido
            </button>
            {activeOrder?.manualRequest?.status === "under_review" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => { setApproveConfirmOpen(false); setActionNotice(null); setModalOpen(false); }}
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
                  onClick={openApproveConfirm}
                  disabled={!!actionLoading}
                  className="bg-[#1a3a2e] text-white hover:bg-[#2d6a4f]"
                >
                  {actionLoading === "approve" ? "Aprobando..." : "Aprobar pago ✓"}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => { setApproveConfirmOpen(false); setActionNotice(null); setModalOpen(false); }}>Cerrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveConfirmOpen} onClose={() => { if (!actionLoading) setApproveConfirmOpen(false); }} size="sm">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar aprobación</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <p className="text-sm leading-6 text-[#132016]">
              Vas a aprobar el pago manual de <span className="font-semibold">{activeOrder?.orderNumber}</span> y dejar visible la nueva etapa operativa del pedido.
            </p>

            <div className="rounded-[1.25rem] border border-black/10 bg-white p-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={approveSendEmailNow}
                  onChange={(event) => setApproveSendEmailNow(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-black/20 text-[#1a3a2e] focus:ring-[#1a3a2e]"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-[#132016]">Enviar email al cliente ahora</span>
                  <span className="block text-xs text-black/55">
                    La confirmación por correo se dispara junto con la aprobación operativa.
                  </span>
                </span>
              </label>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled
                className="rounded-[10px] border border-dashed border-black/20 bg-black/[0.03] px-4 py-3 text-left text-sm font-medium text-black/45"
              >
                WhatsApp
                <span className="mt-1 block text-xs font-normal text-black/35">Próximamente</span>
              </button>
              <div className="rounded-[10px] border border-[#1a3a2e]/15 bg-[#f2f8f4] px-4 py-3 text-sm text-[#1a3a2e]">
                La aprobación actualizará el pedido a la etapa operativa indicada por el API.
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setApproveConfirmOpen(false)} disabled={!!actionLoading}>
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => { void handleApproveConfirmed(); }}
              disabled={!!actionLoading}
              className="rounded-[10px] bg-[#1a3a2e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#2d6a4f] disabled:opacity-50"
            >
              {actionLoading === "approve"
                ? "Aprobando..."
                : approveSendEmailNow
                  ? "Confirmar y aprobar con email"
                  : "Confirmar y aprobar"}
            </button>
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
