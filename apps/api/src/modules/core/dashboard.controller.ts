import { Controller, Get } from "@nestjs/common";
import { adminAccessRoles } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { CoreService } from "./core.service";

@RequireRoles(...adminAccessRoles.dashboard)
@Controller("admin/dashboard")
export class DashboardController {
  constructor(private readonly coreService: CoreService) {}

  @Get("overview")
  overview() {
    return this.coreService.getOverview();
  }
}
