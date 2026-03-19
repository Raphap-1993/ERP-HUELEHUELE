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
  StatusBadge
} from "@huelegood/ui";
import {
  type AuditLogSummary,
  type AuditOverviewSummary,
  type OperationalHealthSummary,
  type SecurityPostureSummary
} from "@huelegood/shared";
import { fetchAuditOverview, fetchOperationalHealth, fetchSecurityPosture } from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function severityTone(severity: AuditLogSummary["severity"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (severity === "critical" || severity === "error") {
    return "danger";
  }

  if (severity === "warning") {
    return "warning";
  }

  return "info";
}

function dependencyTone(status: OperationalHealthSummary["dependencies"][number]["status"]) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "degraded") {
    return "warning";
  }

  return "danger";
}

function dependencyLabel(status: OperationalHealthSummary["dependencies"][number]["status"]) {
  const labels: Record<OperationalHealthSummary["dependencies"][number]["status"], string> = {
    healthy: "Saludable",
    degraded: "Degradado",
    missing: "Faltante"
  };

  return labels[status];
}

function postureStatusLabel(posture: SecurityPostureSummary) {
  return posture.auditPolicy.persistence === "prisma" ? "Persistido" : "Memoria";
}

export function AuditWorkspace() {
  const [overview, setOverview] = useState<AuditOverviewSummary>({
    logs: [],
    actions: [],
    totalLogs: 0,
    totalActions: 0,
    severityCounts: {
      info: 0,
      warning: 0,
      error: 0,
      critical: 0
    },
    modules: []
  });
  const [security, setSecurity] = useState<SecurityPostureSummary | null>(null);
  const [health, setHealth] = useState<OperationalHealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [overviewResponse, securityResponse, healthResponse] = await Promise.all([
          fetchAuditOverview(),
          fetchSecurityPosture(),
          fetchOperationalHealth()
        ]);

        if (!active) {
          return;
        }

        setOverview(overviewResponse.data);
        setSecurity(securityResponse.data);
        setHealth(healthResponse);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar auditoría.");
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

  const metrics = useMemo(
    () => [
      {
        label: "Audit logs",
        value: String(overview.totalLogs),
        detail: "Trazas registradas por módulos."
      },
      {
        label: "Admin actions",
        value: String(overview.totalActions),
        detail: "Cambios operativos del backoffice."
      },
      {
        label: "Bloqueos",
        value: String(security?.telemetry.blockedRequests ?? 0),
        detail: "Solicitudes frenadas por rate limit."
      },
      {
        label: "Dependencias sanas",
        value: String(health?.dependencies.filter((dependency) => dependency.status === "healthy").length ?? 0),
        detail: "Chequeos operativos de base."
      }
    ],
    [health, overview.totalActions, overview.totalLogs, security]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  const recentLogs = overview.logs.slice(0, 15);
  const recentActions = overview.actions.slice(0, 15);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={refresh} variant="secondary" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar estado"}
        </Button>
        {security ? <Badge tone="info">Auditoría {postureStatusLabel(security)}</Badge> : null}
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Postura de seguridad</CardTitle>
            <CardDescription>Headers, rate limiting, CORS y política de autenticación.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {security ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoPill label="CORS" value={security.cors.enabled ? "Activo" : "Inactivo"} tone={security.cors.enabled ? "success" : "danger"} />
                  <InfoPill
                    label="Trust proxy"
                    value={security.trustProxy ? "Activo" : "Inactivo"}
                    tone={security.trustProxy ? "success" : "danger"}
                  />
                  <InfoPill label="Request ID" value={security.requestIdHeader} tone="info" />
                  <InfoPill label="Persistencia" value={security.auditPolicy.persistence} tone="info" />
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-[#132016]">Headers</div>
                  <div className="flex flex-wrap gap-2">
                    {security.headers.map((header) => (
                      <Badge key={header.name} tone="neutral">
                        {header.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-[#132016]">Rate limits</div>
                  <div className="space-y-2">
                    {security.rateLimits.map((rateLimit) => (
                      <div key={rateLimit.profile} className="flex items-center justify-between gap-3 rounded-2xl border border-black/8 bg-black/3 px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium text-[#132016]">{rateLimit.profile}</div>
                          <div className="text-black/50">{rateLimit.routePrefix}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[#132016]">
                            {rateLimit.limit} / {Math.round(rateLimit.windowMs / 1000)}s
                          </div>
                          <div className="text-black/50">{rateLimit.blockedRequests} bloqueos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoPill label="Sesión" value={`${security.authPolicy.sessionTtlHours}h`} tone="info" />
                  <InfoPill label="Password min" value={`${security.authPolicy.passwordMinLength} chars`} tone="info" />
                </div>
              </>
            ) : (
              <p className="text-sm text-black/55">No pudimos cargar la postura de seguridad.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salud operativa</CardTitle>
            <CardDescription>Chequeos de base para despliegue y soporte en VPS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {health ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoPill label="Estado" value={health.status === "ok" ? "Ok" : "Degradado"} tone={health.status === "ok" ? "success" : "warning"} />
                  <InfoPill label="Entorno" value={health.environment} tone="info" />
                  <InfoPill label="Puerto" value={String(health.port)} tone="info" />
                  <InfoPill label="Uptime" value={`${Math.round(health.uptimeSeconds / 60)} min`} tone="info" />
                </div>

                <div className="rounded-3xl border border-black/8 bg-black/3 p-4">
                  <div className="mb-3 text-sm font-medium text-[#132016]">Dependencias</div>
                  <div className="space-y-2">
                    {health.dependencies.map((dependency) => (
                      <div key={dependency.name} className="flex items-center justify-between gap-3 text-sm">
                        <div className="space-y-1">
                          <div className="font-medium text-[#132016]">{dependency.name}</div>
                          <div className="text-black/50">{dependency.detail}</div>
                        </div>
                        <div className="text-right">
                          <StatusBadge tone={dependencyTone(dependency.status)} label={dependencyLabel(dependency.status)} />
                          <div className="mt-1 text-xs text-black/45">
                            {dependency.latencyMs ? `${dependency.latencyMs} ms` : "Sin latencia"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoPill label="RSS" value={`${health.memory.rssMb} MB`} tone="info" />
                  <InfoPill label="Heap usado" value={`${health.memory.heapUsedMb} MB`} tone="info" />
                </div>
              </>
            ) : (
              <p className="text-sm text-black/55">No pudimos cargar la salud operativa.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <AdminDataTable
        title="Audit logs recientes"
        description="Eventos trazables del sistema y del backoffice."
        headers={["Fecha", "Módulo", "Acción", "Entidad", "Severidad", "Resumen"]}
        rows={recentLogs.map((log) => [
          formatDate(log.occurredAt),
          log.module,
          log.action,
          `${log.entityType}:${log.entityId}`,
          <StatusBadge key={`${log.id}-severity`} tone={severityTone(log.severity)} label={log.severity} />,
          log.summary
        ])}
      />

      <AdminDataTable
        title="Admin actions recientes"
        description="Cambios de backoffice que requieren trazabilidad de operación."
        headers={["Fecha", "Tipo", "Objetivo", "Actor", "Resumen", "Detalle"]}
        rows={recentActions.map((action) => [
          formatDate(action.occurredAt),
          action.actionType,
          `${action.targetType}:${action.targetId}`,
          action.actorName ?? action.actorUserId ?? "Sistema",
          action.summary,
          action.metadataSummary ?? "Sin metadatos"
        ])}
      />
    </div>
  );
}

function InfoPill({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <div className="rounded-2xl border border-black/8 bg-black/3 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-black/45">{label}</div>
      <StatusBadge tone={tone} label={value} />
    </div>
  );
}
