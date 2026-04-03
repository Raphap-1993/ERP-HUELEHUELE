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
  SectionHeader,
  StatusBadge
} from "@huelegood/ui";
import type {
  AdminMetric,
  ObservabilityEventSummary,
  ObservabilityOverviewSummary,
  ObservabilityQueueSummary,
  ObservabilityRequestSummary
} from "@huelegood/shared";
import { fetchObservabilityOverview } from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function requestTone(statusCode: number): "neutral" | "success" | "warning" | "danger" | "info" {
  if (statusCode >= 500) {
    return "danger";
  }

  if (statusCode >= 400) {
    return "warning";
  }

  return "success";
}

function queueTone(status: ObservabilityQueueSummary["status"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "healthy") {
    return "success";
  }

  if (status === "degraded") {
    return "warning";
  }

  return "danger";
}

function queueLabel(status: ObservabilityQueueSummary["status"]) {
  const labels: Record<ObservabilityQueueSummary["status"], string> = {
    healthy: "Saludable",
    degraded: "Degradada",
    missing: "Faltante"
  };

  return labels[status];
}

function eventTone(severity: ObservabilityEventSummary["severity"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (severity === "critical" || severity === "error") {
    return "danger";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "info";
}

const emptyOverview: ObservabilityOverviewSummary = {
  service: "huelegood-api",
  generatedAt: new Date(0).toISOString(),
  requestIdHeader: "X-Request-Id",
  requests: {
    totalRequests: 0,
    successRequests: 0,
    clientErrorRequests: 0,
    serverErrorRequests: 0,
    blockedRequests: 0,
    averageDurationMs: 0,
    p95DurationMs: 0,
    lastRequestAt: undefined
  },
  recentRequests: [],
  topRoutes: [],
  events: [],
  queues: []
};

export function ObservabilityWorkspace() {
  const [overview, setOverview] = useState<ObservabilityOverviewSummary>(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const response = await fetchObservabilityOverview();
        if (!active) {
          return;
        }

        setOverview(response.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar observabilidad.");
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

  const metrics = useMemo<AdminMetric[]>(
    () => [
      {
        label: "Requests totales",
        value: String(overview.requests.totalRequests),
        detail: `Ventana reciente visible: ${overview.recentRequests.length} requests.`
      },
      {
        label: "Errores 5xx",
        value: String(overview.requests.serverErrorRequests),
        detail: "Fallos de backend observados por el interceptor."
      },
      {
        label: "Bloqueos RL",
        value: String(overview.requests.blockedRequests),
        detail: "Solicitudes frenadas por rate limiting."
      },
      {
        label: "Colas sanas",
        value: String(overview.queues.filter((queue) => queue.status === "healthy").length),
        detail: "BullMQ y Redis visibles desde API."
      }
    ],
    [overview]
  );

  const recentRequests = overview.recentRequests.slice(0, 20);
  const recentEvents = overview.events.slice(0, 20);

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Observabilidad"
        description="Requests, colas, eventos y rutas críticas visibles desde operación."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setRefreshKey((current) => current + 1)} variant="secondary" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar telemetría"}
        </Button>
        <Badge tone="info">Request ID: {overview.requestIdHeader}</Badge>
        <Badge tone="neutral">Actualizado: {formatDate(overview.generatedAt)}</Badge>
      </div>

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

      <AdminDataTable
          title="Requests recientes"
          description={`Promedio ${overview.requests.averageDurationMs} ms · p95 ${overview.requests.p95DurationMs} ms · última actividad ${formatDate(overview.requests.lastRequestAt)}.`}
          headers={["Método", "Ruta", "Estado", "Duración", "Actor", "Fecha"]}
          rows={recentRequests.map((request) => [
            <div key={`${request.id}-method`} className="flex items-center gap-2">
              <Badge tone="neutral">{request.method}</Badge>
              <span className="text-sm text-black/55">{request.requestId.slice(0, 8)}</span>
            </div>,
            <span key={`${request.id}-path`} className="text-sm text-[#132016]">
              {request.path}
            </span>,
            <StatusBadge key={`${request.id}-status`} tone={requestTone(request.statusCode)} label={String(request.statusCode)} />,
            <span key={`${request.id}-duration`}>{request.durationMs} ms</span>,
            <span key={`${request.id}-actor`} className="text-sm text-black/55">
              {request.actorName ?? request.actorUserId ?? "anónimo"}
            </span>,
            formatDate(request.occurredAt)
          ])}
        />

        <Card>
          <CardHeader>
            <CardTitle>Colas y workers</CardTitle>
            <CardDescription>Estado visible de BullMQ desde la API y Redis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.queues.map((queue) => (
              <div key={queue.queueName} className="rounded-2xl border border-black/8 bg-black/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[#132016]">{queue.queueName}</div>
                    <div className="text-sm text-black/50">{formatDate(queue.checkedAt)}</div>
                  </div>
                  <StatusBadge tone={queueTone(queue.status)} label={queueLabel(queue.status)} />
                </div>
                <div className="mt-3 grid grid-cols-5 gap-3 text-sm">
                  <InfoPill label="Waiting" value={String(queue.waiting)} />
                  <InfoPill label="Active" value={String(queue.active)} />
                  <InfoPill label="Delayed" value={String(queue.delayed)} />
                  <InfoPill label="Done" value={String(queue.completed)} />
                  <InfoPill label="Failed" value={String(queue.failed)} />
                </div>
                {queue.detail ? <p className="mt-3 text-sm text-black/55">{queue.detail}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>

      <AdminDataTable
          title="Rutas con mayor actividad"
          description="Top routes por volumen dentro de la ventana observada."
          headers={["Ruta", "Requests", "Avg", "P95", "4xx", "5xx", "Última"]}
          rows={overview.topRoutes.map((route) => [
            <div key={`${route.key}-route`}>
              <div className="font-medium text-[#132016]">{route.path}</div>
              <div className="text-sm text-black/50">{route.method}</div>
            </div>,
            route.totalRequests,
            `${route.averageDurationMs} ms`,
            `${route.p95DurationMs} ms`,
            route.clientErrorRequests,
            route.serverErrorRequests,
            formatDate(route.lastRequestAt)
          ])}
        />

        <AdminDataTable
          title="Eventos de dominio"
          description="Eventos operativos relevantes emitidos por checkout, pagos y notificaciones."
          headers={["Evento", "Categoría", "Severidad", "Detalle", "Fecha"]}
          rows={recentEvents.map((event) => [
            <div key={`${event.id}-action`}>
              <div className="font-medium text-[#132016]">{event.action}</div>
              <div className="text-sm text-black/50">
                {event.relatedType ?? "sin tipo"} {event.relatedId ? `· ${event.relatedId}` : ""}
              </div>
            </div>,
            <Badge key={`${event.id}-category`} tone="neutral">
              {event.category}
            </Badge>,
            <StatusBadge key={`${event.id}-severity`} tone={eventTone(event.severity)} label={event.severity} />,
            <span key={`${event.id}-detail`} className="text-sm text-black/60">
              {event.detail}
            </span>,
            formatDate(event.occurredAt)
          ])}
        />
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-black/40">{label}</div>
      <div className="mt-1 text-sm font-medium text-[#132016]">{value}</div>
    </div>
  );
}
