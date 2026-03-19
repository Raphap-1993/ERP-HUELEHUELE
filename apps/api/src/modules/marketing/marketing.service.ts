import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CampaignRunStatus,
  CampaignStatus,
  type MarketingCampaignInput,
  type MarketingCampaignSummary,
  type MarketingEventSummary,
  type MarketingSegmentSummary,
  type MarketingTemplateSummary
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";

interface MarketingSegmentRecord extends MarketingSegmentSummary {
  createdAt: string;
}

interface MarketingTemplateRecord extends MarketingTemplateSummary {
  createdAt: string;
  bodyPreview: string;
}

interface MarketingCampaignRecord extends MarketingCampaignSummary {
  bodyPreview: string;
  metrics: {
    sent: number;
    delivered: number;
    failed: number;
  };
  history: Array<{
    status: CampaignStatus;
    actor: string;
    occurredAt: string;
    note: string;
  }>;
}

interface MarketingEventRecord extends MarketingEventSummary {
  relatedType?: string;
  relatedId?: string;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeId(value?: string) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || undefined;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildCampaignHistoryEntry(status: CampaignStatus, actor: string, note: string, occurredAt: string) {
  return {
    status,
    actor,
    note,
    occurredAt
  };
}

function describeCampaignState(campaign: MarketingCampaignRecord) {
  return `${campaign.segmentName} · ${campaign.templateName} · ${campaign.channel}`;
}

@Injectable()
export class MarketingService {
  private readonly segments = new Map<string, MarketingSegmentRecord>();

  private readonly templates = new Map<string, MarketingTemplateRecord>();

  private readonly campaigns = new Map<string, MarketingCampaignRecord>();

  private readonly events: MarketingEventRecord[] = [];

  private campaignSequence = 3;

  private eventSequence = 5;

  constructor() {
    this.seedData();
  }

  listCampaigns() {
    const campaigns = Array.from(this.campaigns.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<MarketingCampaignSummary[]>(
      campaigns.map((campaign) => this.toCampaignSummary(campaign)),
      {
        total: campaigns.length,
        running: campaigns.filter((campaign) => campaign.status === CampaignStatus.Running).length,
        scheduled: campaigns.filter((campaign) => campaign.status === CampaignStatus.Scheduled).length,
        completed: campaigns.filter((campaign) => campaign.status === CampaignStatus.Completed).length
      }
    );
  }

  listSegments() {
    const segments = Array.from(this.segments.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<MarketingSegmentSummary[]>(
      segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        definition: segment.definition,
        audienceSize: segment.audienceSize,
        status: segment.status,
        updatedAt: segment.updatedAt
      })),
      {
        total: segments.length,
        active: segments.filter((segment) => segment.status === "active").length,
        inactive: segments.filter((segment) => segment.status === "inactive").length
      }
    );
  }

