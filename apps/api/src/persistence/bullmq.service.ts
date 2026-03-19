import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue, type JobsOptions } from "bullmq";
import {
  QueueName,
  type CommissionPayoutCreateJobData,
  type CommissionPayoutSettleJobData,
  type ManualPaymentReviewJobData,
  type NotificationDispatchJobData,
  type ObservabilityQueueSummary,
  parseRedisConnection
} from "@huelegood/shared";
import { isConfigured } from "../common/env";

@Injectable()
export class BullMqService implements OnModuleDestroy {
  private readonly queues = new Map<QueueName, Queue>();

  private readonly redisConfigured = isConfigured(process.env.REDIS_URL);

  private readonly connection = parseRedisConnection(process.env.REDIS_URL);

  async enqueue<T>(queueName: QueueName, name: string, data: T, options: JobsOptions = {}) {
    if (!this.redisConfigured) {
      return null;
    }

    try {
      const queue = this.getQueue(queueName);
      return await queue.add(name, data as never, {
        removeOnComplete: true,
        removeOnFail: 25,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000
        },
        ...options
      });
    } catch (error) {
      console.warn(`[bullmq] no pudimos encolar ${queueName}:${name}`, error);
      return null;
    }
  }

  enqueueNotificationDispatch(data: NotificationDispatchJobData) {
    return this.enqueue(QueueName.Notifications, "notification.dispatch", data, {
      jobId: data.notificationId
    });
  }

  enqueueManualPaymentReview(data: ManualPaymentReviewJobData) {
    return this.enqueue(QueueName.Payments, "payment.manual-review", data, {
      jobId: this.buildJobId("payment.manual-review", data.manualRequestId, data.decision)
    });
  }

  enqueueCommissionPayoutCreate(data: CommissionPayoutCreateJobData) {
    return this.enqueue(QueueName.Commissions, "commission.payout.create", data, {
      jobId: this.buildJobId("commission.payout.create", data.vendorCode, data.period ?? "current")
    });
  }

  enqueueCommissionPayoutSettle(data: CommissionPayoutSettleJobData) {
    return this.enqueue(QueueName.Commissions, "commission.payout.settle", data, {
      jobId: this.buildJobId("commission.payout.settle", data.payoutId)
    });
  }

  async getQueueSummaries(): Promise<ObservabilityQueueSummary[]> {
    const checkedAt = new Date().toISOString();
    if (!this.redisConfigured) {
      return Object.values(QueueName).map((queueName) => ({
        queueName,
        status: "missing",
        waiting: 0,
        active: 0,
        delayed: 0,
        completed: 0,
        failed: 0,
        checkedAt,
        detail: "REDIS_URL no está configurada."
      }));
    }

    return Promise.all(
      Object.values(QueueName).map(async (queueName) => {
        try {
          const queue = this.getQueue(queueName);
          const counts = await queue.getJobCounts("waiting", "active", "delayed", "completed", "failed");
          return {
            queueName,
            status: "healthy" as const,
            waiting: counts.waiting ?? 0,
            active: counts.active ?? 0,
            delayed: counts.delayed ?? 0,
            completed: counts.completed ?? 0,
            failed: counts.failed ?? 0,
            checkedAt
          };
        } catch (error) {
          return {
            queueName,
            status: "degraded" as const,
            waiting: 0,
            active: 0,
            delayed: 0,
            completed: 0,
            failed: 0,
            checkedAt,
            detail: error instanceof Error ? error.message : "No pudimos leer la cola."
          };
        }
      })
    );
  }

  async onModuleDestroy() {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
  }

  private getQueue(queueName: QueueName) {
    const existing = this.queues.get(queueName);
    if (existing) {
      return existing;
    }

    const queue = new Queue(queueName, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: 25,
        attempts: 3
      }
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  private buildJobId(name: string, ...parts: string[]) {
    const normalizedParts = parts.map((part) =>
      part
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );

    return [name, ...normalizedParts].join(":");
  }
}
