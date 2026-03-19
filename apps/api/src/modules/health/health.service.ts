import { Injectable } from "@nestjs/common";
import { isConfigured } from "../../common/env";

@Injectable()
export class HealthService {
  getLiveness() {
    return {
      status: "ok",
      service: "huelegood-api",
      timestamp: new Date().toISOString()
    };
  }

  getReadiness() {
    return {
      status: "ok",
      dependencies: {
        database: isConfigured(process.env.DATABASE_URL) ? "configured" : "missing",
        redis: isConfigured(process.env.REDIS_URL) ? "configured" : "missing"
      },
      timestamp: new Date().toISOString()
    };
  }
}

