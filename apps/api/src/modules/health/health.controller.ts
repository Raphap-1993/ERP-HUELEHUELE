import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("liveness")
  liveness() {
    return this.healthService.getLiveness();
  }

  @Get("live")
  live() {
    return this.healthService.getLiveness();
  }

  @Get("readiness")
  readiness() {
    return this.healthService.getReadiness();
  }

  @Get("ready")
  ready() {
    return this.healthService.getReadiness();
  }

  @Get("operational")
  operational() {
    return this.healthService.getOperational();
  }
}
