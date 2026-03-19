import { Worker, type Processor } from "bullmq";
import { QueueName, isConfigured } from "@huelegood/shared";

type QueueConnection = {
  host: string;
  port: number;
  password?: string;
  username?: string;
  db?: number;
};

function parseRedisConnection(): QueueConnection {
  const fallback: QueueConnection = {
    host: "127.0.0.1",
    port: 6379
  };

  if (!isConfigured(process.env.REDIS_URL)) {
    return fallback;
  }

  try {
    const url = new URL(process.env.REDIS_URL as string);
    return {
      host: url.hostname,
      port: Number(url.port || 6379),
      password: url.password || undefined,
      username: url.username || undefined,
      db: url.pathname ? Number(url.pathname.replace("/", "")) || undefined : undefined
    };
  } catch {
    return fallback;
  }
}

const connection = parseRedisConnection();
const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 5);

const processor: Processor = async (job) => {
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
    processedAt: new Date().toISOString(),
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
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("[worker] Huelegood worker online", {
  queues: Object.values(QueueName),
  connection,
  concurrency
});
