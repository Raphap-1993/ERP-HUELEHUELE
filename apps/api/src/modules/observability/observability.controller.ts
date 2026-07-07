import { Controller, Get } from "@nestjs/common";
import { adminModulePermissions } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { ObservabilityService } from "./observability.service";

@RequirePermissions(...adminModulePermissions.observability.read)
@Controller("admin/observability")
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get()
  getOverview() {
    return this.observabilityService.getOverview();
  }
}
