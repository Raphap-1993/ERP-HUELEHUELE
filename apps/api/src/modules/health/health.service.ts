import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import type { HealthDependencySummary, OperationalHealthSummary } from "@huelegood/shared";
import { isConfigured, getPort } from "../../common/env";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness() {
    return {
      status: "ok",
      service: "huelegood-api",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      pid: process.pid
    };
  }

  async getReadiness() {
    return this.buildOperationalSnapshot();
  }

  async getOperational() {
    return this.buildOperationalSnapshot();
  }

  private async buildOperationalSnapshot(): Promise<OperationalHealthSummary> {
    const dependencies = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const status = dependencies.every((dependency) => dependency.status === "healthy") ? "ok" : "degraded";

    return {
      service: "huelegood-api",
      status,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
      port: getPort(4000),
      memory: this.buildMemorySnapshot(),
      dependencies
    };
  }

  private buildMemorySnapshot() {
    const memory = process.memoryUsage();
    const bytesToMb = (value: number) => Math.round((value / 1024 / 1024) * 10) / 10;

    return {
      rssMb: bytesToMb(memory.rss),
      heapUsedMb: bytesToMb(memory.heapUsed),
      heapTotalMb: bytesToMb(memory.heapTotal),
      externalMb: bytesToMb(memory.external)
    };
  }

  private async checkDatabase(): Promise<HealthDependencySummary> {
    const checkedAt = new Date().toISOString();
    if (!isConfigured(process.env.DATABASE_URL)) {
      return {
        name: "database",
        status: "missing",
        detail: "DATABASE_URL no está configurada.",
        checkedAt
      };
    }

    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        name: "database",
        status: "healthy",
        detail: "Conexión Prisma/PostgreSQL operativa.",
        latencyMs: Date.now() - startedAt,
        checkedAt
      };
    } catch (error) {
      return {
        name: "database",
        status: "degraded",
        detail: error instanceof Error ? error.message : "No pudimos validar la conexión a PostgreSQL.",
        latencyMs: Date.now() - startedAt,
        checkedAt
      };
    }
  }

  private async checkRedis(): Promise<HealthDependencySummary> {
    const checkedAt = new Date().toISOString();
    if (!isConfigured(process.env.REDIS_URL)) {
      return {
        name: "redis",
        status: "missing",
        detail: "REDIS_URL no está configurada.",
        checkedAt
      };
    }

    const client = new Redis(process.env.REDIS_URL as string, {
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 1200
    });
    const startedAt = Date.now();

    try {
      await client.connect();
      await client.ping();
      return {
        name: "redis",
        status: "healthy",
        detail: "Redis responde a ping.",
        latencyMs: Date.now() - startedAt,
        checkedAt
      };
    } catch (error) {
      return {
        name: "redis",
        status: "degraded",
        detail: error instanceof Error ? error.message : "No pudimos validar Redis.",
        latencyMs: Date.now() - startedAt,
        checkedAt
      };
    } finally {
      client.disconnect();
    }
  }
}