  listTemplates() {
    const templates = Array.from(this.templates.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<MarketingTemplateSummary[]>(
      templates.map((template) => ({
        id: template.id,
        name: template.name,
        channel: template.channel,
        subject: template.subject,
        status: template.status,
        updatedAt: template.updatedAt
      })),
      {
        total: templates.length,
        active: templates.filter((template) => template.status === "active").length,
        drafts: templates.filter((template) => template.status === "draft").length
      }
    );
  }

  listEvents() {
    const events = [...this.events].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
    return wrapResponse<MarketingEventSummary[]>(
      events.map((event) => ({
        id: event.id,
        eventName: event.eventName,
        source: event.source,
        subject: event.subject,
        payloadSummary: event.payloadSummary,
        occurredAt: event.occurredAt
      })),
      {
        total: events.length
      }
    );
  }

  createCampaign(body: MarketingCampaignInput) {
    const name = normalizeText(body.name);
    const segment = this.requireSegment(body.segmentId);
    const template = this.requireTemplate(body.templateId);
    const goal = normalizeText(body.goal);

    if (!name || !goal) {
      throw new BadRequestException("Nombre y objetivo de campaña son obligatorios.");
    }

    if (template.channel !== body.channel) {
      throw new BadRequestException("La plantilla seleccionada no coincide con el canal indicado.");
    }

    const createdAt = nowIso();
    const scheduledAt = normalizeText(body.scheduledAt);
    const isScheduled = Boolean(scheduledAt);
    const id = `cmp-${String(this.campaignSequence).padStart(3, "0")}`;
    this.campaignSequence += 1;

    const campaign: MarketingCampaignRecord = {
      id,
      name,
      segmentId: segment.id,
      segmentName: segment.name,
      templateId: template.id,
      templateName: template.name,
      channel: body.channel,
      status: isScheduled ? CampaignStatus.Scheduled : CampaignStatus.Running,
      runStatus: isScheduled ? CampaignRunStatus.Queued : CampaignRunStatus.Running,
      recipients: segment.audienceSize,
      goal,
      scheduledAt,
      createdAt,
      updatedAt: createdAt,
      bodyPreview: template.bodyPreview,
      metrics: {
        sent: isScheduled ? 0 : Math.max(1, Math.floor(segment.audienceSize * 0.48)),
        delivered: isScheduled ? 0 : Math.max(1, Math.floor(segment.audienceSize * 0.41)),
        failed: 0
      },
      history: [
        buildCampaignHistoryEntry(
          isScheduled ? CampaignStatus.Scheduled : CampaignStatus.Running,
          "marketing",
          isScheduled ? "Campaña programada desde CRM." : "Campaña iniciada desde CRM.",
          createdAt
        )
      ]
    };

    this.campaigns.set(campaign.id, campaign);

    this.recordEvent(
      "campaign.created",
      "marketing",
      campaign.name,
      describeCampaignState(campaign),
      "campaign",
      campaign.id
    );

    if (isScheduled) {
      this.recordEvent(
        "campaign.scheduled",
        "marketing",
        campaign.name,
        `Programada para ${scheduledAt}`,
        "campaign",
        campaign.id
      );
    }

    return {
      ...actionResponse("queued", "La campaña fue registrada en CRM.", campaign.id),
      campaign: this.toCampaignSummary(campaign)
    };
  }

  recordEvent(
    eventName: string,
    source: string,
    subject: string,
    payloadSummary: string,
    relatedType?: string,
    relatedId?: string
  ) {
    const occurredAt = nowIso();
    const event: MarketingEventRecord = {
      id: `evt-${String(this.eventSequence).padStart(3, "0")}`,
      eventName,
      source,
      subject,
      payloadSummary,
      relatedType,
      relatedId,
      occurredAt
    };
    this.eventSequence += 1;
    this.events.unshift(event);
    return {
      id: event.id,
      eventName: event.eventName,
      source: event.source,
      subject: event.subject,
      payloadSummary: event.payloadSummary,
      occurredAt: event.occurredAt
    } satisfies MarketingEventSummary;
  }

  private requireSegment(id: string) {
    const segment = this.segments.get(id.trim());
    if (!segment) {
      throw new NotFoundException(`No encontramos un segmento con id ${id}.`);
    }

    return segment;
  }

  private requireTemplate(id: string) {
    const template = this.templates.get(id.trim());
    if (!template) {
      throw new NotFoundException(`No encontramos una plantilla con id ${id}.`);
    }

    return template;
  }

  private toCampaignSummary(campaign: MarketingCampaignRecord): MarketingCampaignSummary {
    return {
      id: campaign.id,
      name: campaign.name,
      segmentId: campaign.segmentId,
      segmentName: campaign.segmentName,
      templateId: campaign.templateId,
      templateName: campaign.templateName,
      channel: campaign.channel,
      status: campaign.status,
      runStatus: campaign.runStatus,
      recipients: campaign.recipients,
      goal: campaign.goal,
      scheduledAt: campaign.scheduledAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    };
  }

  private seedData() {
    const segmentSeeds: MarketingSegmentRecord[] = [
      {
        id: "seg-recientes",
        name: "Clientes recientes",
        definition: "Compraron en los últimos 45 días",
        audienceSize: 1280,
        status: "active",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      {
        id: "seg-mayoristas",
        name: "Mayoristas en negociación",
        definition: "Leads con seguimiento comercial en curso",
        audienceSize: 12,
        status: "active",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-18T09:00:00.000Z"
      },
      {
        id: "seg-vendedores",
        name: "Vendedores activos",
        definition: "Códigos aprobados con ventas atribuidas",
        audienceSize: 34,
        status: "active",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-18T09:00:00.000Z"
      }
    ];

    const templateSeeds: MarketingTemplateRecord[] = [
      {
        id: "tpl-reset",
        name: "Reset de marzo",
        channel: "email",
        subject: "Oferta para volver a arrancar",
        status: "active",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-18T09:00:00.000Z",
        bodyPreview: "Secuencia de oferta para retención y recompra"
      },
      {
        id: "tpl-wholesale",
        name: "Seguimiento mayorista",
        channel: "whatsapp",
        subject: "Retoma tu cotización",
        status: "active",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-18T09:00:00.000Z",
        bodyPreview: "Mensaje directo para lead mayorista"
      },
      {
        id: "tpl-recovery",
        name: "Recuperación de carrito",
        channel: "sms",
        subject: "Tu carrito sigue listo",
        status: "draft",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-18T09:00:00.000Z",
        bodyPreview: "Recordatorio corto para checkout incompleto"
      }
    ];

    const campaignSeeds: MarketingCampaignRecord[] = [
      {
        id: "cmp-001",
        name: "Reset de marzo",
        segmentId: segmentSeeds[0].id,
        segmentName: segmentSeeds[0].name,
        templateId: templateSeeds[0].id,
        templateName: templateSeeds[0].name,
        channel: "email",
        status: CampaignStatus.Running,
        runStatus: CampaignRunStatus.Running,
        recipients: segmentSeeds[0].audienceSize,
        goal: "Reactivar clientes con narrativa de reset",
        scheduledAt: undefined,
        createdAt: "2026-03-18T10:00:00.000Z",
        updatedAt: "2026-03-18T10:14:00.000Z",
        bodyPreview: templateSeeds[0].bodyPreview,
        metrics: {
          sent: 812,
          delivered: 768,
          failed: 7
        },
        history: [buildCampaignHistoryEntry(CampaignStatus.Running, "marketing", "Campaña en ejecución.", "2026-03-18T10:00:00.000Z")]
      },
      {
        id: "cmp-002",
        name: "Seguimiento mayorista",
        segmentId: segmentSeeds[1].id,
        segmentName: segmentSeeds[1].name,
        templateId: templateSeeds[1].id,
        templateName: templateSeeds[1].name,
        channel: "whatsapp",
        status: CampaignStatus.Scheduled,
        runStatus: CampaignRunStatus.Queued,
        recipients: segmentSeeds[1].audienceSize,
        goal: "Cierre de cotizaciones pendientes",
        scheduledAt: "2026-03-19T09:00:00.000Z",
        createdAt: "2026-03-18T10:30:00.000Z",
        updatedAt: "2026-03-18T10:30:00.000Z",
        bodyPreview: templateSeeds[1].bodyPreview,
        metrics: {
          sent: 0,
          delivered: 0,
          failed: 0
        },
        history: [buildCampaignHistoryEntry(CampaignStatus.Scheduled, "ventas", "Campaña programada.", "2026-03-18T10:30:00.000Z")]
      }
    ];

    const eventSeeds: MarketingEventRecord[] = [
      {
        id: "evt-001",
        eventName: "wholesale.lead.created",
        source: "web",
        subject: "Distribuidora Andina",
        payloadSummary: "Lead mayorista capturado desde el formulario público.",
        relatedType: "wholesale_lead",
        relatedId: "wl-001",
        occurredAt: "2026-03-18T09:35:00.000Z"
      },
      {
        id: "evt-002",
        eventName: "campaign.run.started",
        source: "marketing",
        subject: "Reset de marzo",
        payloadSummary: "Corrida iniciada con segmento de clientes recientes.",
        relatedType: "campaign",
        relatedId: "cmp-001",
        occurredAt: "2026-03-18T10:00:00.000Z"
      },
      {
        id: "evt-003",
        eventName: "wholesale.quote.sent",
        source: "ventas",
        subject: "Ruta Norte",
        payloadSummary: "Cotización enviada y seguida por ventas.",
        relatedType: "wholesale_quote",
        relatedId: "wq-002",
        occurredAt: "2026-03-18T10:25:00.000Z"
      }
    ];

    for (const segment of segmentSeeds) {
      this.segments.set(segment.id, segment);
    }

    for (const template of templateSeeds) {
      this.templates.set(template.id, template);
    }

    for (const campaign of campaignSeeds) {
      this.campaigns.set(campaign.id, campaign);
      const numeric = Number(campaign.id.replace(/[^\d]/g, ""));
      if (Number.isFinite(numeric)) {
        this.campaignSequence = Math.max(this.campaignSequence, numeric + 1);
      }
    }

    this.events.push(
      ...eventSeeds.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    );
    const eventSequence = this.events.reduce((max, event) => {
      const numeric = Number(event.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    this.eventSequence = Math.max(this.eventSequence, eventSequence + 1);
  }
}
