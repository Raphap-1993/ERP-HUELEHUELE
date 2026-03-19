import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  NotificationChannel,
  NotificationStatus,
  type NotificationInput,
  type NotificationLogSummary,
  type NotificationSummary
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";

interface NotificationRecord extends NotificationSummary {}

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeChannel(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (Object.values(NotificationChannel).includes(normalized as NotificationChannel)) {
    return normalized as NotificationChannel;
  }

  return undefined;
}

function normalizeStatus(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (Object.values(NotificationStatus).includes(normalized as NotificationStatus)) {
    return normalized as NotificationStatus;
  }

  return undefined;
}

@Injectable()
export class NotificationsService {
  private readonly notifications = new Map<string, NotificationRecord>();

  private readonly logs: NotificationLogSummary[] = [];

  private notificationSequence = 4;

  private logSequence = 4;

  constructor(private readonly auditService: AuditService) {
    this.seedData();
  }

  listNotifications() {
    const notifications = Array.from(this.notifications.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    return wrapResponse<NotificationSummary[]>(
      notifications.map((notification) => ({
        id: notification.id,
        channel: notification.channel,
        audience: notification.audience,
        subject: notification.subject,
        body: notification.body,
        status: notification.status,
        source: notification.source,
        relatedType: notification.relatedType,
        relatedId: notification.relatedId,
        scheduledAt: notification.scheduledAt,
        sentAt: notification.sentAt,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      })),
      {
        total: notifications.length,
        pending: notifications.filter((notification) => notification.status === NotificationStatus.Pending).length,
        sent: notifications.filter((notification) => notification.status === NotificationStatus.Sent).length,
        delivered: notifications.filter((notification) => notification.status === NotificationStatus.Delivered).length,
        failed: notifications.filter((notification) => notification.status === NotificationStatus.Failed).length
      }
    );
  }

  listLogs() {
    const logs = [...this.logs].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
    return wrapResponse<NotificationLogSummary[]>(logs, {
      total: logs.length
    });
  }

  createNotification(body: NotificationInput) {
    const channel = normalizeChannel(body.channel);
    const audience = normalizeText(body.audience);
    const subject = normalizeText(body.subject);
    const content = normalizeText(body.body);
    const source = normalizeText(body.source) ?? "manual";

    if (!channel || !audience || !subject || !content) {
      throw new BadRequestException("Canal, audiencia, asunto y contenido son obligatorios.");
    }

    const createdAt = nowIso();
    const id = `ntf-${String(this.notificationSequence).padStart(3, "0")}`;
    this.notificationSequence += 1;
    const status = normalizeStatus(body.status) ?? NotificationStatus.Pending;
    const notification: NotificationRecord = {
      id,
      channel,
      audience,
      subject,
      body: content,
      status,
      source,
      relatedType: normalizeText(body.relatedType),
      relatedId: normalizeText(body.relatedId),
      scheduledAt: normalizeText(body.scheduledAt),
      sentAt: status === NotificationStatus.Sent || status === NotificationStatus.Delivered ? createdAt : undefined,
      createdAt,
      updatedAt: createdAt
    };

    this.notifications.set(notification.id, notification);
    this.auditService.recordAudit({
      module: "notifications",
      action: "notification.queued",
      entityType: "notification",
      entityId: notification.id,
      summary: `La notificación ${notification.id} quedó ${status === NotificationStatus.Sent || status === NotificationStatus.Delivered ? "enviada" : "en cola"}.`,
      actorName: source,
      payload: {
        channel,
        audience,
        subject,
        status,
        relatedType: notification.relatedType,
        relatedId: notification.relatedId
      }
    });
    this.recordEvent(
      status === NotificationStatus.Sent || status === NotificationStatus.Delivered ? "notification.sent" : "notification.queued",
      source,
      audience,
      subject,
      notification.relatedType,
      notification.relatedId,
      notification.id
    );

    return {
      ...actionResponse("queued", "La notificación quedó registrada en cola.", notification.id),
      notification: this.toSummary(notification)
    };
  }

  queueNotification(body: NotificationInput) {
    return this.createNotification(body);
  }

  recordEvent(
    eventName: string,
    source: string,
    subject: string,
    detail: string,
    relatedType?: string,
    relatedId?: string,
    notificationId?: string
  ) {
    const occurredAt = nowIso();
    const log: NotificationLogSummary = {
      id: `nlog-${String(this.logSequence).padStart(3, "0")}`,
      eventName,
      source,
      subject,
      detail,
      notificationId,
      relatedType,
      relatedId,
      occurredAt
    };
    this.logSequence += 1;
    this.logs.unshift(log);
    return log;
  }

  markNotificationSent(id: string, detail?: string) {
    const notification = this.requireNotification(id);
    const now = nowIso();
    notification.status = NotificationStatus.Sent;
    notification.sentAt = now;
    notification.updatedAt = now;
    this.auditService.recordAdminAction({
      actionType: "notifications.sent",
      targetType: "notification",
      targetId: notification.id,
      summary: `La notificación ${notification.id} quedó enviada.`,
      actorName: "sistema",
      metadata: {
        audience: notification.audience,
        subject: notification.subject,
        detail: normalizeText(detail)
      }
    });
    this.recordEvent(
      "notification.sent",
      notification.source,
      notification.subject,
      normalizeText(detail) ?? `Se envió la notificación ${notification.id}.`,
      notification.relatedType,
      notification.relatedId,
      notification.id
    );
    return this.toSummary(notification);
  }

  private requireNotification(id: string) {
    const notification = this.notifications.get(id.trim());
    if (!notification) {
      throw new NotFoundException(`No encontramos una notificación con id ${id}.`);
    }

    return notification;
  }

  private toSummary(notification: NotificationRecord): NotificationSummary {
    return {
      id: notification.id,
      channel: notification.channel,
      audience: notification.audience,
      subject: notification.subject,
      body: notification.body,
      status: notification.status,
      source: notification.source,
      relatedType: notification.relatedType,
      relatedId: notification.relatedId,
      scheduledAt: notification.scheduledAt,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    };
  }

  private seedData() {
    const seeds: NotificationRecord[] = [
      {
        id: "ntf-001",
        channel: NotificationChannel.Email,
        audience: "Carlos Gómez",
        subject: "Tu pago manual está en revisión",
        body: "Recibimos tu comprobante y el equipo operativo lo revisará en breve.",
        status: NotificationStatus.Pending,
        source: "orders",
        relatedType: "order",
        relatedId: "HG-10041",
        scheduledAt: undefined,
        sentAt: undefined,
        createdAt: "2026-03-18T10:22:30.000Z",
        updatedAt: "2026-03-18T10:22:30.000Z"
      },
      {
        id: "ntf-002",
        channel: NotificationChannel.Email,
        audience: "Laura Mendoza",
        subject: "Tus puntos ya están disponibles",
        body: "Se acreditaron 18 puntos por tu compra confirmada.",
        status: NotificationStatus.Sent,
        source: "loyalty",
        relatedType: "loyalty_movement",
        relatedId: "lm-001",
        scheduledAt: undefined,
        sentAt: "2026-03-18T10:08:00.000Z",
        createdAt: "2026-03-18T10:08:00.000Z",
        updatedAt: "2026-03-18T10:08:00.000Z"
      },
      {
        id: "ntf-003",
        channel: NotificationChannel.Internal,
        audience: "Marketing",
        subject: "Campaña Reset de marzo",
        body: "La campaña entró en ejecución y ya tiene actividad registrada.",
        status: NotificationStatus.Delivered,
        source: "marketing",
        relatedType: "campaign",
        relatedId: "cmp-001",
        scheduledAt: undefined,
        sentAt: "2026-03-18T10:00:30.000Z",
        createdAt: "2026-03-18T10:00:30.000Z",
        updatedAt: "2026-03-18T10:00:30.000Z"
      }
    ];

    const logSeeds: NotificationLogSummary[] = [
      {
        id: "nlog-001",
        eventName: "order.checkout.created",
        source: "orders",
        subject: "HG-10041",
        detail: "El pedido manual quedó registrado y espera validación.",
        notificationId: "ntf-001",
        relatedType: "order",
        relatedId: "HG-10041",
        occurredAt: "2026-03-18T10:22:30.000Z"
      },
      {
        id: "nlog-002",
        eventName: "loyalty.points.available",
        source: "loyalty",
        subject: "Laura Mendoza",
        detail: "Los puntos de la compra confirmada quedaron disponibles.",
        notificationId: "ntf-002",
        relatedType: "loyalty_movement",
        relatedId: "lm-001",
        occurredAt: "2026-03-18T10:08:00.000Z"
      },
      {
        id: "nlog-003",
        eventName: "campaign.run.started",
        source: "marketing",
        subject: "Reset de marzo",
        detail: "La campaña inició con el segmento de clientes recientes.",
        notificationId: "ntf-003",
        relatedType: "campaign",
        relatedId: "cmp-001",
        occurredAt: "2026-03-18T10:00:30.000Z"
      }
    ];

    for (const notification of seeds) {
      this.notifications.set(notification.id, notification);
      const numeric = Number(notification.id.replace(/[^\d]/g, ""));
      if (Number.isFinite(numeric)) {
        this.notificationSequence = Math.max(this.notificationSequence, numeric + 1);
      }
    }

    for (const log of logSeeds) {
      this.logs.push(log);
    }

    const logSequence = this.logs.reduce((max, log) => {
      const numeric = Number(log.id.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    this.logSequence = Math.max(this.logSequence, logSequence + 1);
  }
}
