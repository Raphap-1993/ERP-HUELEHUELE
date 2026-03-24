"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AdminDataTable,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  MetricCard,
  Input,
  SectionHeader,
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import type { AdminManualPaymentRequestSummary, AdminPaymentSummary, ManualPaymentRequestStatus, NotificationStatus, PaymentStatus } from "@huelegood/shared";
import { approveManualPaymentRequest, fetchManualPaymentRequests, fetchPayments, rejectManualPaymentRequest } from "../lib/api";

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

function manualPriorityWeight(request: AdminManualPaymentRequestSummary) {
  if (request.status === "under_review") {
    return 4;
  }

  if (request.status === "submitted") {
    return 3;
  }

  if (request.status === "approved") {
    return 2;
  }

  return 1;
}

function manualPriorityLabel(request: AdminManualPaymentRequestSummary) {
  if (request.status === "under_review") {
    return { label: "Resolver ahora", tone: "warning" as const };
  }

  if (request.status === "submitted") {
    return { label: "Ingresó a cola", tone: "info" as const };
  }

  if (request.status === "approved") {
    return { label: "Ya conciliado", tone: "success" as const };
  }

  return { label: "Cerrado", tone: "neutral" as const };
}

export function PaymentsWorkspace() {
  const [payments, setPayments] = useState<AdminPaymentSummary[]>([]);
  const [manualRequests, setManualRequests] = useState<AdminManualPaymentRequestSummary[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewer, setReviewer] = useState("operador_pagos");
  const [reviewNotes, setReviewNotes] = useState("Revisión operativa.");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
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
  const priorityRequests = useMemo(
    () =>
      [...manualRequests]
        .sort((left, right) => {
          const byPriority = manualPriorityWeight(right) - manualPriorityWeight(left);
          if (byPriority !== 0) {
            return byPriority;
          }

          return new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime();
        })
        .slice(0, 6),
    [manualRequests]
  );
  const underReviewCount = useMemo(() => manualRequests.filter((request) => request.status === "under_review").length, [manualRequests]);
  const submittedCount = useMemo(() => manualRequests.filter((request) => request.status === "submitted").length, [manualRequests]);
  const openpayCount = useMemo(() => payments.filter((payment) => payment.provider === "openpay").length, [payments]);
  const manualCount = useMemo(() => payments.filter((payment) => payment.provider === "manual").length, [payments]);
  const deliveredNotifications = useMemo(
    () => payments.filter((payment) => payment.notificationStatus === "delivered" || payment.notificationStatus === "sent").length,
    [payments]
  );
  const paymentsRows = useMemo(
    () =>
      payments.map((payment) => [
        <div key={`${payment.id}-order`} className="space-y-1">
          <div className="font-semibold text-[#132016]">{payment.orderNumber}</div>
          <div className="text-xs text-black/45">{payment.provider === "manual" ? "Pago manual" : "Openpay"}</div>
        </div>,
        <div key={`${payment.id}-customer`} className="space-y-1">
          <div className="font-medium text-[#132016]">{payment.customerName}</div>
          <div className="text-xs text-black/45">{payment.evidenceReference ?? "Sin referencia adicional"}</div>
        </div>,
        <StatusBadge key={`${payment.id}-status`} tone={paymentTone(payment.status)} label={paymentLabel(payment.status)} />,
        formatCurrency(payment.amount),
        <StatusBadge key={`${payment.id}-manual`} tone={manualTone(payment.manualStatus)} label={manualLabel(payment.manualStatus)} />,
        <Badge key={`${payment.id}-notification`} tone={notificationTone(payment.notificationStatus)}>
          {notificationLabel(payment.notificationStatus)}
        </Badge>,
        formatDateTime(payment.updatedAt)
      ]),
    [payments]
  );
  const manualRequestsRows = useMemo(
    () =>
      manualRequests.map((request) => [
        <Button
          key={request.id}
          type="button"
          variant="ghost"
          className="h-auto px-0 py-0 font-semibold"
          onClick={() => { setSelectedRequestId(request.id); setModalOpen(true); }}
        >
          {request.id}
        </Button>,
        request.orderNumber,
        request.customerName,
        <StatusBadge key={`${request.id}-manual-status`} tone={manualTone(request.status)} label={manualLabel(request.status)} />,
        request.evidenceReference ?? "Sin comprobante",
        request.reviewedAt ? formatDateTime(request.reviewedAt) : "Pendiente"
      ]),
    [manualRequests]
  );
  const spotlightText = underReviewCount
    ? `${underReviewCount} comprobante(s) requieren decisión inmediata.`
    : submittedCount
      ? `${submittedCount} comprobante(s) ingresaron y esperan pasar a revisión.`
      : "La cola manual está estable; el foco está en conciliación y seguimiento.";

  function loadFreshData() {
    setRefreshKey((current) => current + 1);
  }

  async function handleDecision(decision: "approve" | "reject") {
    if (!selectedRequest) {
      return;
    }

    setActionLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const payload = {
        reviewer: reviewer.trim() || undefined,
        notes: reviewNotes.trim() || undefined
      };

      const response =
        decision === "approve"
          ? await approveManualPaymentRequest(selectedRequest.id, payload)
          : await rejectManualPaymentRequest(selectedRequest.id, payload);

      setFeedback(response.message);

      loadFreshData();

      if (response.status === "queued") {
        window.setTimeout(loadFreshData, 1200);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No pudimos actualizar la solicitud manual.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <Card className="overflow-hidden border-black/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.99)_0%,rgba(241,246,239,0.96)_45%,rgba(247,244,238,0.98)_100%)]">
        <CardContent className="grid gap-6 px-6 py-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionHeader
                title="Pagos"
                description="Centro operativo para conciliación, revisión manual y seguimiento de notificación."
              />
              <Button type="button" variant="secondary" onClick={loadFreshData} disabled={loading || actionLoading}>
                {loading ? "Actualizando..." : "Refrescar"}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={underReviewCount ? "warning" : "success"}>{spotlightText}</Badge>
              <Badge tone="neutral">Pagos visibles {payments.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <HeroFact label="En revisión" value={String(underReviewCount)} detail="Comprobantes frenando la decisión final." />
              <HeroFact label="Openpay" value={String(openpayCount)} detail="Cobros directos que ya siguen su ruta automática." />
              <HeroFact label="Manual" value={String(manualCount)} detail="Pagos que requieren evidencia o conciliación asistida." />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <OperationalCallout
              title="Prioridad de hoy"
              description="Resolver revisión manual primero. Después validar que los pagos confirmados estén notificando y no queden en limbo."
            />
            <OperationalCallout
              title="Cobertura"
              description={`${deliveredNotifications} pago(s) ya confirmaron notificación. ${manualRequests.length} solicitud(es) manual(es) siguen trazables en el mismo flujo.`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {feedback ? <p className="text-sm text-emerald-700">{feedback}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Cola manual prioritaria</CardTitle>
          <CardDescription>Solicitudes ordenadas para aprobar, rechazar o dejar documentadas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {priorityRequests.length ? (
              priorityRequests.map((request) => {
                const priority = manualPriorityLabel(request);

                return (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => { setSelectedRequestId(request.id); setModalOpen(true); }}
                    className="w-full rounded-[1.5rem] border border-black/10 bg-black/[0.02] p-4 text-left text-[#132016] transition hover:border-black/15 hover:bg-black/[0.035]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{request.id}</div>
                        <div className="text-sm text-black/58">
                          {request.orderNumber} · {request.customerName}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={priority.tone}>{priority.label}</Badge>
                        <Badge tone="neutral">{formatCurrency(request.amount)}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-black/62 md:grid-cols-2">
                      <div>Estado: {manualLabel(request.status)}</div>
                      <div>Enviado: {formatDateTime(request.submittedAt)}</div>
                      <div>Comprobante: {request.evidenceReference ?? "Sin referencia"}</div>
                      <div>Revisor: {request.reviewer ?? "Sin asignar"}</div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full rounded-[1.5rem] border border-dashed border-black/15 bg-black/[0.015] p-6 text-sm leading-6 text-black/55">
                Cuando llegue un comprobante o cambie de estado, aparecerá aquí por prioridad.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        title="Pagos registrados"
        description="Estado completo de cobros, manuales y señal de notificación."
        headers={["Pedido", "Cliente", "Estado", "Importe", "Manual", "Notificación", "Actualizado"]}
        rows={paymentsRows}
      />

      <AdminDataTable
        title="Solicitudes manuales"
        description="Trazabilidad completa de comprobantes y decisión operativa."
        headers={["Solicitud", "Pedido", "Cliente", "Estado", "Comprobante", "Revisión"]}
        rows={manualRequestsRows}
      />

      <Card>
        <CardHeader>
          <CardTitle>Radar de conciliación</CardTitle>
          <CardDescription>Señales reales para entender si el flujo está sano o se está acumulando trabajo manual.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="Ingresaron a cola" value={String(submittedCount)} />
          <SummaryTile label="En revisión" value={String(underReviewCount)} />
          <SummaryTile label="Notificación entregada" value={String(deliveredNotifications)} />
          <SummaryTile label="Pagos confirmados" value={String(payments.filter((payment) => payment.status === "paid").length)} />
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRequest
                ? `${selectedRequest.id} · ${selectedRequest.orderNumber}`
                : "Decisión operativa"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {selectedRequest ? (
              <div className="space-y-5">
                <div className="rounded-[1.75rem] border border-black/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,243,237,0.94)_100%)] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.24em] text-black/42">Solicitud seleccionada</p>
                      <h3 className="text-2xl font-semibold tracking-tight text-[#132016]">{selectedRequest.id}</h3>
                      <p className="text-sm text-black/58">
                        {selectedRequest.orderNumber} · {selectedRequest.customerName}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={manualTone(selectedRequest.status)} label={manualLabel(selectedRequest.status)} />
                      <Badge tone="neutral">{formatCurrency(selectedRequest.amount)}</Badge>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <SummaryTile label="Pedido" value={selectedRequest.orderNumber} />
                    <SummaryTile label="Comprobante" value={selectedRequest.evidenceReference ?? "Sin referencia"} />
                    <SummaryTile label="Enviado" value={formatDateTime(selectedRequest.submittedAt)} />
                    <SummaryTile label="Revisor" value={selectedRequest.reviewer ?? "Sin asignar"} />
                  </div>
                </div>

                {selectedRequest.evidenceNotes ? (
                  <div className="rounded-[1.5rem] border border-black/10 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-black/45">Notas del comprobante</p>
                    <p className="mt-2 text-sm leading-6 text-black/62">{selectedRequest.evidenceNotes}</p>
                  </div>
                ) : null}

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
              </div>
            ) : (
              <p className="text-sm text-black/55">Selecciona una solicitud para revisar el comprobante.</p>
            )}
          </DialogBody>
          <DialogFooter>
            {selectedRequest ? (
              <>
                <Button type="button" onClick={() => void handleDecision("approve")} disabled={actionLoading}>
                  Aprobar
                </Button>
                <Button type="button" variant="danger" onClick={() => void handleDecision("reject")} disabled={actionLoading}>
                  Rechazar
                </Button>
              </>
            ) : null}
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
