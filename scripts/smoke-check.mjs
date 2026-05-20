#!/usr/bin/env node

const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 10000);

const checks = [
  {
    name: "web",
    url: process.env.WEB_HEALTH_URL || "http://127.0.0.1:3000/health",
    expectedStatus: "ok"
  },
  {
    name: "web-render",
    url: process.env.WEB_RENDER_URL || "http://127.0.0.1:3000/",
    expectedContentType: "text/html"
  },
  {
    name: "admin",
    url: process.env.ADMIN_HEALTH_URL || "http://127.0.0.1:3005/health",
    expectedStatus: "ok"
  },
  {
    name: "api-liveness",
    url: process.env.API_HEALTH_URL || "http://127.0.0.1:4000/api/v1/health/liveness",
    expectedStatus: "ok"
  },
  {
    name: "api-readiness",
    url: process.env.API_READINESS_URL || "http://127.0.0.1:4000/api/v1/health/readiness",
    expectedStatus: "ok"
  },
  {
    name: "api-operational",
    url: process.env.API_OPERATIONAL_URL || "http://127.0.0.1:4000/api/v1/health/operational",
    expectedStatus: "ok",
    allowedStatuses: ["degraded"]
  }
];

function resultLog(level, event, payload) {
  process.stdout.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      event,
      ...payload
    })}\n`
  );
}

async function runCheck(check) {
  const startedAt = Date.now();
  const response = await fetch(check.url, {
    signal: AbortSignal.timeout(timeoutMs)
  });
  const contentType = response.headers.get("content-type") || "";

  let body = null;
  if (check.expectedStatus) {
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  }

  const durationMs = Date.now() - startedAt;
  const status = body && typeof body === "object" && "status" in body ? body.status : null;
  const allowedStatuses = [check.expectedStatus, ...(check.allowedStatuses || [])];
  const htmlOk = check.expectedContentType
    ? contentType.includes(check.expectedContentType)
    : true;
  const statusOk = check.expectedStatus
    ? status !== null && allowedStatuses.includes(status)
    : true;
  const ok = response.ok && htmlOk && statusOk;

  if (!ok) {
    throw new Error(
      `check_failed:${check.name}:http_${response.status}:status_${String(status ?? "unknown")}:content_type_${contentType || "unknown"}`
    );
  }

  resultLog("info", "smoke.check.passed", {
    name: check.name,
    url: check.url,
    httpStatus: response.status,
    status,
    contentType,
    durationMs
  });
}

async function main() {
  for (const check of checks) {
    await runCheck(check);
  }

  resultLog("info", "smoke.completed", {
    checks: checks.map((check) => check.name)
  });
}

main().catch((error) => {
  resultLog("error", "smoke.failed", {
    message: error instanceof Error ? error.message : "unknown_error"
  });
  process.exit(1);
});
