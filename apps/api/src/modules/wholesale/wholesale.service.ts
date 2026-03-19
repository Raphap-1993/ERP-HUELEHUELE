import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import {
  WholesaleLeadStatus,
  WholesaleQuoteStatus,
  type WholesaleLeadInput,
  type WholesaleLeadStatusInput,
  type WholesaleLeadSummary,
  type WholesaleQuoteAdminSummary,
  type WholesaleQuoteInput
} from "@huelegood/shared";
import { wholesalePlans } from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { MarketingService } from "../marketing/marketing.service";

interface WholesaleLeadHistoryEntry {
  status: WholesaleLeadStatus;
  actor: string;
  occurredAt: string;
  note: string;
}

interface WholesaleLeadRecord extends WholesaleLeadSummary {
  history: WholesaleLeadHistoryEntry[];
  quoteIds: string[];
}

interface WholesaleQuoteRecord extends WholesaleQuoteAdminSummary {
  leadCompany: string;
  leadStatus: WholesaleLeadStatus;
  items: Array<{
    label: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  history: Array<{
    status: WholesaleQuoteStatus;
    actor: string;
    occurredAt: string;
    note: string;
  }>;
}

const leadStatusLabels: Record<WholesaleLeadStatus, string> = {
  [WholesaleLeadStatus.New]: "Nuevo",
  [WholesaleLeadStatus.Qualified]: "Calificado",
  [WholesaleLeadStatus.Quoted]: "Cotizado",
  [WholesaleLeadStatus.Negotiating]: "Negociando",
  [WholesaleLeadStatus.Won]: "Ganado",
  [WholesaleLeadStatus.Lost]: "Perdido"
};

const quoteStatusLabels: Record<WholesaleQuoteStatus, string> = {
  [WholesaleQuoteStatus.Draft]: "Borrador",
  [WholesaleQuoteStatus.Sent]: "Enviada",
  [WholesaleQuoteStatus.Accepted]: "Aceptada",
  [WholesaleQuoteStatus.Rejected]: "Rechazada",
  [WholesaleQuoteStatus.Expired]: "Expirada"
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeEmail(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : undefined;
}

function normalizeCompany(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  return normalized ? normalized : undefined;
}

function normalizeStatus(value?: string) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function leadHistory(status: WholesaleLeadStatus, actor: string, note: string, occurredAt: string) {
  return {
    status,
    label: leadStatusLabels[status],
    actor,
    note,
    occurredAt
  };
}

function quoteHistory(status: WholesaleQuoteStatus, actor: string, note: string, occurredAt: string) {
  return {
    status,
    label: quoteStatusLabels[status],
    actor,
    note,
    occurredAt
  };
}

@Injectable()
export class WholesaleService {
  private readonly leads = new Map<string, WholesaleLeadRecord>();

  private readonly quotes = new Map<string, WholesaleQuoteRecord>();

  private leadSequence = 3;

  private quoteSequence = 3;

  constructor(private readonly marketingService: MarketingService) {
    this.seedData();
  }

  listLeads() {
    const leads = Array.from(this.leads.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<WholesaleLeadSummary[]>(
      leads.map((lead) => this.toLeadSummary(lead)),
      {
        total: leads.length,
        new: leads.filter((lead) => lead.status === WholesaleLeadStatus.New).length,
        qualified: leads.filter((lead) => lead.status === WholesaleLeadStatus.Qualified).length,
        quoted: leads.filter((lead) => lead.status === WholesaleLeadStatus.Quoted).length,
        negotiating: leads.filter((lead) => lead.status === WholesaleLeadStatus.Negotiating).length,
        won: leads.filter((lead) => lead.status === WholesaleLeadStatus.Won).length,
        lost: leads.filter((lead) => lead.status === WholesaleLeadStatus.Lost).length
      }
    );
  }

  listQuotes() {
    const quotes = Array.from(this.quotes.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<WholesaleQuoteAdminSummary[]>(
      quotes.map((quote) => this.toQuoteSummary(quote)),
      {
        total: quotes.length,
        draft: quotes.filter((quote) => quote.status === WholesaleQuoteStatus.Draft).length,
        sent: quotes.filter((quote) => quote.status === WholesaleQuoteStatus.Sent).length,
        accepted: quotes.filter((quote) => quote.status === WholesaleQuoteStatus.Accepted).length,
        rejected: quotes.filter((quote) => quote.status === WholesaleQuoteStatus.Rejected).length,
        expired: quotes.filter((quote) => quote.status === WholesaleQuoteStatus.Expired).length
      }
    );
  }

  listTiers() {
    return wrapResponse(wholesalePlans, {
      total: wholesalePlans.length
    });
  }

  submitLead(body: WholesaleLeadInput) {
    const company = normalizeCompany(body.company);
    const contact = normalizeText(body.contact);
    const email = normalizeEmail(body.email);
    const city = normalizeText(body.city);

    if (!company || !contact || !email || !city) {
      throw new BadRequestException("Empresa, contacto, correo y ciudad son obligatorios.");
    }

    if (this.findLeadByEmail(email) || this.findLeadByCompany(company)) {
      throw new ConflictException("Ya existe un lead mayorista con ese correo o empresa.");
    }

    const createdAt = nowIso();
    const id = `wl-${String(this.leadSequence).padStart(3, "0")}`;
    this.leadSequence += 1;

    const lead: WholesaleLeadRecord = {
      id,
      company,
      contact,
      email,
      city,
      source: normalizeText(body.source) || "Landing mayorista",
      status: WholesaleLeadStatus.New,
      phone: normalizeText(body.phone),
      notes: normalizeText(body.notes),
      reviewer: undefined,
      reviewedAt: undefined,
      quoteCount: 0,
      createdAt,
      updatedAt: createdAt,
      history: [leadHistory(WholesaleLeadStatus.New, "web", "Lead mayorista capturado desde el formulario público.", createdAt)],
      quoteIds: []
    };

    this.leads.set(lead.id, lead);
    this.marketingService.recordEvent(
      "wholesale.lead.created",
      "web",
      lead.company,
      `${lead.contact} · ${lead.city} · ${lead.email}`,
      "wholesale_lead",
      lead.id
    );

    return {
      ...actionResponse("queued", "El lead mayorista fue registrado para seguimiento comercial.", lead.id),
      lead: this.toLeadSummary(lead),
      nextStep: "Ventas revisará la oportunidad y podrá calificarla o cotizarla."
    };
  }

  updateLeadStatus(id: string, body: WholesaleLeadStatusInput) {
    const lead = this.requireLead(id);
    const status = normalizeStatus(body.status);

    if (!status || !Object.values(WholesaleLeadStatus).includes(status as WholesaleLeadStatus)) {
      throw new BadRequestException("Estado de lead inválido.");
    }

    const nextStatus = status as WholesaleLeadStatus;
    const now = nowIso();
    const reviewer = normalizeText(body.reviewer) || "ventas";
    const notes = normalizeText(body.notes) || `Lead actualizado a ${leadStatusLabels[nextStatus]}.`;

    lead.status = nextStatus;
    lead.reviewer = reviewer;
    lead.reviewedAt = now;
    lead.updatedAt = now;
    lead.history.push(leadHistory(nextStatus, reviewer, notes, now));

    this.marketingService.recordEvent(
      `wholesale.lead.${nextStatus}`,
      "ventas",
      lead.company,
      `${lead.contact} · ${lead.city} · ${notes}`,
      "wholesale_lead",
      lead.id
    );

    return {
      ...actionResponse("ok", "El estado del lead fue actualizado.", lead.id),
      lead: this.toLeadSummary(lead)
    };
  }

  createQuote(body: WholesaleQuoteInput) {
    const lead = this.requireLead(body.leadId);
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("El monto de la cotización debe ser mayor a cero.");
    }

    const createdAt = nowIso();
    const id = `wq-${String(this.quoteSequence).padStart(3, "0")}`;
    this.quoteSequence += 1;
    const status = body.status ?? WholesaleQuoteStatus.Sent;
    const items = body.items?.length
      ? body.items.map((item) => ({
          label: item.label.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          lineTotal: roundCurrency(Number(item.quantity) * Number(item.unitPrice))
        }))
      : [
          {
            label: "Pedido mayorista",
            quantity: 1,
            unitPrice: amount,
            lineTotal: amount
          }
        ];

    const quote: WholesaleQuoteRecord = {
      id,
      leadId: lead.id,
      company: lead.company,
      contact: lead.contact,
      email: lead.email,
      status,
      amount: roundCurrency(amount),
      currencyCode: "MXN",
      itemsCount: items.length,
      notes: normalizeText(body.notes),
      reviewer: undefined,
      sentAt: status === WholesaleQuoteStatus.Sent || status === WholesaleQuoteStatus.Accepted ? createdAt : undefined,
      expiresAt: normalizeText(body.expiresAt),
      createdAt,
      updatedAt: createdAt,
      leadCompany: lead.company,
      leadStatus: lead.status,
      items,
      history: [
        quoteHistory(
          status,
          "ventas",
          status === WholesaleQuoteStatus.Sent
            ? "Cotización enviada desde administración."
            : status === WholesaleQuoteStatus.Accepted
              ? "Cotización aceptada por la operación."
              : "Cotización creada desde administración.",
          createdAt
        )
      ]
    };

    this.quotes.set(quote.id, quote);
    lead.quoteIds.push(quote.id);
    lead.updatedAt = createdAt;
    lead.quoteCount = lead.quoteIds.length;
    lead.status = status === WholesaleQuoteStatus.Accepted ? WholesaleLeadStatus.Won : WholesaleLeadStatus.Quoted;
    lead.history.push(
      leadHistory(
        lead.status,
        "ventas",
        status === WholesaleQuoteStatus.Accepted ? "Lead cerrado como ganado por cotización aceptada." : "Lead movido a cotización.",
        createdAt
      )
    );

    this.marketingService.recordEvent(
      "wholesale.quote.created",
      "ventas",
      quote.company,
      `${quote.amount.toFixed(2)} MXN · ${quote.status}`,
      "wholesale_quote",
      quote.id
    );

    if (quote.status === WholesaleQuoteStatus.Sent) {
      this.marketingService.recordEvent(
        "wholesale.quote.sent",
        "ventas",
        quote.company,
        `Se envió la cotización ${quote.id}.`,
        "wholesale_quote",
        quote.id
      );
    }

    if (quote.status === WholesaleQuoteStatus.Accepted) {
      this.marketingService.recordEvent(
        "wholesale.quote.accepted",
        "ventas",
        quote.company,
        `Se aceptó la cotización ${quote.id}.`,
        "wholesale_quote",
        quote.id
      );
    }

    return {
      ...actionResponse("queued", "La cotización quedó registrada.", quote.id),
      quote: this.toQuoteSummary(quote),
      lead: this.toLeadSummary(lead)
    };
  }

  private requireLead(id: string) {
    const lead = this.leads.get(id.trim());
    if (!lead) {
      throw new NotFoundException(`No encontramos un lead mayorista con id ${id}.`);
    }

    return lead;
  }

  private findLeadByEmail(email?: string) {
    if (!email) {
      return null;
    }

    return Array.from(this.leads.values()).find((lead) => lead.email === email) ?? null;
  }

  private findLeadByCompany(company?: string) {
    if (!company) {
      return null;
    }

    const normalized = company.trim().toLowerCase();
    return Array.from(this.leads.values()).find((lead) => lead.company.toLowerCase() === normalized) ?? null;
  }

  private toLeadSummary(lead: WholesaleLeadRecord): WholesaleLeadSummary {
    return {
      id: lead.id,
      company: lead.company,
      contact: lead.contact,
      email: lead.email,
      city: lead.city,
      source: lead.source,
      status: lead.status,
      phone: lead.phone,
      notes: lead.notes,
      reviewer: lead.reviewer,
      reviewedAt: lead.reviewedAt,
      quoteCount: lead.quoteIds.length,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    };
  }

  private toQuoteSummary(quote: WholesaleQuoteRecord): WholesaleQuoteAdminSummary {
    return {
      id: quote.id,
      leadId: quote.leadId,
      company: quote.company,
      contact: quote.contact,
      email: quote.email,
      status: quote.status,
      amount: quote.amount,
      currencyCode: quote.currencyCode,
      itemsCount: quote.itemsCount,
      notes: quote.notes,
      reviewer: quote.reviewer,
      sentAt: quote.sentAt,
      expiresAt: quote.expiresAt,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt
    };
  }

  private seedData() {
    const leadSeeds: WholesaleLeadRecord[] = [
      {
        id: "wl-001",
        company: "Distribuidora Andina",
        contact: "Paola Méndez",
        email: "paola@distribuidoraandina.com",
        city: "Lima",
        source: "Landing mayorista",
        status: WholesaleLeadStatus.Qualified,
        phone: "+51 999 888 777",
        notes: "Lead de volumen medio con interés en bundle.",
        reviewer: "ventas",
        reviewedAt: "2026-03-18T09:42:00.000Z",
        quoteCount: 1,
        createdAt: "2026-03-18T09:20:00.000Z",
        updatedAt: "2026-03-18T09:42:00.000Z",
        history: [
          leadHistory(WholesaleLeadStatus.New, "web", "Lead capturado desde el formulario.", "2026-03-18T09:20:00.000Z"),
          leadHistory(WholesaleLeadStatus.Qualified, "ventas", "Lead calificado para cotización.", "2026-03-18T09:42:00.000Z")
        ],
        quoteIds: ["wq-001"]
      },
      {
        id: "wl-002",
        company: "Ruta Norte",
        contact: "Carlos Fuentes",
        email: "carlos@rutanorte.com",
        city: "Trujillo",
        source: "Referencia comercial",
        status: WholesaleLeadStatus.Negotiating,
        phone: "+51 999 444 333",
        notes: "Interés en condiciones por volumen y seguimiento telefónico.",
        reviewer: "ventas",
        reviewedAt: "2026-03-18T10:18:00.000Z",
        quoteCount: 1,
        createdAt: "2026-03-18T09:55:00.000Z",
        updatedAt: "2026-03-18T10:18:00.000Z",
        history: [
          leadHistory(WholesaleLeadStatus.New, "web", "Lead capturado desde el formulario.", "2026-03-18T09:55:00.000Z"),
          leadHistory(WholesaleLeadStatus.Negotiating, "ventas", "Lead en negociación por seguimiento comercial.", "2026-03-18T10:18:00.000Z")
        ],
        quoteIds: ["wq-002"]
      }
    ];

    const quoteSeeds: WholesaleQuoteRecord[] = [
      {
        id: "wq-001",
        leadId: "wl-001",
        company: "Distribuidora Andina",
        contact: "Paola Méndez",
        email: "paola@distribuidoraandina.com",
        status: WholesaleQuoteStatus.Sent,
        amount: 9850,
        currencyCode: "MXN",
        itemsCount: 3,
        notes: "Cotización inicial enviada.",
        reviewer: "ventas",
        sentAt: "2026-03-18T09:45:00.000Z",
        expiresAt: "2026-03-25T23:59:59.000Z",
        createdAt: "2026-03-18T09:45:00.000Z",
        updatedAt: "2026-03-18T09:45:00.000Z",
        leadCompany: "Distribuidora Andina",
        leadStatus: WholesaleLeadStatus.Qualified,
        items: [
          { label: "Clásico Verde x 30", quantity: 30, unitPrice: 220, lineTotal: 6600 },
          { label: "Premium Negro x 10", quantity: 10, unitPrice: 285, lineTotal: 2850 },
          { label: "Logística", quantity: 1, unitPrice: 400, lineTotal: 400 }
        ],
        history: [quoteHistory(WholesaleQuoteStatus.Sent, "ventas", "Cotización enviada al lead.", "2026-03-18T09:45:00.000Z")]
      },
      {
        id: "wq-002",
        leadId: "wl-002",
        company: "Ruta Norte",
        contact: "Carlos Fuentes",
        email: "carlos@rutanorte.com",
        status: WholesaleQuoteStatus.Accepted,
        amount: 14500,
        currencyCode: "MXN",
        itemsCount: 4,
        notes: "Cotización aceptada por el cliente.",
        reviewer: "ventas",
        sentAt: "2026-03-18T10:20:00.000Z",
        expiresAt: "2026-03-27T23:59:59.000Z",
        createdAt: "2026-03-18T10:20:00.000Z",
        updatedAt: "2026-03-18T10:24:00.000Z",
        leadCompany: "Ruta Norte",
        leadStatus: WholesaleLeadStatus.Negotiating,
        items: [
          { label: "Clásico Verde x 40", quantity: 40, unitPrice: 210, lineTotal: 8400 },
          { label: "Combo Dúo Perfecto x 10", quantity: 10, unitPrice: 610, lineTotal: 6100 }
        ],
        history: [
          quoteHistory(WholesaleQuoteStatus.Sent, "ventas", "Cotización enviada al lead.", "2026-03-18T10:20:00.000Z"),
          quoteHistory(WholesaleQuoteStatus.Accepted, "ventas", "Cotización aceptada y lista para operación.", "2026-03-18T10:24:00.000Z")
        ]
      }
    ];

    for (const seed of leadSeeds) {
      this.leads.set(seed.id, seed);
      const numeric = Number(seed.id.replace(/[^\d]/g, ""));
      if (Number.isFinite(numeric)) {
        this.leadSequence = Math.max(this.leadSequence, numeric + 1);
      }
    }

    for (const seed of quoteSeeds) {
      this.quotes.set(seed.id, seed);
      const numeric = Number(seed.id.replace(/[^\d]/g, ""));
      if (Number.isFinite(numeric)) {
        this.quoteSequence = Math.max(this.quoteSequence, numeric + 1);
      }
    }
  }
}
