import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
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
import { AuditService } from "../audit/audit.service";
import { ModuleStateService } from "../../persistence/module-state.service";

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

interface MarketingSnapshot {
  segments: MarketingSegmentRecord[];
  templates: MarketingTemplateRecord[];
  campaigns: MarketingCampaignRecord[];
  events: MarketingEventRecord[];
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

const demoMarketingSegmentIds = new Set(["seg-recientes", "seg-mayoristas", "seg-vendedores"]);

const demoMarketingTemplateIds = new Set(["tpl-reset", "tpl-wholesale", "tpl-recovery"]);

const demoMarketingCampaignIds = new Set(["cmp-001", "cmp-002"]);

const demoMarketingEventIds = new Set(["evt-001", "evt-002", "evt-003"]);

const demoWholesaleLeadIds = new Set(["wl-001", "wl-002"]);

const demoWholesaleQuoteIds = new Set(["wq-001", "wq-002"]);

@Injectable()
export class MarketingService implements OnModuleInit {
  private readonly segments = new Map<string, MarketingSegmentRecord>();

  private readonly templates = new Map<string, MarketingTemplateRecord>();

  private readonly campaigns = new Map<string, MarketingCampaignRecord>();

  private readonly events: MarketingEventRecord[] = [];

  private campaignSequence = 3;

  private eventSequence = 5;

  private readonly productionMode = process.env.NODE_ENV === "production";

  constructor(
    private readonly auditService: AuditService,
    private readonly moduleStateService: ModuleStateService
  ) {
    if (!this.productionMode) {
      this.seedData();
    }
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<MarketingSnapshot>("marketing");
    if (snapshot) {
      const normalizedSnapshot = this.productionMode ? this.cleanProductionSnapshot(snapshot) : { snapshot, changed: false };
      this.restoreSnapshot(normalizedSnapshot.snapshot);
      if (normalizedSnapshot.changed) {
        await this.persistState();
      }
      return;
    }

    await this.persistState();
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
    this.auditService.recordAdminAction({
      actionType: "marketing.campaign.created",
      targetType: "campaign",
      targetId: campaign.id,
      summary: `La campaña ${campaign.name} quedó registrada.`,
      actorName: "marketing",
      metadata: {
        segmentId: campaign.segmentId,
        templateId: campaign.templateId,
        channel: campaign.channel,
        scheduledAt: campaign.scheduledAt
      }
    });

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

    void this.persistState();

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
    void this.persistState();
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

  private cleanProductionSnapshot(snapshot: MarketingSnapshot) {
    const originalSegments = snapshot.segments ?? [];
    const originalTemplates = snapshot.templates ?? [];
    const originalCampaigns = snapshot.campaigns ?? [];
    const originalEvents = snapshot.events ?? [];

    const segments = originalSegments.filter((segment) => !demoMarketingSegmentIds.has(segment.id));
    const templates = originalTemplates.filter((template) => !demoMarketingTemplateIds.has(template.id));
    const keptSegmentIds = new Set(segments.map((segment) => segment.id));
    const keptTemplateIds = new Set(templates.map((template) => template.id));
    const campaigns = originalCampaigns.filter(
      (campaign) =>
        !demoMarketingCampaignIds.has(campaign.id) &&
        keptSegmentIds.has(campaign.segmentId) &&
        keptTemplateIds.has(campaign.templateId)
    );
    const keptCampaignIds = new Set(campaigns.map((campaign) => campaign.id));
    const events = originalEvents.filter((event) => this.shouldKeepProductionEvent(event, keptCampaignIds));

    return {
      snapshot: {
        segments,
        templates,
        campaigns,
        events
      },
      changed:
        segments.length !== originalSegments.length ||
        templates.length !== originalTemplates.length ||
        campaigns.length !== originalCampaigns.length ||
        events.length !== originalEvents.length
    };
  }

  private shouldKeepProductionEvent(event: MarketingEventRecord, campaignIds: Set<string>) {
    if (demoMarketingEventIds.has(event.id)) {
      return false;
    }

    if (event.relatedType === "campaign" && event.relatedId && !campaignIds.has(event.relatedId)) {
      return false;
    }

    if (event.relatedType === "wholesale_lead" && event.relatedId && demoWholesaleLeadIds.has(event.relatedId)) {
      return false;
    }

    if (event.relatedType === "wholesale_quote" && event.relatedId && demoWholesaleQuoteIds.has(event.relatedId)) {
      return false;
    }

    return true;
  }

  private restoreSnapshot(snapshot: MarketingSnapshot) {
    this.segments.clear();
    this.templates.clear();
    this.campaigns.clear();
    this.events.splice(0, this.events.length);

    for (const segment of snapshot.segments ?? []) {
      this.segments.set(segment.id, segment);
    }

    for (const template of snapshot.templates ?? []) {
      this.templates.set(template.id, template);
    }

    for (const campaign of snapshot.campaigns ?? []) {
      this.campaigns.set(campaign.id, campaign);
    }

    this.events.push(...(snapshot.events ?? []));
    this.syncSequences();
  }

  private syncSequences() {
    const campaignSequence = Array.from(this.campaigns.values()).reduce((max, campaign) => {
      const numeric = Number(campaign.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const eventSequence = this.events.reduce((max, event) => {
      const numeric = Number(event.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);

    this.campaignSequence = Math.max(campaignSequence + 1, 1);
    this.eventSequence = Math.max(eventSequence + 1, 1);
  }

  private async persistState() {
    await this.moduleStateService.save<MarketingSnapshot>("marketing", this.buildSnapshot());
  }

  private buildSnapshot(): MarketingSnapshot {
    return {
      segments: Array.from(this.segments.values()).map((segment) => ({ ...segment })),
      templates: Array.from(this.templates.values()).map((template) => ({ ...template })),
      campaigns: Array.from(this.campaigns.values()).map((campaign) => ({
        ...campaign,
        metrics: { ...campaign.metrics },
        history: campaign.history.map((entry) => ({ ...entry }))
      })),
      events: this.events.map((event) => ({ ...event }))
    };
  }
}
