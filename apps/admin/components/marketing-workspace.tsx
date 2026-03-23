"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDataTable,
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
  Input,
  MetricCard,
  SectionHeader,
  StatusBadge,
  Textarea
} from "@huelegood/ui";
import {
  CampaignRunStatus,
  CampaignStatus,
  type MarketingCampaignInput,
  type MarketingCampaignSummary,
  type MarketingSegmentSummary,
  type MarketingTemplateSummary
} from "@huelegood/shared";
import {
  createCampaign,
  fetchCampaignSegments,
  fetchCampaigns,
  fetchCampaignTemplates
} from "../lib/api";

function formatDate(value?: string) {
  if (!value) {
    return "Sin programación";
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

export function MarketingWorkspace() {
  const [campaigns, setCampaigns] = useState<MarketingCampaignSummary[]>([]);
  const [segments, setSegments] = useState<MarketingSegmentSummary[]>([]);
  const [templates, setTemplates] = useState<MarketingTemplateSummary[]>([]);
  const [campaignName, setCampaignName] = useState("Nueva campaña comercial");
  const [goal, setGoal] = useState("Impulsar recompra, seguimiento y activación comercial");
  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [channel, setChannel] = useState<MarketingCampaignInput["channel"]>("email");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);

      try {
        const [campaignsResponse, segmentsResponse, templatesResponse] = await Promise.all([
          fetchCampaigns(),
          fetchCampaignSegments(),
          fetchCampaignTemplates()
        ]);

        if (!active) {
          return;
        }

        setCampaigns(campaignsResponse.data);
        setSegments(segmentsResponse.data);
        setTemplates(templatesResponse.data);
        setError(null);

        if (!selectedSegmentId && segmentsResponse.data[0]) {
          setSelectedSegmentId(segmentsResponse.data[0].id);
        }

        if (!selectedTemplateId && templatesResponse.data[0]) {
          setSelectedTemplateId(templatesResponse.data[0].id);
        }
      } catch (fetchError) {
        if (active) {
          setError(fetchError instanceof Error ? fetchError.message : "No pudimos cargar campañas.");
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
    if (!segments.length) {
      setSelectedSegmentId("");
      return;
    }

    if (!selectedSegmentId || !segments.some((segment) => segment.id === selectedSegmentId)) {
      setSelectedSegmentId(segments[0].id);
    }
  }, [segments, selectedSegmentId]);

  useEffect(() => {
    if (!templates.length) {
      setSelectedTemplateId("");
      return;
    }

    if (!selectedTemplateId || !templates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [selectedTemplateId, templates]);

  const selectedSegment = useMemo(
    () => segments.find((segment) => segment.id === selectedSegmentId) ?? null,
    [segments, selectedSegmentId]
  );

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );

  const metrics = useMemo(
    () => [
      {
        label: "Campañas",
        value: String(campaigns.length),
        detail: "Registro operativo desde CRM."
      },
      {
        label: "Activas",
        value: String(campaigns.filter((campaign) => campaign.status === CampaignStatus.Running).length),
        detail: "En ejecución."
      },
      {
        label: "Programadas",
        value: String(campaigns.filter((campaign) => campaign.status === CampaignStatus.Scheduled).length),
        detail: "Listas para lanzar."
      },
      {
        label: "Completadas",
        value: String(campaigns.filter((campaign) => campaign.status === CampaignStatus.Completed).length),
        detail: "Ya pasaron por corrida."
      }
    ],
    [campaigns]
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleCreateCampaign() {
    if (!selectedSegmentId || !selectedTemplateId) {
      setError("Selecciona un segmento y una plantilla antes de crear la campaña.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createCampaign({
        name: campaignName.trim(),
        segmentId: selectedSegmentId,
        templateId: selectedTemplateId,
        channel,
        goal: goal.trim(),
        scheduledAt: scheduledAt.trim() || undefined
      });

      setCampaignName("Nueva campaña comercial");
      setGoal("Impulsar recompra, seguimiento y activación comercial");
      setScheduledAt("");
      refresh();
      setCampaignModalOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "No pudimos crear la campaña.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Marketing"
        description="Campañas, plantillas y seguimiento comercial con trazabilidad operativa."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCampaignModalOpen(true)}>Nueva campaña</Button>
      </div>

      <Dialog open={campaignModalOpen} onClose={() => setCampaignModalOpen(false)} size="lg">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva campaña</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[#132016]" htmlFor="campaign-name">
                  Nombre
                </label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  placeholder="Ej. Reset de abril"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[#132016]" htmlFor="campaign-goal">
                  Objetivo
                </label>
                <Textarea
                  id="campaign-goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="Describe el resultado comercial esperado"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#132016]" htmlFor="campaign-segment">
                  Segmento
                </label>
                <select
                  id="campaign-segment"
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                  value={selectedSegmentId}
                  onChange={(event) => setSelectedSegmentId(event.target.value)}
                >
                  {segments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#132016]" htmlFor="campaign-template">
                  Plantilla
                </label>
                <select
                  id="campaign-template"
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#132016]" htmlFor="campaign-channel">
                  Canal
                </label>
                <select
                  id="campaign-channel"
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm outline-none focus:border-black/25"
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as MarketingCampaignInput["channel"])}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#132016]" htmlFor="campaign-schedule">
                  Programación
                </label>
                <Input
                  id="campaign-schedule"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
              {(selectedSegment || selectedTemplate) ? (
                <div className="md:col-span-2 space-y-3">
                  {selectedSegment ? (
                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-sm text-black/65">
                      <p className="text-xs uppercase tracking-[0.18em] text-black/45">Segmento</p>
                      <p className="mt-1 font-semibold text-[#132016]">{selectedSegment.name}</p>
                      <p className="text-black/55">Audiencia: {selectedSegment.audienceSize}</p>
                    </div>
                  ) : null}
                  {selectedTemplate ? (
                    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-3 text-sm text-black/65">
                      <p className="text-xs uppercase tracking-[0.18em] text-black/45">Plantilla</p>
                      <p className="mt-1 font-semibold text-[#132016]">{selectedTemplate.name} · {selectedTemplate.subject}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => void handleCreateCampaign()} disabled={submitting}>
              {submitting ? "Guardando..." : "Crear campaña"}
            </Button>
            <Button variant="secondary" onClick={() => setCampaignModalOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminDataTable
        title="Campañas"
        description="Registro de campañas, programación y estado de corrida."
        headers={["Campaña", "Segmento", "Canal", "Estado", "Corrida", "Destinatarios", "Programada"]}
        rows={campaigns.map((campaign) => [
          campaign.name,
          campaign.segmentName,
          <StatusBadge key={`${campaign.id}-channel`} label={campaign.channel} tone="info" />,
          <StatusBadge key={`${campaign.id}-status`} label={campaign.status} tone={campaignTone(campaign.status)} />,
          <StatusBadge key={`${campaign.id}-run`} label={campaign.runStatus} tone={runTone(campaign.runStatus)} />,
          String(campaign.recipients),
          formatDate(campaign.scheduledAt)
        ])}
      />

      <AdminDataTable
        title="Plantillas disponibles"
        description="Base de contenido reutilizable para campañas y CRM."
        headers={["Plantilla", "Canal", "Asunto", "Estado", "Actualizado"]}
        rows={templates.map((template) => [
          template.name,
          template.channel,
          template.subject,
          <StatusBadge key={`${template.id}-status`} label={template.status} tone={template.status === "active" ? "success" : template.status === "draft" ? "warning" : "neutral"} />,
          formatDate(template.updatedAt)
        ])}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="text-sm text-black/55">Cargando campañas...</p> : null}
    </div>
  );
}
