import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { type Job, Worker, type Processor } from "bullmq";
import {
  QueueName,
  type CommissionPayoutCreateJobData,
  type CommissionPayoutSettleJobData,
  type ManualPaymentReviewJobData,
  type NotificationDispatchJobData,
  parseRedisConnection
} from "@huelegood/shared";
import { AppModule } from "../../api/src/app.module";
import { CommissionsService } from "../../api/src/modules/commissions/commissions.service";
import { NotificationsService } from "../../api/src/modules/notifications/notifications.service";
import { PaymentsService } from "../../api/src/modules/payments/payments.service";

function writeWorkerLog(level: "info" | "warn" | "error", event: string, payload: Record<string, unknown>) {
  process.stdout.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      service: "huelegood-worker",
      level,
      event,
      ...payload
    })}\n`
  );
}

function nowIso() {
  return new Date().toISOString();
}

async function createWorkerServices() {
  process.env.HUELEGOOD_DISABLE_NOTIFICATION_REQUEUE = "1";

  const appContext = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"]
  });

  return {
    appContext,
    paymentsService: appContext.get(PaymentsService),
    commissionsService: appContext.get(CommissionsService),
    notificationsService: appContext.get(NotificationsService)
  };
}

const resendApiKey = process.env.RESEND_API_KEY ?? null;
const resendFrom = process.env.RESEND_FROM_EMAIL ?? "Huele Huele <noreply@huelegood.com>";

type EmailDispatchResult =
  | { status: "sent"; provider: "resend"; providerMessageId?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string; httpStatus?: number; providerMessageId?: string };

async function sendEmailViaResend(to: string, subject: string, body: string) {
  if (!resendApiKey) {
    writeWorkerLog("warn", "notifications.email.skipped", {
      to,
      subject,
      reason: "RESEND_API_KEY missing"
    });
    return { status: "skipped", reason: "RESEND_API_KEY missing" } satisfies EmailDispatchResult;
  }
  try {
    const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <p style="font-size:16px;line-height:1.7;color:#374151;white-space:pre-line">${body.replace(/\n/g, "<br>")}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="font-size:12px;color:#9ca3af">Huele Huele · huelegood.com</p>
    </div>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: resendFrom, to, subject, html })
    });
    const payload = await res.json().catch(() => null) as { id?: string; message?: string } | null;
    if (!res.ok) {
      const reason = payload?.message ?? `HTTP ${res.status}`;
      writeWorkerLog("warn", "notifications.email.failed", {
        to,
        subject,
        status: res.status,
        reason,
        resendMessageId: payload?.id
      });
      return {
        status: "failed",
        reason,
        httpStatus: res.status,
        providerMessageId: payload?.id
      } satisfies EmailDispatchResult;
    } else {
      writeWorkerLog("info", "notifications.email.sent", {
        to,
        subject,
        resendMessageId: payload?.id
      });
      return {
        status: "sent",
        provider: "resend",
        providerMessageId: payload?.id
      } satisfies EmailDispatchResult;
    }
  } catch (err) {
    const reason = String(err);
    writeWorkerLog("warn", "notifications.email.error", { to, subject, error: reason });
    return { status: "failed", reason } satisfies EmailDispatchResult;
  }
}

async function processNotificationDispatch(
  notificationsService: NotificationsService,
  job: Job<NotificationDispatchJobData>
) {
  const record = await notificationsService.findByIdFresh(job.data.notificationId);
  let deliveryDetail = job.data.reason
    ? `${job.data.reason} · entrega procesada por worker.`
    : "La notificación quedó enviada por el worker.";

  if (record && record.channel === "email" && record.audience?.includes("@")) {
    const result = await sendEmailViaResend(record.audience, record.subject, record.body);
    if (result.status !== "sent") {
      const notification = await notificationsService.markNotificationFailed(
        job.data.notificationId,
        `Email no enviado: ${result.reason}`
      );
      writeWorkerLog("warn", "notifications.dispatch.failed", {
        notificationId: notification.id,
        status: notification.status,
        requestedAt: job.data.requestedAt,
        queueName: job.queueName,
        jobId: job.id,
        reason: result.reason
      });
      return {
        status: "failed",
        notificationId: notification.id,
        notificationStatus: notification.status
      };
    }

    if (result.providerMessageId) {
      deliveryDetail = `${deliveryDetail} resend:${result.providerMessageId}`;
    }
  }
  const notification = await notificationsService.markNotificationSent(job.data.notificationId, deliveryDetail);

  writeWorkerLog("info", "notifications.dispatch.processed", {
    notificationId: notification.id,
    status: notification.status,
    sentAt: notification.sentAt,
    requestedAt: job.data.requestedAt,
    queueName: job.queueName,
    jobId: job.id
  });

  return {
    status: "processed",
    notificationId: notification.id,
    notificationStatus: notification.status
  };
}

async function processManualPaymentReview(
  paymentsService: PaymentsService,
  job: Job<ManualPaymentReviewJobData>
) {
  const payload = {
    reviewer: job.data.reviewer,
    notes: job.data.notes,
    sendEmailNow: job.data.sendEmailNow
  };
  const result = await (
    job.data.decision === "approve"
      ? paymentsService.approveManualRequest(job.data.manualRequestId, payload)
      : paymentsService.rejectManualRequest(job.data.manualRequestId, payload)
  );

  writeWorkerLog("info", "payments.manual_review.processed", {
    manualRequestId: job.data.manualRequestId,
    decision: job.data.decision,
    resultStatus: result.status,
    requestedAt: job.data.requestedAt,
    queueName: job.queueName,
    jobId: job.id
  });

  return result;
}

async function processCommissionPayoutCreate(
  commissionsService: CommissionsService,
  job: Job<CommissionPayoutCreateJobData>
) {
  const result = commissionsService.ensurePayoutForJob({
    vendorCode: job.data.vendorCode,
    period: job.data.period,
    referenceId: job.data.referenceId,
    bonusAmount: job.data.bonusAmount,
    bonusReason: job.data.bonusReason,
    deductionAmount: job.data.deductionAmount,
    deductionReason: job.data.deductionReason,
    notes: job.data.notes
  });

  writeWorkerLog("info", "commissions.payout.create.processed", {
    vendorCode: job.data.vendorCode,
    period: job.data.period,
    resultStatus: result.status,
    referenceId: result.referenceId,
    requestedAt: job.data.requestedAt,
    queueName: job.queueName,
    jobId: job.id
  });

  return result;
}

async function processCommissionPayoutSettle(
  commissionsService: CommissionsService,
  job: Job<CommissionPayoutSettleJobData>
) {
  const result = commissionsService.settlePayout(job.data.payoutId, {
    reviewer: job.data.reviewer,
    notes: job.data.notes,
    referenceId: job.data.referenceId
  });

  writeWorkerLog("info", "commissions.payout.settle.processed", {
    payoutId: job.data.payoutId,
    resultStatus: result.status,
    referenceId: result.referenceId,
    requestedAt: job.data.requestedAt,
    queueName: job.queueName,
    jobId: job.id
  });

  return result;
}

async function bootstrap() {
  const { appContext, paymentsService, commissionsService, notificationsService } = await createWorkerServices();
  const connection = parseRedisConnection(process.env.REDIS_URL);
  const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 5);

  const processor: Processor = async (job) => {
    if (job.queueName === QueueName.Notifications && job.name === "notification.dispatch") {
      return processNotificationDispatch(notificationsService, job as Job<NotificationDispatchJobData>);
    }

    if (job.queueName === QueueName.Payments && job.name === "payment.manual-review") {
      return processManualPaymentReview(paymentsService, job as Job<ManualPaymentReviewJobData>);
    }

    if (job.queueName === QueueName.Commissions && job.name === "commission.payout.create") {
      return processCommissionPayoutCreate(commissionsService, job as Job<CommissionPayoutCreateJobData>);
    }

    if (job.queueName === QueueName.Commissions && job.name === "commission.payout.settle") {
      return processCommissionPayoutSettle(commissionsService, job as Job<CommissionPayoutSettleJobData>);
    }

    writeWorkerLog("info", "queue.job.processed", {
      queueName: job.queueName,
      jobName: job.name,
      jobId: job.id,
      data: job.data
    });

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
    writeWorkerLog("info", "service.stopping", {
      signal
    });

    await Promise.all(workers.map((worker) => worker.close()));
    await appContext.close();
    process.exit(0);
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  writeWorkerLog("info", "service.started", {
    queues: Object.values(QueueName),
    connection,
    concurrency,
    appContext: true
  });
}

void bootstrap().catch((error) => {
  writeWorkerLog("error", "service.failed", {
    message: error instanceof Error ? error.message : "unknown_error"
  });
  process.exit(1);
});
