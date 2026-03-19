import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getPort } from "./common/env";
import { createRateLimitMiddleware, createSecurityHeadersMiddleware } from "./common/security";

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

  console.log(`Huelegood API listening on port ${port}`);
}

bootstrap();
