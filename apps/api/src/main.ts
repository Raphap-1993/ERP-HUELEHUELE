import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { getPort } from "./common/env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"]
  });

  app.enableCors({
    origin: true,
    credentials: true
  });
  app.setGlobalPrefix("api/v1");

  const port = getPort(4000);
  await app.listen(port);

  console.log(`Huelegood API listening on port ${port}`);
}

bootstrap();

