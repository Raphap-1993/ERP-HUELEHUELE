"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricCard,
  Input,
  SectionHeader,
  Separator,
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import type { AdminManualPaymentRequestSummary, AdminPaymentSummary, ManualPaymentRequestStatus, NotificationStatus, PaymentStatus } from "@huelegood/shared";
import { approveManualPaymentRequest, fetchManualPaymentRequests, fetchPayments, rejectManualPaymentRequest } from "../lib/api";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0
  }).format(value);
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

function notificationTone(status: NotificationStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "sent" || status === "delivered") {
    return "success";
  }

  if (status === "failed") {
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

function paymentLabel(status: PaymentStatus) {
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

function notificationLabel(status: NotificationStatus) {
  const labels: Record<NotificationStatus, string> = {
    pending: "Pendiente",
    sent: "Enviado",
    delivered: "Entregado",
    failed: "Fallido"
  };

  return labels[status];
}

function manualLabel(status?: ManualPaymentRequestStatus) {
  const labels: Record<ManualPaymentRequestStatus, string> = {
    submitted: "Enviado",
    under_review: "En revisión",
    approved: "Aprobado",
    rejected: "Rechazado",
    expired: "Expirado"
  };

  return status ? labels[status] : "Sin solicitud";
}

export function PaymentsWorkspace() {
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [manualRequests, setManualRequests] = useState<AdminManualPaymentRequestSummary[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [reviewer, setReviewer] = useState("operador_pagos");
  const [reviewNotes, setReviewNotes] = useState("Revisión operativa.");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      try {
        const [paymentsResponse, requestsResponse] = await Promise.all([fetchPayments(), fetchManualPaymentRequests()]);
        if (!active) {
          return;
        }

        setPayments(paymentsResponse.data);
        setManualRequests(requestsResponse.data);
        setError(null);

        if (!selectedRequestId && requestsResponse.data[0]) {
          setSelectedRequestId(requestsResponse.data[0].id);
        }

        if (selectedRequestId && !requestsResponse.data.some((request) => request.id === selectedRequestId) && requestsResponse.data[0]) {
          setSelectedRequestId(requestsResponse.data[0].id);
        }

        if (!requestsResponse.data.length) {
          setSelectedRequestId(null);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar los pagos.");
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

  useEffect(() => {
    if (!manualRequests.length) {
      setSelectedRequestId(null);
      return;
    }

    if (!selectedRequestId || !manualRequests.some((request) => request.id === selectedRequestId)) {
      setSelectedRequestId(manualRequests[0].id);
    }
  }, [manualRequests, selectedRequestId]);

  const selectedRequest = useMemo(
    () => manualRequests.find((request) => request.id === selectedRequestId) ?? null,
    [manualRequests, selectedRequestId]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Pagos totales",
        value: String(payments.length),
        detail: "Registros de cobro activos."
      },
      {
        label: "Pagados",
        value: String(payments.filter((payment) => payment.status === "paid").length),
        detail: "Cobros confirmados."
      },
      {
        label: "Pendientes",
        value: String(payments.filter((payment) => payment.status === "pending" || payment.status === "initiated").length),
        detail: "A la espera de confirmación."
      },
      {
        label: "Revisión manual",
        value: String(manualRequests.filter((request) => request.status === "under_review").length),
        detail: "Comprobantes en cola."
      }
    ],
    [manualRequests, payments]
  );

  function loadFreshData() {
    setRefreshKey((current) => current + 1);
  }

  async function handleDecision(decision: "approve" | "reject") {
    if (!selectedRequest) {
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const payload = {
        reviewer: reviewer.trim() || undefined,
        notes: reviewNotes.trim() || undefined
      };

      if (decision === "approve") {
        await approveManualPaymentRequest(selectedRequest.id, payload);
      } else {
        await rejectManualPaymentRequest(selectedRequest.id, payload);
      }

      await loadFreshData();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar la solicitud manual.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          title="Pagos"
          description="Openpay, pagos manuales y revisión de comprobantes sobre un mismo flujo operativo."
        />
        <Button type="button" variant="secondary" onClick={loadFreshData} disabled={loading || actionLoading}>
          {loading ? "Actualizando..." : "Refrescar"}
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <AdminDataTable
          title="Pagos registrados"
          description={error ?? "Estado operativo de cobros y conciliación."}
          headers={["Pedido", "Cliente", "Proveedor", "Estado", "Importe", "Manual", "Notificación"]}
          rows={payments.map((payment) => [
            payment.orderNumber,
            payment.customerName,
            payment.provider === "manual" ? "Pago manual" : "Openpay",
            <StatusBadge key={`${payment.id}-status`} tone={paymentTone(payment.status)} label={paymentLabel(payment.status)} />,
            formatCurrency(payment.amount),
            <StatusBadge key={`${payment.id}-manual`} tone={manualTone(payment.manualStatus)} label={manualLabel(payment.manualStatus)} />,
            <Badge key={`${payment.id}-notification`} tone={notificationTone(payment.notificationStatus)}>
              {notificationLabel(payment.notificationStatus)}
            </Badge>
          ])}
        />

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Revisión manual</CardTitle>
            <CardDescription>
              {selectedRequest
                ? `${selectedRequest.id} · ${selectedRequest.orderNumber} · ${selectedRequest.customerName}`
                : "Selecciona una solicitud para revisar el comprobante."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {selectedRequest ? (
              <>
                <div className="space-y-3 rounded-3xl border border-black/10 bg-black/[0.02] p-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={manualTone(selectedRequest.status)} label={manualLabel(selectedRequest.status)} />
                    <Badge tone="neutral">{formatCurrency(selectedRequest.amount)}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-[#132016]">
                    <p>
                      <strong>Cliente:</strong> {selectedRequest.customerName}
                    </p>
                    <p>
                      <strong>Comprobante:</strong> {selectedRequest.evidenceReference ?? "Sin comprobante"}
                    </p>
                    {selectedRequest.evidenceNotes ? (
                      <p>
                        <strong>Notas:</strong> {selectedRequest.evidenceNotes}
                      </p>
                    ) : null}
                    <p>
                      <strong>Enviado:</strong> {selectedRequest.submittedAt}
                    </p>
                    {selectedRequest.reviewedAt ? (
                      <p>
                        <strong>Revisado:</strong> {selectedRequest.reviewedAt}
                      </p>
                    ) : null}
                    {selectedRequest.reviewer ? (
                      <p>
                        <strong>Revisor:</strong> {selectedRequest.reviewer}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Revisor</p>
                    <Input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="operador_pagos" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Notas</p>
                    <Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} placeholder="Motivo de aprobación o rechazo" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => void handleDecision("approve")} disabled={actionLoading}>
                    Aprobar
                  </Button>
                  <Button type="button" variant="danger" onClick={() => void handleDecision("reject")} disabled={actionLoading}>
                    Rechazar
                  </Button>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-black/15 bg-black/[0.015] p-6 text-sm text-black/55">
                No hay una solicitud manual seleccionada.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <AdminDataTable
          title="Solicitudes manuales"
          description="Comprobantes y estados para aprobación operativa."
          headers={["Solicitud", "Pedido", "Cliente", "Estado", "Comprobante", "Revisión"]}
          rows={manualRequests.map((request) => [
            <Button
              key={request.id}
              type="button"
              variant="ghost"
              className="px-0 font-semibold"
              onClick={() => setSelectedRequestId(request.id)}
            >
              {request.id}
            </Button>,
            request.orderNumber,
            request.customerName,
            <StatusBadge key={`${request.id}-manual-status`} tone={manualTone(request.status)} label={manualLabel(request.status)} />,
            request.evidenceReference ?? "Sin comprobante",
            request.reviewedAt ?? "Pendiente"
          ])}
        />

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Notas de flujo</CardTitle>
            <CardDescription>La revisión manual se resuelve sobre el mismo pedido y actualiza el estado comercial.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-black/65">
            <p>
              Openpay y pago manual comparten la misma base de pedidos. La decisión operativa solo cambia estado, pago y
              auditoría.
            </p>
            <Separator />
            <p>
              Si el comprobante es válido, el pedido pasa a <strong>pagado</strong>. Si se rechaza, queda <strong>cancelado</strong> y
              listo para auditoría.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
