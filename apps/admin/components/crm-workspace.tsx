"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MetricCard,
  SectionHeader,
  StatusBadge
} from "@huelegood/ui";
import {
  CampaignRunStatus,
  CampaignStatus,
  type MarketingCampaignSummary,
  type MarketingEventSummary,
  type MarketingSegmentSummary,
  type MarketingTemplateSummary
} from "@huelegood/shared";
import { fetchCampaignEvents, fetchCampaignSegments, fetchCampaigns, fetchCampaignTemplates } from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function campaignTone(status: MarketingCampaignSummary["status"]) {
  if (status === CampaignStatus.Running) {
    return "success";
  }

  if (status === CampaignStatus.Scheduled) {
    return "warning";
  }

  if (status === CampaignStatus.Completed) {
    return "info";
  }

  if (status === CampaignStatus.Cancelled) {
    return "danger";
  }

  return "neutral";
}

function runTone(status: MarketingCampaignSummary["runStatus"]) {
  if (status === CampaignRunStatus.Running) {
    return "success";
  }

  if (status === CampaignRunStatus.Queued) {
    return "warning";
  }

  if (status === CampaignRunStatus.Completed) {
    return "info";
  }

  if (status === CampaignRunStatus.Failed) {
    return "danger";
  }

  return "neutral";
}

function templateTone(status: MarketingTemplateSummary["status"]) {
  if (status === "active") {
    return "success";
  }

  if (status === "draft") {
    return "warning";
  }

  if (status === "archived") {
    return "neutral";
  }

  return "info";
}

export function CrmWorkspace() {
  const [campaigns, setCampaigns] = useState<MarketingCampaignSummary[]>([]);
  const [segments, setSegments] = useState<MarketingSegmentSummary[]>([]);
  const [templates, setTemplates] = useState<MarketingTemplateSummary[]>([]);
  const [events, setEvents] = useState<MarketingEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [campaignsResponse, segmentsResponse, templatesResponse, eventsResponse] = await Promise.all([
          fetchCampaigns(),
          fetchCampaignSegments(),
          fetchCampaignTemplates(),
          fetchCampaignEvents()
        ]);

        if (!active) {
          return;
        }

        setCampaigns(campaignsResponse.data);
        setSegments(segmentsResponse.data);
        setTemplates(templatesResponse.data);
        setEvents(eventsResponse.data);
        setError(null);
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar CRM.");
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
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Segmentos",
        value: String(segments.length),
        detail: "Audiencias disponibles."
      },
      {
        label: "Activos",
        value: String(segments.filter((segment) => segment.status === "active").length),
        detail: "Segmentos listos para campañas."
      },
      {
        label: "Plantillas",
        value: String(templates.length),
        detail: "Mensajes reutilizables."
      },
      {
        label: "Eventos",
        value: String(events.length),
        detail: "Señales de CRM y comercio."
      }
    ],
    [events, segments, templates]
  );

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="CRM básico"
        description="Segmentación, eventos y trazabilidad comercial sin depender de herramientas externas."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lectura CRM</CardTitle>
            <CardDescription>Qué hace el módulo y cómo se conecta con marketing y mayoristas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-black/65">
            <p>1. Los segmentos definen audiencias por comportamiento, origen o pipeline comercial.</p>
            <p>2. Cada campaña se apoya en un segmento y deja registro de corrida y programación.</p>
            <p>3. Los eventos capturan hitos de negocio como leads mayoristas, campañas y seguimiento.</p>
            <p>4. El equipo comercial puede leer el estado sin depender de una suite externa.</p>
            <div className="rounded-3xl border border-black/10 bg-[#132016] p-4 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/55">Objetivo</p>
              <p className="mt-2 text-sm leading-6 text-white/82">
                Mantener trazabilidad suficiente para operar campañas y seguimiento comercial dentro del monolito
                modular de Huelegood.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado operativo</CardTitle>
            <CardDescription>Señales resumidas de marketing y CRM.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-black/65">
            {campaigns.slice(0, 3).map((campaign) => (
              <div key={campaign.id} className="rounded-3xl border border-black/10 bg-black/[0.02] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-[#132016]">{campaign.name}</div>
                    <p className="text-sm text-black/55">
                      {campaign.segmentName} · {campaign.templateName}
                    </p>
                  </div>
                  <StatusBadge label={campaign.status} tone={campaignTone(campaign.status)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge label={campaign.runStatus} tone={runTone(campaign.runStatus)} />
                  <StatusBadge label={campaign.channel} tone="info" />
                </div>
              </div>
            ))}
            {!campaigns.length ? <p>No hay campañas registradas.</p> : null}
          </CardContent>
        </Card>
      </div>

      <AdminDataTable
        title="Segmentos"
        description="Audiencias y segmentos usados por CRM y campañas."
        headers={["Segmento", "Definición", "Audiencia", "Estado", "Actualizado"]}
        rows={segments.map((segment) => [
          segment.name,
          segment.definition,
          String(segment.audienceSize),
          <StatusBadge
            key={`${segment.id}-status`}
            label={segment.status}
            tone={segment.status === "active" ? "success" : "neutral"}
          />,
          formatDate(segment.updatedAt)
        ])}
      />

      <AdminDataTable
        title="Plantillas"
        description="Base editorial para emails, SMS y WhatsApp."
        headers={["Plantilla", "Canal", "Asunto", "Estado", "Actualizado"]}
        rows={templates.map((template) => [
          template.name,
          template.channel,
          template.subject,
          <StatusBadge key={`${template.id}-status`} label={template.status} tone={templateTone(template.status)} />,
          formatDate(template.updatedAt)
        ])}
      />

      <AdminDataTable
        title="Eventos CRM"
        description="Registro cronológico de señales de negocio."
        headers={["Evento", "Fuente", "Sujeto", "Detalle", "Fecha"]}
        rows={events.map((event) => [
          event.eventName,
          event.source,
          event.subject,
          event.payloadSummary,
          formatDate(event.occurredAt)
        ])}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando CRM...</p> : null}
    </div>
  );
}
