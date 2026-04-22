"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AdminDataTable,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MetricCard,
  SectionHeader,
  StatusBadge
} from "@huelegood/ui";
import type {
  InventoryReportSummary,
  WarehouseSummary,
  WarehouseTransferCreateInput,
  WarehouseTransferIncidentKindValue,
  WarehouseTransferStatusValue,
  WarehouseTransferReceiveInput,
  WarehouseTransferReconcileInput,
  WarehouseTransferSummary
} from "@huelegood/shared";
import {
  cancelAdminTransfer,
  createAdminTransfer,
  createAdminTransferGre,
  createAdminTransferPackageSnapshot,
  createAdminTransferSticker,
  dispatchAdminTransfer,
  fetchAdminTransfers,
  fetchAdminWarehouses,
  fetchInventoryReport,
  receiveAdminTransfer,
  reconcileAdminTransfer
} from "../lib/api";

type TransferDraftLine = {
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
};

type TransferFormState = {
  originWarehouseId: string;
  destinationWarehouseId: string;
  reason: string;
  notes: string;
  variantId: string;
  quantity: string;
  lines: TransferDraftLine[];
};

type ReceiveDraftState = {
  notes: string;
  incidentNotes: string;
  incidentKind: WarehouseTransferIncidentKindValue;
  quantities: Record<string, string>;
};

type VariantOption = {
  variantId: string;
  sku: string;
  name: string;
  productName: string;
  availableByWarehouse: Record<string, number>;
};

function createEmptyForm(): TransferFormState {
  return {
    originWarehouseId: "",
    destinationWarehouseId: "",
    reason: "",
    notes: "",
    variantId: "",
    quantity: "1",
    lines: []
  };
}

