import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import {
  type AuditSeverity,
  type ObservabilityEventSummary,
  type ObservabilityOverviewSummary,
  type ObservabilityRequestSummary,
  type ObservabilityRouteMetricSummary
} from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { getSecurityTelemetry } from "../../common/security";
import { BullMqService } from "../../persistence/bullmq.service";

interface RouteMetricRecord {
  key: string;
  method: string;
  path: string;
  totalRequests: number;
  clientErrorRequests: number;
  serverErrorRequests: number;
  totalDurationMs: number;
  maxDurationMs: number;
  lastRequestAt?: string;
  durations: number[];
}

interface HttpRequestInput {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  occurredAt: string;
  actorUserId?: string;
  actorName?: string;
  errorName?: string;
  errorMessage?: string;
}

interface DomainEventInput {
  category: ObservabilityEventSummary["category"];
  action: string;
  severity?: AuditSeverity;
  detail: string;
  relatedType?: string;
  relatedId?: string;
}

const MAX_RECENT_REQUESTS = 60;
const MAX_ROUTE_DURATIONS = 50;
const MAX_EVENTS = 40;
const MAX_TOP_ROUTES = 12;

function shouldSkipPath(path: string) {
  return path.startsWith("/api/v1/health") || path.startsWith("/api/v1/admin/observability");
}

function computeP95(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
  return Math.round(sorted[index] * 10) / 10;
}

function normalizeSeverity(statusCode: number): AuditSeverity {
  if (statusCode >= 500) {
    return "error";
  }

  if (statusCode >= 400) {
    return "warning";
  }

  return "info";
}

function writeStructuredLog(entry: Record<string, unknown>) {
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

@Injectable()
export class ObservabilityService {
  private readonly recentRequests: ObservabilityRequestSummary[] = [];

  private readonly routeMetrics = new Map<string, RouteMetricRecord>();

  private readonly events: ObservabilityEventSummary[] = [];

  private totalRequests = 0;

  private successRequests = 0;

  private clientErrorRequests = 0;

  private serverErrorRequests = 0;

  private lastRequestAt: string | undefined;

  constructor(private readonly bullMqService: BullMqService) {}

  recordHttpRequest(input: HttpRequestInput) {
    if (shouldSkipPath(input.path)) {
      return;
    }

    const request: ObservabilityRequestSummary = {
      id: randomUUID(),
      requestId: input.requestId,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      occurredAt: input.occurredAt,
      actorUserId: input.actorUserId,
      actorName: input.actorName
    };

    this.recentRequests.unshift(request);
    this.recentRequests.splice(MAX_RECENT_REQUESTS);
    this.updateRouteMetric(request);
    this.totalRequests += 1;
    this.lastRequestAt = request.occurredAt;

    if (request.statusCode >= 500) {
      this.serverErrorRequests += 1;
    } else if (request.statusCode >= 400) {
      this.clientErrorRequests += 1;
    } else {
      this.successRequests += 1;
    }

    writeStructuredLog({
      timestamp: input.occurredAt,
      service: "huelegood-api",
      category: "http",
      event: "http.request.completed",
      severity: normalizeSeverity(input.statusCode),
      requestId: input.requestId,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      durationMs: input.durationMs,
      actorUserId: input.actorUserId,
      actorName: input.actorName,
      errorName: input.errorName,
      errorMessage: input.errorMessage
    });
  }

  recordDomainEvent(input: DomainEventInput) {
    const event: ObservabilityEventSummary = {
      id: randomUUID(),
      category: input.category,
      action: input.action,
      severity: input.severity ?? "info",
      detail: input.detail,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      occurredAt: new Date().toISOString()
    };

    this.events.unshift(event);
    this.events.splice(MAX_EVENTS);

    writeStructuredLog({
      timestamp: event.occurredAt,
      service: "huelegood-api",
      category: event.category,
      event: event.action,
      severity: event.severity,
      detail: event.detail,
      relatedType: event.relatedType,
      relatedId: event.relatedId
    });
  }

  async getOverview() {
    const summary: ObservabilityOverviewSummary = {
      service: "huelegood-api",
      generatedAt: new Date().toISOString(),
      requestIdHeader: "X-Request-Id",
      requests: this.buildRequestSummary(),
      recentRequests: [...this.recentRequests],
      topRoutes: this.buildTopRoutes(),
      events: [...this.events],
      queues: await this.bullMqService.getQueueSummaries()
    };

    return wrapResponse(summary, {
      recentRequests: summary.recentRequests.length,
      events: summary.events.length,
      queues: summary.queues.length
    });
  }

  private updateRouteMetric(request: ObservabilityRequestSummary) {
    const key = `${request.method} ${request.path}`;
    const existing = this.routeMetrics.get(key) ?? {
      key,
      method: request.method,
      path: request.path,
      totalRequests: 0,
      clientErrorRequests: 0,
      serverErrorRequests: 0,
      totalDurationMs: 0,
      maxDurationMs: 0,
      lastRequestAt: undefined,
      durations: []
    };

    existing.totalRequests += 1;
    existing.totalDurationMs += request.durationMs;
    existing.maxDurationMs = Math.max(existing.maxDurationMs, request.durationMs);
    existing.lastRequestAt = request.occurredAt;
    existing.durations.push(request.durationMs);
    if (existing.durations.length > MAX_ROUTE_DURATIONS) {
      existing.durations.shift();
    }

    if (request.statusCode >= 500) {
      existing.serverErrorRequests += 1;
    } else if (request.statusCode >= 400) {
      existing.clientErrorRequests += 1;
    }

    this.routeMetrics.set(key, existing);
  }

  private buildRequestSummary() {
    const telemetry = getSecurityTelemetry();
    const durations = this.recentRequests.map((request) => request.durationMs);
    const averageDurationMs =
      durations.length > 0 ? Math.round((durations.reduce((sum, value) => sum + value, 0) / durations.length) * 10) / 10 : 0;

    return {
      totalRequests: this.totalRequests,
      successRequests: this.successRequests,
      clientErrorRequests: this.clientErrorRequests,
      serverErrorRequests: this.serverErrorRequests,
      blockedRequests: telemetry.blockedRequests,
      averageDurationMs,
      p95DurationMs: computeP95(durations),
      lastRequestAt: this.lastRequestAt ?? telemetry.lastRequestAt
    };
  }

  private buildTopRoutes(): ObservabilityRouteMetricSummary[] {
    return Array.from(this.routeMetrics.values())
      .sort((left, right) => {
        if (right.totalRequests !== left.totalRequests) {
          return right.totalRequests - left.totalRequests;
        }

        return (right.lastRequestAt ?? "").localeCompare(left.lastRequestAt ?? "");
      })
      .slice(0, MAX_TOP_ROUTES)
      .map((metric) => ({
        key: metric.key,
        method: metric.method,
        path: metric.path,
        totalRequests: metric.totalRequests,
        clientErrorRequests: metric.clientErrorRequests,
        serverErrorRequests: metric.serverErrorRequests,
        averageDurationMs: Math.round((metric.totalDurationMs / metric.totalRequests) * 10) / 10,
        p95DurationMs: computeP95(metric.durations),
        maxDurationMs: metric.maxDurationMs,
        lastRequestAt: metric.lastRequestAt
      }));
  }
}
