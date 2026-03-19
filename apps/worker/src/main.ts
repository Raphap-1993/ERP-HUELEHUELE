import { Prisma, PrismaClient } from "@prisma/client";
import { type Job, Worker, type Processor } from "bullmq";
import {
  NotificationStatus,
  QueueName,
  type NotificationDispatchJobData,
  type NotificationLogSummary,
  type NotificationSummary,
  isConfigured,
  parseRedisConnection
} from "@huelegood/shared";

interface NotificationsSnapshot {
  notifications: NotificationSummary[];
  logs: NotificationLogSummary[];
}

function createPrismaClient() {
  if (!isConfigured(process.env.DATABASE_URL)) {
    return null;
  }

  return new PrismaClient();
}

function nowIso() {
  return new Date().toISOString();
}

function nextLogId(logs: NotificationLogSummary[]) {
  const next = logs.reduce((max, log) => {
    const numeric = Number(log.id.replace(/[^\d]/g, ""));
    return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
  }, 0);

  return `nlog-${String(next + 1).padStart(3, "0")}`;
}

async function loadNotificationsSnapshot(prisma: PrismaClient | null): Promise<NotificationsSnapshot | null> {
  if (!prisma) {
    return null;
  }

  try {
    const row = await prisma.moduleSnapshot.findUnique({
      where: {
        moduleName: "notifications"
      }
    });

    if (!row || !row.snapshot || typeof row.snapshot !== "object") {
      return null;
    }

    return row.snapshot as unknown as NotificationsSnapshot;
  } catch (error) {
    console.warn("[worker] no pudimos cargar el snapshot de notifications", error);
    return null;
  }
}

async function saveNotificationsSnapshot(prisma: PrismaClient | null, snapshot: NotificationsSnapshot) {
  if (!prisma) {
    return;
  }

  try {
    const payload = JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue;

    await prisma.moduleSnapshot.upsert({
      where: {
        moduleName: "notifications"
      },
      create: {
        moduleName: "notifications",
        snapshot: payload
      },
      update: {
        snapshot: payload
      }
    });
  } catch (error) {
    console.warn("[worker] no pudimos guardar el snapshot de notifications", error);
  }
}

async function processNotificationDispatch(
  prisma: PrismaClient | null,
  job: Job<NotificationDispatchJobData>
) {
  const snapshot = await loadNotificationsSnapshot(prisma);
  if (!snapshot) {
    console.warn(`[worker] no existe snapshot de notifications para ${job.data.notificationId}`);
    return {
      status: "skipped",
      reason: "missing_snapshot"
    };
  }

  const notification = snapshot.notifications.find((item) => item.id === job.data.notificationId);
  if (!notification) {
    console.warn(`[worker] no encontramos la notificación ${job.data.notificationId}`);
    return {
      status: "skipped",
      reason: "missing_notification"
    };
  }

  const now = nowIso();
  const sentAt = notification.sentAt ?? now;
  if (notification.status === NotificationStatus.Pending) {
    notification.status = NotificationStatus.Sent;
  } else if (notification.status === NotificationStatus.Failed) {
    notification.status = NotificationStatus.Sent;
  }

  notification.sentAt = sentAt;
  notification.updatedAt = now;

  const hasLog = snapshot.logs.some(
    (log) => log.notificationId === notification.id && log.eventName === "notification.sent"
  );

  if (!hasLog) {
    snapshot.logs.unshift({
      id: nextLogId(snapshot.logs),
      eventName: "notification.sent",
      source: job.data.actor ?? notification.source,
      subject: notification.subject,
      detail: job.data.reason ? `${job.data.reason} · entrega procesada por worker.` : "La notificación quedó enviada por el worker.",
      notificationId: notification.id,
      relatedType: notification.relatedType,
      relatedId: notification.relatedId,
      occurredAt: now
    });
  }

  await saveNotificationsSnapshot(prisma, snapshot);

  console.log(
    `[worker] notifications.notification.dispatch ${notification.id}`,
    JSON.stringify(
      {
        status: notification.status,
        sentAt: notification.sentAt,
        requestedAt: job.data.requestedAt
      },
      null,
      2
    )
  );

  return {
    status: "processed",
    notificationId: notification.id,
    notificationStatus: notification.status
  };
}

const connection = parseRedisConnection(process.env.REDIS_URL);
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 5);
const prisma = createPrismaClient();

const processor: Processor = async (job) => {
  if (job.queueName === QueueName.Notifications && job.name === "notification.dispatch") {
    return processNotificationDispatch(prisma, job as Job<NotificationDispatchJobData>);
  }

  console.log(
    `[worker] ${job.queueName}:${job.name}`,
    JSON.stringify(
      {
        id: job.id,
        data: job.data
      },
      null,
      2
    )
  );

  return {
    processedAt: nowIso(),
    queue: job.queueName,
    jobName: job.name
  };
};

const workers = Object.values(QueueName).map(
  (queueName) =>
    new Worker(queueName, processor, {
      connection,
      concurrency,
      autorun: true
    })
);

async function shutdown(signal: NodeJS.Signals) {
  console.log(`[worker] received ${signal}, closing workers`);
  await Promise.all(workers.map((worker) => worker.close()));
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[worker] Huelegood worker online", {
  queues: Object.values(QueueName),
  connection,
  concurrency,
  prisma: Boolean(prisma)
});
