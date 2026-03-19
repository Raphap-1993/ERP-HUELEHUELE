import { randomUUID } from "node:crypto";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { type AuditLogSummary, type AuditOverviewSummary, type AdminActionSummary, type AuditSeverity } from "@huelegood/shared";
import { isConfigured } from "../../common/env";
import { wrapResponse } from "../../common/response";
import { PrismaService } from "../../prisma/prisma.service";

interface AuditLogRecord extends AuditLogSummary {
  payloadJson?: Prisma.InputJsonValue;
}

interface AdminActionRecord extends AdminActionSummary {
  metadataJson?: Prisma.InputJsonValue;
}

interface AuditEntryInput {
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  severity?: AuditSeverity;
  actorUserId?: string;
  actorName?: string;
  payload?: Prisma.InputJsonValue;
}

interface AdminActionInput {
  actionType: string;
  targetType: string;
  targetId: string;
  summary: string;
  actorUserId?: string;
  actorName?: string;
  metadata?: Prisma.InputJsonValue;
}

function nowIso() {
  return new Date().toISOString();
}

function toJsonSummary(value?: Prisma.InputJsonValue) {
  if (!value) {
    return undefined;
  }

  return JSON.stringify(value);
}

function normalizeSeverity(value?: AuditSeverity): AuditSeverity {
  return value ?? "info";
}

