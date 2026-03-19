import { Controller, Get } from "@nestjs/common";
import { adminAccessRoles } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { ObservabilityService } from "./observability.service";

@RequireRoles(...adminAccessRoles.observability)
@Controller("admin/observability")
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get()
  getOverview() {
    return this.observabilityService.getOverview();
  }
}
