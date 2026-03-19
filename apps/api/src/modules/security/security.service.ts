import { Injectable } from "@nestjs/common";
import { type SecurityPostureSummary } from "@huelegood/shared";
import { isConfigured } from "../../common/env";
import { getSecurityHeaders, getSecurityRateLimits, getSecurityTelemetry } from "../../common/security";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class SecurityService {
  constructor(private readonly auditService: AuditService) {}

  getPosture() {
    const telemetry = getSecurityTelemetry();
    const auditOverview = this.auditService.getOverview().data;
    const summary: SecurityPostureSummary = {
      service: "huelegood-api",
      cors: {
        enabled: true,
        credentials: true,
        originMode: "reflective",
        exposedHeaders: ["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
      },
      trustProxy: true,
      requestIdHeader: "X-Request-Id",
      headers: getSecurityHeaders(),
      rateLimits: getSecurityRateLimits(),
      authPolicy: {
        sessionTtlHours: 24 * 7,
        passwordMinLength: 6,
        demoAccounts: true,
        bearerTokens: true
      },
      auditPolicy: {
        persistence: isConfigured(process.env.DATABASE_URL) ? "prisma" : "memory",
        lastAuditAt: auditOverview.logs[0]?.occurredAt,
        lastActionAt: auditOverview.actions[0]?.occurredAt
      },
      telemetry: {
        totalRequests: telemetry.totalRequests,
        blockedRequests: telemetry.blockedRequests,
        lastRequestAt: telemetry.lastRequestAt,
        lastBlockedAt: telemetry.lastBlockedAt
      },
      updatedAt: new Date().toISOString()
    };

    return summary;
  }
}