function cloneLog(record: AuditLogRecord): AuditLogSummary {
  return {
    id: record.id,
    module: record.module,
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    summary: record.summary,
    severity: record.severity,
    actorUserId: record.actorUserId,
    actorName: record.actorName,
    payloadSummary: record.payloadSummary,
    occurredAt: record.occurredAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function cloneAction(record: AdminActionRecord): AdminActionSummary {
  return {
    id: record.id,
    actionType: record.actionType,
    targetType: record.targetType,
    targetId: record.targetId,
    summary: record.summary,
    actorUserId: record.actorUserId,
    actorName: record.actorName,
    metadataSummary: record.metadataSummary,
    occurredAt: record.occurredAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

@Injectable()
export class AuditService implements OnModuleInit {
  private readonly logs = new Map<string, AuditLogRecord>();

  private readonly actions = new Map<string, AdminActionRecord>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (isConfigured(process.env.DATABASE_URL)) {
      await this.loadFromDatabase();
    }

    if (this.logs.size === 0 && this.actions.size === 0) {
      this.seedBootstrapEvents();
    }
  }

  getOverview() {
    const logs = this.listLogs().data;
    const actions = this.listActions().data;
    const severityCounts = this.countSeverities(logs);
    const modules = Array.from(new Set(logs.map((log) => log.module))).sort();

    const summary: AuditOverviewSummary = {
      logs,
      actions,
      totalLogs: logs.length,
      totalActions: actions.length,
      severityCounts,
      modules
    };

    return wrapResponse(summary, {
      generatedAt: nowIso()
    });
  }

  listLogs() {
    const logs = Array.from(this.logs.values()).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).map(cloneLog);

    return wrapResponse(logs, {
      total: logs.length
    });
  }

  listActions() {
    const actions = Array.from(this.actions.values()).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt)).map(cloneAction);

    return wrapResponse(actions, {
      total: actions.length
    });
  }

  recordAudit(input: AuditEntryInput) {
    const now = nowIso();
    const id = randomUUID();
    const record: AuditLogRecord = {
      id,
      module: input.module.trim(),
      action: input.action.trim(),
      entityType: input.entityType.trim(),
      entityId: input.entityId.trim(),
      summary: input.summary.trim(),
      severity: normalizeSeverity(input.severity),
      actorUserId: input.actorUserId?.trim() || undefined,
      actorName: input.actorName?.trim() || undefined,
      payloadSummary: toJsonSummary(input.payload),
      payloadJson: input.payload,
      occurredAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.logs.set(record.id, record);
    void this.persistAuditLog(record);
    return cloneLog(record);
  }

  recordAdminAction(input: AdminActionInput) {
    const now = nowIso();
    const id = randomUUID();
    const record: AdminActionRecord = {
      id,
      actionType: input.actionType.trim(),
      targetType: input.targetType.trim(),
      targetId: input.targetId.trim(),
      summary: input.summary.trim(),
      actorUserId: input.actorUserId?.trim() || undefined,
      actorName: input.actorName?.trim() || undefined,
      metadataSummary: toJsonSummary(input.metadata),
      metadataJson: input.metadata,
      occurredAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.actions.set(record.id, record);
    this.recordAudit({
      module: "admin",
      action: input.actionType,
      entityType: input.targetType,
      entityId: input.targetId,
      summary: input.summary,
      severity: "info",
      actorUserId: input.actorUserId,
      actorName: input.actorName,
      payload: input.metadata
    });
    void this.persistAdminAction(record);
    return cloneAction(record);
  }

  private countSeverities(logs: AuditLogSummary[]) {
    return logs.reduce(
      (accumulator, log) => {
        accumulator[log.severity] += 1;
        return accumulator;
      },
      {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0
      } as Record<AuditSeverity, number>
    );
  }

  private async loadFromDatabase() {
    try {
      const [auditLogs, adminActions] = await Promise.all([
        this.prisma.auditLog.findMany({
          orderBy: { occurredAt: "desc" },
          take: 100
        }),
        this.prisma.adminAction.findMany({
          orderBy: { occurredAt: "desc" },
          take: 100
        })
      ]);

      for (const entry of [...auditLogs].reverse()) {
        const record: AuditLogRecord = {
          id: entry.id,
          module: entry.module,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          summary: this.buildSummaryFromJson(entry.payloadJson) ?? `${entry.module}.${entry.action}`,
          severity: "info",
          actorUserId: entry.actorUserId ?? undefined,
          actorName: undefined,
          payloadSummary: this.buildSummaryFromJson(entry.payloadJson),
          payloadJson: this.toPlainObject(entry.payloadJson),
          occurredAt: entry.occurredAt.toISOString(),
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString()
        };

        this.logs.set(record.id, record);
      }

      for (const entry of [...adminActions].reverse()) {
        const record: AdminActionRecord = {
          id: entry.id,
          actionType: entry.actionType,
          targetType: entry.targetType,
          targetId: entry.targetId,
          summary: entry.summary,
          actorUserId: entry.adminUserId ?? undefined,
          actorName: undefined,
          metadataSummary: this.buildSummaryFromJson(entry.metadataJson),
          metadataJson: this.toPlainObject(entry.metadataJson),
          occurredAt: entry.occurredAt.toISOString(),
          createdAt: entry.createdAt.toISOString(),
          updatedAt: entry.updatedAt.toISOString()
        };

        this.actions.set(record.id, record);
      }

    } catch (error) {
      console.warn("[audit] no pudimos cargar auditoría desde Prisma", error);
    }
  }

  private async persistAuditLog(record: AuditLogRecord) {
    if (!isConfigured(process.env.DATABASE_URL)) {
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          id: record.id,
          actorUserId: record.actorUserId ?? null,
          module: record.module,
          action: record.action,
          entityType: record.entityType,
          entityId: record.entityId,
          payloadJson: record.payloadJson ?? undefined,
          occurredAt: new Date(record.occurredAt)
        }
      });
    } catch (error) {
      console.warn("[audit] no pudimos persistir audit_log", error);
    }
  }

  private async persistAdminAction(record: AdminActionRecord) {
    if (!isConfigured(process.env.DATABASE_URL)) {
      return;
    }

    try {
      await this.prisma.adminAction.create({
        data: {
          id: record.id,
          adminUserId: record.actorUserId ?? null,
          actionType: record.actionType,
          targetType: record.targetType,
          targetId: record.targetId,
          summary: record.summary,
          metadataJson: record.metadataJson ?? undefined,
          occurredAt: new Date(record.occurredAt)
        }
      });
    } catch (error) {
      console.warn("[audit] no pudimos persistir admin_action", error);
    }
  }

  private buildSummaryFromJson(value: Prisma.InputJsonValue | null | undefined) {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const entries = Object.entries(value as Record<string, unknown>).slice(0, 4);
    if (entries.length === 0) {
      return undefined;
    }

    return entries
      .map(([key, current]) => `${key}=${typeof current === "string" ? current : JSON.stringify(current)}`)
      .join(" · ");
  }

  private toPlainObject(value: Prisma.InputJsonValue | null | undefined) {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private seedBootstrapEvents() {
    const now = nowIso();
    const bootstrapLog: AuditLogRecord = {
      id: randomUUID(),
      module: "system",
      action: "bootstrap",
      entityType: "service",
      entityId: "huelegood-api",
      summary: "La capa de auditoría y seguridad quedó disponible.",
      severity: "info",
      actorUserId: undefined,
      actorName: "Sistema",
      payloadSummary: "audit_ready=true",
      payloadJson: { audit_ready: true },
      occurredAt: now,
      createdAt: now,
      updatedAt: now
    };

    const bootstrapAction: AdminActionRecord = {
      id: randomUUID(),
      actionType: "system.bootstrap",
      targetType: "service",
      targetId: "huelegood-api",
      summary: "Arranque inicial del módulo de auditoría.",
      actorUserId: undefined,
      actorName: "Sistema",
      metadataSummary: "audit=enabled",
      metadataJson: { audit: "enabled" },
      occurredAt: now,
      createdAt: now,
      updatedAt: now
    };

    this.logs.set(bootstrapLog.id, bootstrapLog);
    this.actions.set(bootstrapAction.id, bootstrapAction);
  }
}
