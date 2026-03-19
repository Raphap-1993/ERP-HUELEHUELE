import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue, type JobsOptions } from "bullmq";
import { QueueName, type NotificationDispatchJobData, parseRedisConnection } from "@huelegood/shared";
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
}
