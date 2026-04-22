"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminDataTable, Badge, Button, StatusBadge } from "@huelegood/ui";
import { type AdminDispatchOrderSummary, type OrderStatus } from "@huelegood/shared";
import { fetchDispatchOrders } from "../lib/api";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function orderTone(status: OrderStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "confirmed" || status === "completed") return "success";
  if (status === "cancelled" || status === "refunded" || status === "expired") return "danger";
  if (status === "preparing" || status === "shipped") return "warning";
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

function deliveryLabel(order: AdminDispatchOrderSummary) {
  if (order.deliveryMode === "province_shalom_pickup") {
    return `Shalom${order.agencyName ? ` · ${order.agencyName}` : ""}`;
  }

  if (order.carrier) {
    return order.carrier === "shalom" ? "Shalom" : "Olva Courier";
  }

  return "Entrega estándar";
}

function openDispatchLabel(orderNumber: string) {
  const href = `/pedidos/${encodeURIComponent(orderNumber)}/etiqueta?from=despachos`;
  const nextWindow = window.open(href, "_blank", "noopener,noreferrer");

  if (!nextWindow) {
    window.location.href = href;
  }
}

export function DispatchesWorkspace() {
  const [orders, setOrders] = useState<AdminDispatchOrderSummary[]>([]);
  const [filter, setFilter] = useState<"all" | "assigned" | "suggested" | "exception">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDispatches() {
      setLoading(true);

      try {
        const response = await fetchDispatchOrders();
        if (!active) {
          return;
        }

        setOrders(response.data ?? []);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setOrders([]);
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar la cola de despachos.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDispatches();
    return () => {
      active = false;
    };
  }, []);

  const pickupCount = useMemo(
    () => orders.filter((order) => order.deliveryMode === "province_shalom_pickup").length,
    [orders]
  );
  const shippedCount = useMemo(
    () => orders.filter((order) => order.orderStatus === "shipped").length,
    [orders]
  );
  const assignedCount = useMemo(
    () => orders.filter((order) => Boolean(order.fulfillmentAssignment)).length,
    [orders]
  );
  const suggestedCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          !order.fulfillmentAssignment &&
          order.fulfillmentSuggestion?.status === "suggested" &&
          Boolean(order.fulfillmentSuggestion.warehouseId)
      ).length,
    [orders]
  );
  const exceptionCount = useMemo(
    () =>
      orders.filter(
        (order) =>
          !order.fulfillmentAssignment &&
          (!order.fulfillmentSuggestion || order.fulfillmentSuggestion.status !== "suggested")
      ).length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    if (filter === "assigned") {
      return orders.filter((order) => Boolean(order.fulfillmentAssignment));
    }

    if (filter === "suggested") {
      return orders.filter(
        (order) =>
          !order.fulfillmentAssignment &&
          order.fulfillmentSuggestion?.status === "suggested" &&
          Boolean(order.fulfillmentSuggestion.warehouseId)
      );
    }

    if (filter === "exception") {
      return orders.filter(
        (order) =>
          !order.fulfillmentAssignment &&
          (!order.fulfillmentSuggestion || order.fulfillmentSuggestion.status !== "suggested")
      );
    }

    return orders;
  }, [filter, orders]);

  const rows = useMemo(
    () =>
      filteredOrders.map((order) => [
        <div key={`${order.orderNumber}-meta`} className="space-y-1.5">
          <div className="font-semibold text-[#132016]">{order.orderNumber}</div>
          <div className="text-xs text-black/55">{order.providerReference}</div>
          <div className="text-xs text-black/45">{formatDateTime(order.updatedAt)}</div>
        </div>,
        <div key={`${order.orderNumber}-recipient`} className="space-y-0.5">
          <div className="font-medium text-[#132016]">{order.recipientName}</div>
          <div className="text-xs text-black/45">{order.phone}</div>
        </div>,
        <div key={`${order.orderNumber}-destination`} className="space-y-0.5">
          <div className="font-medium text-[#132016]">{order.city}</div>
          <div className="text-xs text-black/45">{order.region}</div>
        </div>,
        <div key={`${order.orderNumber}-delivery`} className="space-y-1">
          <div className="text-sm text-[#132016]">{deliveryLabel(order)}</div>
          <div className="text-xs text-black/45">
            {order.totalUnits} unidad(es) · {order.totalItems} ítem(s)
          </div>
        </div>,
        <div key={`${order.orderNumber}-origin`} className="space-y-1">
          {order.fulfillmentAssignment ? (
            <>
              <div className="text-sm font-medium text-[#132016]">{order.fulfillmentAssignment.warehouseName}</div>
              <Badge tone="success">Confirmado</Badge>
            </>
          ) : order.fulfillmentSuggestion?.status === "suggested" && order.fulfillmentSuggestion.warehouseName ? (
            <>
              <div className="text-sm font-medium text-[#132016]">{order.fulfillmentSuggestion.warehouseName}</div>
              <Badge tone="info">Sugerido</Badge>
            </>
          ) : (
            <span className="text-xs text-black/45">Sin origen confirmado</span>
          )}
        </div>,
        <StatusBadge key={`${order.orderNumber}-status`} tone={orderTone(order.orderStatus)} label={orderStatusLabel(order.orderStatus)} />,
        <div key={`${order.orderNumber}-actions`} className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openDispatchLabel(order.orderNumber)}
            className="rounded-[9px] bg-[#1a3a2e] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#2d6a4f]"
          >
            Imprimir sticker
          </button>
          <a
            href="/pedidos"
            className="rounded-[9px] border border-black/10 px-3 py-1.5 text-xs font-medium text-[#132016] transition hover:bg-black/[0.03]"
          >
            Ir a pedidos
          </a>
        </div>
      ]),
    [filteredOrders]
  );

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#132016]">Despachos</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-black/50">{orders.length} pedido(s) listos para packing y sticker</span>
            {pickupCount > 0 ? <Badge tone="info">{pickupCount} Shalom provincia</Badge> : null}
            {shippedCount > 0 ? <Badge tone="warning">{shippedCount} ya enviados</Badge> : null}
            {exceptionCount > 0 ? <Badge tone="warning">{exceptionCount} en excepción</Badge> : null}
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={() => window.location.reload()} disabled={loading}>
          {loading ? "Actualizando..." : "Refrescar"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: `Todos (${orders.length})` },
          { value: "assigned", label: `Confirmados (${assignedCount})` },
          { value: "suggested", label: `Sugeridos (${suggestedCount})` },
          { value: "exception", label: `Excepción (${exceptionCount})` }
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value as typeof filter)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === option.value
                ? "bg-[#1a3a2e] text-white"
                : "border border-black/10 bg-white text-[#132016] hover:bg-black/[0.03]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard label="Listos para packing" value={String(orders.length)} detail="Pedidos con datos completos y estado apto para sticker y salida." />
        <SummaryCard label="Recojo Shalom" value={String(pickupCount)} detail="Stickers con sucursal o agencia para provincia." />
        <SummaryCard label="En excepción" value={String(exceptionCount)} detail="Pedidos sin origen confirmado para gestión operativa." />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !filteredOrders.length ? (
        <div className="rounded-[1.6rem] border border-dashed border-black/12 bg-white px-6 py-10 text-center">
          <p className="text-sm font-medium text-[#132016]">No hay pedidos para este filtro en este momento.</p>
          <p className="mt-2 text-sm text-black/52">Cambia el filtro o refresca la cola para revisar nuevos pedidos listos para despacho.</p>
        </div>
      ) : (
        <AdminDataTable
          title=""
          description=""
          headers={["Pedido", "Destinatario", "Destino", "Entrega", "Origen", "Estado", "Acciones"]}
          rows={rows}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.5rem] border border-black/8 bg-white px-5 py-4 shadow-[0_12px_34px_rgba(18,34,20,0.05)]">
      <div className="text-xs uppercase tracking-[0.2em] text-black/40">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#132016]">{value}</div>
      <p className="mt-2 text-sm leading-6 text-black/56">{detail}</p>
    </div>
  );
}
