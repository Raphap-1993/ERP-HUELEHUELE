import "reflect-metadata";
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";

function loadWorkspaceEnv() {
  const visited = new Set<string>();
  let currentDir = process.cwd();

  while (!visited.has(currentDir)) {
    visited.add(currentDir);

    for (const fileName of [".env.local", ".env"]) {
      const filePath = path.join(currentDir, fileName);

      if (fs.existsSync(filePath)) {
        dotenv.config({ path: filePath, override: false });
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }
}

loadWorkspaceEnv();
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getPort } from "./common/env";
import { createRateLimitMiddleware, createSecurityHeadersMiddleware } from "./common/security";

function writeStructuredLog(event: string, payload: Record<string, unknown>) {
  process.stdout.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      service: "huelegood-api",
      event,
      ...payload
    })}\n`
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"]
  });

  const expressApp = app.getHttpAdapter().getInstance() as {
    disable(name: string): void;
    set(name: string, value: unknown): void;
  };
  expressApp.disable("x-powered-by");
  expressApp.set("trust proxy", 1);
  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ["X-Request-Id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
  });
  app.use(createSecurityHeadersMiddleware());
  app.use(createRateLimitMiddleware());
  app.setGlobalPrefix("api/v1");

  const port = getPort(4000);
  await app.listen(port);

  writeStructuredLog("service.started", {
    port,
    environment: process.env.NODE_ENV || "development"
  });
}

bootstrap();