function createReceiveDraft(transfer?: WarehouseTransferSummary | null): ReceiveDraftState {
  const quantities: Record<string, string> = {};
  for (const line of transfer?.lines ?? []) {
    quantities[line.variantId] = String(line.pendingQuantity || line.quantity || 0);
  }

  return {
    notes: "",
    incidentNotes: "",
    incidentKind: "missing",
    quantities
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function transferStatusTone(status: WarehouseTransferStatusValue): "neutral" | "success" | "warning" | "danger" | "info" {
  switch (status) {
    case "reserved":
      return "warning";
    case "in_transit":
      return "info";
    case "partial_received":
      return "warning";
    case "received":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

function transferStatusLabel(status: WarehouseTransferStatusValue) {
  const labels: Record<WarehouseTransferStatusValue, string> = {
    reserved: "Reservada",
    in_transit: "En tránsito",
    partial_received: "Recepción parcial",
    received: "Recibida",
    cancelled: "Cancelada"
  };

  return labels[status];
}

function historyStatusLabel(status: WarehouseTransferStatusValue) {
  const labels: Record<WarehouseTransferStatusValue, string> = {
    reserved: "Reserva creada",
    in_transit: "Despacho confirmado",
    partial_received: "Recepción parcial registrada",
    received: "Recepción confirmada",
    cancelled: "Cancelación aplicada"
  };

  return labels[status];
}

function selectClassName() {
  return "h-11 w-full rounded-[12px] border border-black/10 bg-white px-3 text-sm text-[#132016] outline-none transition focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20";
}

export function TransfersWorkspace() {
  const [transfers, setTransfers] = useState<WarehouseTransferSummary[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseSummary[]>([]);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportSummary | null>(null);
  const [form, setForm] = useState<TransferFormState>(createEmptyForm);
  const [activeTransferId, setActiveTransferId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [receiveDraft, setReceiveDraft] = useState<ReceiveDraftState>(() => createReceiveDraft(null));
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [transfersResponse, warehousesResponse, inventoryResponse] = await Promise.all([
          fetchAdminTransfers(),
          fetchAdminWarehouses(),
          fetchInventoryReport()
        ]);

        if (!active) {
          return;
        }

        setTransfers(transfersResponse.data);
        setWarehouses(warehousesResponse.data);
        setInventoryReport(inventoryResponse.data);
        setError(null);
        setActiveTransferId((current) => current ?? transfersResponse.data[0]?.id ?? null);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "No pudimos cargar transferencias.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const variantOptions = useMemo(() => {
    const variants = new Map<string, VariantOption>();

    for (const row of inventoryReport?.rows ?? []) {
      const existing = variants.get(row.variantId);
      if (!existing) {
        variants.set(row.variantId, {
          variantId: row.variantId,
          sku: row.sku,
          name: row.variantName,
          productName: row.productName,
          availableByWarehouse: {
            [row.warehouseId]: row.availableStock
          }
        });
        continue;
      }

      existing.availableByWarehouse[row.warehouseId] = row.availableStock;
    }

    return Array.from(variants.values()).sort((left, right) => left.sku.localeCompare(right.sku));
  }, [inventoryReport]);

  const selectedTransfer = useMemo(
    () => transfers.find((transfer) => transfer.id === activeTransferId) ?? transfers[0] ?? null,
    [activeTransferId, transfers]
  );

  useEffect(() => {
    setReceiveDraft(createReceiveDraft(selectedTransfer));
  }, [selectedTransfer?.id, selectedTransfer?.updatedAt]);

  const selectedVariant = useMemo(
    () => variantOptions.find((option) => option.variantId === form.variantId),
    [form.variantId, variantOptions]
  );

  const selectedOriginAvailability = selectedVariant && form.originWarehouseId
    ? selectedVariant.availableByWarehouse[form.originWarehouseId]
    : undefined;

  const metrics = useMemo(
    () => [
      {
        label: "Reservadas",
        value: formatNumber(transfers.filter((transfer) => transfer.status === "reserved").length),
        detail: "Transferencias con stock bloqueado en origen."
      },
      {
        label: "En tránsito",
        value: formatNumber(transfers.filter((transfer) => transfer.status === "in_transit").length),
        detail: "Salidas ya despachadas y pendientes de recepción."
      },
      {
        label: "Parciales",
        value: formatNumber(transfers.filter((transfer) => transfer.status === "partial_received").length),
        detail: "Recepciones con diferencia registrada o cierre en curso."
      },
      {
        label: "Recibidas",
        value: formatNumber(transfers.filter((transfer) => transfer.status === "received").length),
        detail: "Movimientos cerrados en destino."
      },
      {
        label: "Canceladas",
        value: formatNumber(transfers.filter((transfer) => transfer.status === "cancelled").length),
        detail: "Reservas liberadas antes del despacho."
      }
    ],
    [transfers]
  );

  const warehouseOptions = useMemo(
    () => [...warehouses].sort((left, right) => left.priority - right.priority || left.name.localeCompare(right.name)),
    [warehouses]
  );

  const tableRows = useMemo(
    () =>
      transfers.map((transfer) => [
        <div key={`${transfer.id}-number`} className="space-y-0.5">
          <div className="font-semibold text-[#132016]">{transfer.transferNumber}</div>
          <div className="text-xs text-black/45">{transfer.reason}</div>
        </div>,
        <div key={`${transfer.id}-route`} className="space-y-0.5 text-sm text-[#132016]">
          <div>{transfer.originWarehouseName}</div>
          <div className="text-black/45">→ {transfer.destinationWarehouseName}</div>
        </div>,
        <StatusBadge
          key={`${transfer.id}-status`}
          tone={transferStatusTone(transfer.status)}
          label={transferStatusLabel(transfer.status)}
        />,
        <div key={`${transfer.id}-units`} className="space-y-0.5 text-sm text-[#132016]">
          <div>{formatNumber(transfer.totalUnits)} unidades</div>
          <div className="text-black/45">{formatNumber(transfer.lineCount)} líneas</div>
        </div>,
        <span key={`${transfer.id}-updated`} className="text-sm text-[#132016]">
          {formatDateTime(transfer.updatedAt)}
        </span>,
        <div key={`${transfer.id}-actions`} className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => setActiveTransferId(transfer.id)}>
            Ver
          </Button>
          {transfer.status === "reserved" ? (
            <>
              <Button
                type="button"
                onClick={() => void handleDispatchTransfer(transfer.id)}
                disabled={actingId === transfer.id}
              >
                Despachar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleCancelTransfer(transfer.id)}
                disabled={actingId === transfer.id}
              >
                Cancelar
              </Button>
            </>
          ) : null}
          {transfer.status === "in_transit" || transfer.status === "partial_received" ? (
            <Button
              type="button"
              onClick={() => void handleReceiveTransfer(transfer.id)}
              disabled={actingId === transfer.id}
            >
              Recibir
            </Button>
          ) : null}
        </div>
      ]),
    [actingId, transfers]
  );

  async function refreshData() {
    setRefreshKey((current) => current + 1);
  }

  function updateForm<K extends keyof TransferFormState>(key: K, value: TransferFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateReceiveDraft<K extends keyof ReceiveDraftState>(key: K, value: ReceiveDraftState[K]) {
    setReceiveDraft((current) => ({
      ...current,
      [key]: value
    }));
  }

  function addDraftLine() {
    if (!form.variantId) {
      setError("Selecciona una variante para la transferencia.");
      return;
    }

    if (!form.originWarehouseId) {
      setError("Selecciona el almacén origen antes de agregar líneas.");
      return;
    }

    const quantity = Math.trunc(Number(form.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("La cantidad de transferencia debe ser mayor a cero.");
      return;
    }

    if (!selectedVariant) {
      setError("No encontramos la variante seleccionada en el inventario operativo.");
      return;
    }

    setForm((current) => {
      const existingIndex = current.lines.findIndex((line) => line.variantId === selectedVariant.variantId);
      if (existingIndex >= 0) {
        const nextLines = current.lines.map((line, index) =>
          index === existingIndex
            ? {
                ...line,
                quantity: line.quantity + quantity
              }
            : line
        );

        return {
          ...current,
          quantity: "1",
          lines: nextLines
        };
      }

      return {
        ...current,
        quantity: "1",
        lines: [
          ...current.lines,
          {
            variantId: selectedVariant.variantId,
            sku: selectedVariant.sku,
            name: selectedVariant.name,
            quantity
          }
        ]
      };
    });

    setError(null);
  }

  function removeDraftLine(variantId: string) {
    setForm((current) => ({
      ...current,
      lines: current.lines.filter((line) => line.variantId !== variantId)
    }));
  }

  async function handleCreateTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      if (!form.originWarehouseId || !form.destinationWarehouseId) {
        throw new Error("La transferencia requiere origen y destino.");
      }

      if (form.originWarehouseId === form.destinationWarehouseId) {
        throw new Error("El origen y el destino deben ser distintos.");
      }

      if (!form.reason.trim()) {
        throw new Error("Indica el motivo operativo de la transferencia.");
      }

      if (form.lines.length === 0) {
        throw new Error("Agrega al menos una línea antes de crear la transferencia.");
      }

      const payload: WarehouseTransferCreateInput = {
        originWarehouseId: form.originWarehouseId,
        destinationWarehouseId: form.destinationWarehouseId,
        reason: form.reason.trim(),
        notes: form.notes.trim() || undefined,
        lines: form.lines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity
        }))
      };

      const response = await createAdminTransfer(payload);
      setFeedback(response.message);
      setForm(createEmptyForm());
      setActiveTransferId(response.transfer?.id ?? null);
      await refreshData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No pudimos crear la transferencia.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDispatchTransfer(id: string) {
    setActingId(id);
    setFeedback(null);
    setError(null);

    try {
      const response = await dispatchAdminTransfer(id);
      setFeedback(response.message);
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos despachar la transferencia.");
    } finally {
      setActingId(null);
    }
  }

  async function handleReceiveTransfer(id: string, body?: WarehouseTransferReceiveInput) {
    setActingId(id);
    setFeedback(null);
    setError(null);

    try {
      const response = await receiveAdminTransfer(id, body ?? {});
      setFeedback(response.message);
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos recibir la transferencia.");
    } finally {
      setActingId(null);
    }
  }

  async function handleReconcileTransfer(id: string, body?: WarehouseTransferReconcileInput) {
    setActingId(id);
    setFeedback(null);
    setError(null);

    try {
      const response = await reconcileAdminTransfer(id, body ?? {});
      setFeedback(response.message);
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos reconciliar la incidencia.");
    } finally {
      setActingId(null);
    }
  }

  async function handleCancelTransfer(id: string) {
    setActingId(id);
    setFeedback(null);
    setError(null);

    try {
      const response = await cancelAdminTransfer(id);
      setFeedback(response.message);
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos cancelar la transferencia.");
    } finally {
      setActingId(null);
    }
  }

  async function handleCreatePackageSnapshot(id: string) {
    setActingId(id);
    setFeedback(null);
    setError(null);

    try {
      const response = await createAdminTransferPackageSnapshot(id);
      setFeedback(response.message);
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos congelar el paquete.");
    } finally {
      setActingId(null);
    }
  }

  async function handleCreateGre(id: string) {
    setActingId(id);
    setFeedback(null);
    setError(null);

    try {
      const response = await createAdminTransferGre(id);
      setFeedback(response.message);
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos emitir la GRE.");
    } finally {
      setActingId(null);
    }
  }

  async function handleCreateSticker(id: string) {
    setActingId(id);
    setFeedback(null);
    setError(null);

    try {
      const response = await createAdminTransferSticker(id);
      setFeedback(response.message);
      await refreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos generar el sticker.");
    } finally {
      setActingId(null);
    }
  }

  function buildReceivePayload(transfer: WarehouseTransferSummary): WarehouseTransferReceiveInput {
    const lines = transfer.lines
      .map((line) => {
        const rawValue = receiveDraft.quantities[line.variantId];
        const parsed = Math.trunc(Number(rawValue));
        if (!Number.isFinite(parsed) || parsed <= 0) {
          return null;
        }

        return {
          variantId: line.variantId,
          quantity: parsed
        };
      })
      .filter((line): line is { variantId: string; quantity: number } => Boolean(line));

    return {
      notes: receiveDraft.notes.trim() || undefined,
      incidentKind: receiveDraft.incidentKind,
      incidentNotes: receiveDraft.incidentNotes.trim() || undefined,
      lines: lines.length ? lines : undefined
    };
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Transferencias"
        description="Reserva, despacho y recepción real de stock entre almacenes, sin editar balances a mano."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={() => void refreshData()} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar transferencias"}
        </Button>
        <Badge tone="info">Reserva origen antes de despachar</Badge>
        <Badge tone="neutral">Recepción confirma ingreso en destino</Badge>
      </div>

      {feedback ? (
        <Card className="border-emerald-300/50 bg-emerald-50">
          <CardContent className="py-4 text-sm text-emerald-950">{feedback}</CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-amber-300/50 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-950">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva transferencia</CardTitle>
            <CardDescription>Crea el movimiento y reserva stock en el almacén origen.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateTransfer}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[#132016]">Origen</span>
                  <select
                    className={selectClassName()}
                    value={form.originWarehouseId}
                    onChange={(event) => updateForm("originWarehouseId", event.target.value)}
                  >
                    <option value="">Selecciona almacén</option>
                    {warehouseOptions.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[#132016]">Destino</span>
                  <select
                    className={selectClassName()}
                    value={form.destinationWarehouseId}
                    onChange={(event) => updateForm("destinationWarehouseId", event.target.value)}
                  >
                    <option value="">Selecciona almacén</option>
                    {warehouseOptions.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[#132016]">Motivo</span>
                  <Input
                    value={form.reason}
                    onChange={(event) => updateForm("reason", event.target.value)}
                    placeholder="Reabastecimiento, balanceo, campaña..."
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span className="font-medium text-[#132016]">Notas</span>
                  <Input
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                    placeholder="Observaciones opcionales"
                  />
                </label>
              </div>

              <div className="rounded-[18px] border border-black/8 bg-[#f7fbf8] p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-[1.3fr_0.45fr_auto]">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-[#132016]">Variante</span>
                    <select
                      className={selectClassName()}
                      value={form.variantId}
                      onChange={(event) => updateForm("variantId", event.target.value)}
                    >
                      <option value="">Selecciona SKU</option>
                      {variantOptions.map((variant) => (
                        <option key={variant.variantId} value={variant.variantId}>
                          {variant.sku} · {variant.productName} · {variant.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-[#132016]">Cantidad</span>
                    <Input
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(event) => updateForm("quantity", event.target.value)}
                    />
                  </label>

                  <div className="flex items-end">
                    <Button type="button" onClick={addDraftLine} variant="secondary">
                      Agregar línea
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-black/55">
                  <Badge tone="neutral">
                    Disponible en origen: {selectedOriginAvailability == null ? "Sin dato" : formatNumber(selectedOriginAvailability)}
                  </Badge>
                  <Badge tone="neutral">Líneas: {formatNumber(form.lines.length)}</Badge>
                  <Badge tone="neutral">
                    Unidades: {formatNumber(form.lines.reduce((sum, line) => sum + line.quantity, 0))}
                  </Badge>
                </div>

                {form.lines.length ? (
                  <div className="space-y-2">
                    {form.lines.map((line) => (
                      <div
                        key={line.variantId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-black/8 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#132016]">{line.sku}</p>
                          <p className="text-xs text-black/50">{line.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">{formatNumber(line.quantity)} unidades</Badge>
                          <Button type="button" variant="secondary" onClick={() => removeDraftLine(line.variantId)}>
                            Quitar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-black/45">Agrega una o más líneas para reservar stock en el origen.</p>
                )}
              </div>

              <Button type="submit" disabled={submitting}>
                {submitting ? "Creando transferencia..." : "Crear transferencia"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalle activo</CardTitle>
            <CardDescription>Traza operativa de la transferencia seleccionada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTransfer ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#132016]">{selectedTransfer.transferNumber}</p>
                    <p className="text-sm text-black/55">{selectedTransfer.reason}</p>
                  </div>
                  <StatusBadge
                    tone={transferStatusTone(selectedTransfer.status)}
                    label={transferStatusLabel(selectedTransfer.status)}
                  />
                </div>

                <div className="rounded-[14px] border border-black/8 bg-[#f7fbf8] px-4 py-3 text-sm text-[#132016]">
                  <p>{selectedTransfer.originWarehouseName}</p>
                  <p className="text-black/55">→ {selectedTransfer.destinationWarehouseName}</p>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-[12px] border border-black/8 bg-[#f7fbf8] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Solicitado</p>
                    <p className="mt-1 text-sm font-semibold text-[#132016]">{formatNumber(selectedTransfer.totalUnits)}</p>
                  </div>
                  <div className="rounded-[12px] border border-black/8 bg-[#f7fbf8] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Despachado</p>
                    <p className="mt-1 text-sm font-semibold text-[#132016]">{formatNumber(selectedTransfer.dispatchedUnits)}</p>
                  </div>
                  <div className="rounded-[12px] border border-black/8 bg-[#f7fbf8] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Recibido</p>
                    <p className="mt-1 text-sm font-semibold text-[#132016]">{formatNumber(selectedTransfer.receivedUnits)}</p>
                  </div>
                  <div className="rounded-[12px] border border-black/8 bg-[#f7fbf8] px-3 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-black/40">Pendiente</p>
                    <p className="mt-1 text-sm font-semibold text-[#132016]">{formatNumber(selectedTransfer.pendingUnits)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedTransfer.lines.map((line) => (
                    <div
                      key={`${selectedTransfer.id}-${line.variantId}`}
                      className="rounded-[14px] border border-black/8 bg-white px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#132016]">
                            {line.sku} · {line.name}
                          </p>
                          <p className="text-xs text-black/50">Solicitud operativa de la línea</p>
                        </div>
                        <Badge tone="neutral">{formatNumber(line.quantity)} unidades</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-black/55">
                        <Badge tone="neutral">Despachado: {formatNumber(line.dispatchedQuantity)}</Badge>
                        <Badge tone="neutral">Recibido: {formatNumber(line.receivedQuantity)}</Badge>
                        <Badge tone="neutral">Pendiente: {formatNumber(line.pendingQuantity)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-[14px] border border-black/8 bg-[#f7fbf8] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#132016]">Documentos logísticos</p>
                      <p className="text-xs text-black/50">Paquete, GRE y sticker comparten el mismo transferNumber.</p>
                    </div>
                    <Badge tone="neutral">{selectedTransfer.transferNumber}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-[12px] border border-black/8 bg-white px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-black/40">Paquete</p>
                      <p className="mt-1 text-sm font-semibold text-[#132016]">
                        {selectedTransfer.logistics?.packageSnapshot?.packageId ?? "Pendiente"}
                      </p>
                      <p className="text-xs text-black/50">
                        {selectedTransfer.logistics?.packageSnapshot?.packedAt
                          ? formatDateTime(selectedTransfer.logistics?.packageSnapshot?.packedAt)
                          : "Aún no se congela"}
                      </p>
                    </div>

                    <div className="rounded-[12px] border border-black/8 bg-white px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-black/40">GRE</p>
                      <p className="mt-1 text-sm font-semibold text-[#132016]">
                        {selectedTransfer.logistics?.gre?.referenceCode ?? "Pendiente"}
                      </p>
                      <p className="text-xs text-black/50">
                        {selectedTransfer.logistics?.gre?.issuedAt
                          ? formatDateTime(selectedTransfer.logistics?.gre?.issuedAt)
                          : "Sin emisión"}
                      </p>
                    </div>

                    <div className="rounded-[12px] border border-black/8 bg-white px-3 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-black/40">Sticker</p>
                      <p className="mt-1 text-sm font-semibold text-[#132016]">
                        {selectedTransfer.logistics?.sticker?.stickerCode ?? "Pendiente"}
                      </p>
                      <p className="text-xs text-black/50">
                        {selectedTransfer.logistics?.sticker?.generatedAt
                          ? formatDateTime(selectedTransfer.logistics?.sticker?.generatedAt)
                          : "Sin generar"}
                      </p>
                    </div>
                  </div>

                  {selectedTransfer.status === "reserved" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleCreatePackageSnapshot(selectedTransfer.id)}
                        disabled={actingId === selectedTransfer.id}
                      >
                        {selectedTransfer.logistics?.packageSnapshot ? "Reabrir paquete" : "Congelar paquete"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleCreateGre(selectedTransfer.id)}
                        disabled={actingId === selectedTransfer.id}
                      >
                        {selectedTransfer.logistics?.gre ? "Reemitir GRE" : "Emitir GRE"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleCreateSticker(selectedTransfer.id)}
                        disabled={actingId === selectedTransfer.id}
                      >
                        {selectedTransfer.logistics?.sticker ? "Reabrir sticker" : "Generar sticker"}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-black/50">
                      Los documentos se conservan como snapshot. Si faltan, deben generarse antes del despacho.
                    </p>
                  )}
                </div>

                {selectedTransfer.status === "in_transit" || selectedTransfer.status === "partial_received" ? (
                  <div className="space-y-3 rounded-[14px] border border-black/8 bg-[#f7fbf8] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#132016]">Recepción parcial y conciliación</p>
                        <p className="text-xs text-black/50">
                          Ingresa cantidades recibidas por línea y deja la diferencia en incidencia.
                        </p>
                      </div>
                      <Badge tone="neutral">
                        {selectedTransfer.incident?.status === "open" ? "Incidencia abierta" : "Sin incidencia abierta"}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {selectedTransfer.lines.map((line) => (
                        <label key={`${selectedTransfer.id}-${line.variantId}-receive`} className="space-y-1.5 text-sm">
                          <span className="font-medium text-[#132016]">
                            {line.sku} · {line.name}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            value={receiveDraft.quantities[line.variantId] ?? ""}
                            onChange={(event) =>
                              updateReceiveDraft("quantities", {
                                ...receiveDraft.quantities,
                                [line.variantId]: event.target.value
                              })
                            }
                            placeholder={`Pendiente ${formatNumber(line.pendingQuantity)}`}
                          />
                          <span className="text-xs text-black/45">
                            Pendiente operativo: {formatNumber(line.pendingQuantity)}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-[#132016]">Tipo de incidencia</span>
                        <select
                          className={selectClassName()}
                          value={receiveDraft.incidentKind}
                          onChange={(event) =>
                            updateReceiveDraft("incidentKind", event.target.value as WarehouseTransferIncidentKindValue)
                          }
                        >
                          <option value="missing">Faltante</option>
                          <option value="damage">Daño</option>
                          <option value="loss">Pérdida</option>
                          <option value="overage">Sobrante</option>
                          <option value="mixed">Mixta</option>
                        </select>
                      </label>

                      <label className="space-y-1.5 text-sm">
                        <span className="font-medium text-[#132016]">Notas de recepción</span>
                        <Input
                          value={receiveDraft.notes}
                          onChange={(event) => updateReceiveDraft("notes", event.target.value)}
                          placeholder="Observación operativa"
                        />
                      </label>
                    </div>

                    <label className="space-y-1.5 text-sm block">
                      <span className="font-medium text-[#132016]">Notas de incidencia</span>
                      <Input
                        value={receiveDraft.incidentNotes}
                        onChange={(event) => updateReceiveDraft("incidentNotes", event.target.value)}
                        placeholder="Describe la diferencia y el cierre"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void handleReceiveTransfer(selectedTransfer.id, buildReceivePayload(selectedTransfer))}
                        disabled={actingId === selectedTransfer.id}
                      >
                        Registrar recepción
                      </Button>
                      {selectedTransfer.incident?.status === "open" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            void handleReconcileTransfer(selectedTransfer.id, {
                              notes: receiveDraft.incidentNotes.trim() || receiveDraft.notes.trim() || undefined
                            })
                          }
                          disabled={actingId === selectedTransfer.id}
                        >
                          Reconciliar incidencia
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2 rounded-[14px] border border-black/8 bg-white px-4 py-3">
                  {selectedTransfer.history.map((entry, index) => (
                    <div key={`${selectedTransfer.id}-history-${index}`} className="text-sm">
                      <p className="font-medium text-[#132016]">{historyStatusLabel(entry.status)}</p>
                      <p className="text-black/55">{entry.note ?? "Sin nota"}</p>
                      <p className="text-xs text-black/45">{formatDateTime(entry.occurredAt)}</p>
                    </div>
                  ))}
                </div>

                {selectedTransfer.incident ? (
                  <div className="space-y-2 rounded-[14px] border border-amber-300/50 bg-amber-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-amber-950">Incidencia logística</p>
                        <p className="text-xs text-amber-900/70">
                          {selectedTransfer.incident.kind} · {selectedTransfer.incident.status}
                        </p>
                      </div>
                      <Badge tone={selectedTransfer.incident.status === "open" ? "warning" : "success"}>
                        {selectedTransfer.incident.status === "open" ? "Abierta" : "Resuelta"}
                      </Badge>
                    </div>
                    <div className="text-sm text-amber-950/90">
                      <p>
                        Diferencia: {formatNumber(selectedTransfer.incident.totalDifferenceUnits)} unidades.
                      </p>
                      <p>Recibido: {formatNumber(selectedTransfer.incident.totalReceivedUnits)}</p>
                      <p>Esperado: {formatNumber(selectedTransfer.incident.totalExpectedUnits)}</p>
                      {selectedTransfer.incident.notes ? <p>{selectedTransfer.incident.notes}</p> : null}
                      {selectedTransfer.incident.resolutionNote ? <p>{selectedTransfer.incident.resolutionNote}</p> : null}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {selectedTransfer.status === "reserved" ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => void handleDispatchTransfer(selectedTransfer.id)}
                        disabled={actingId === selectedTransfer.id}
                      >
                        Despachar
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleCancelTransfer(selectedTransfer.id)}
                        disabled={actingId === selectedTransfer.id}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : null}
                  {selectedTransfer.status === "in_transit" || selectedTransfer.status === "partial_received" ? (
                    <Button
                      type="button"
                      onClick={() => void handleReceiveTransfer(selectedTransfer.id)}
                      disabled={actingId === selectedTransfer.id}
                    >
                      {selectedTransfer.status === "partial_received" ? "Completar recepción" : "Confirmar recepción"}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <p className="text-sm text-black/45">Aún no hay transferencias registradas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminDataTable
        title="Transferencias registradas"
        description="Cada fila representa una reserva o movimiento real entre almacenes."
        headers={["Transferencia", "Ruta", "Estado", "Volumen", "Actualizado", "Acciones"]}
        rows={tableRows}
      />
    </div>
  );
}
