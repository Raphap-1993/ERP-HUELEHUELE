import { Controller, Get, Req } from "@nestjs/common";
import { adminModulePermissions, type AuthSessionSummary } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { CoreService } from "./core.service";

interface AuthenticatedRequest {
  authUser?: AuthSessionSummary["user"];
}

@RequirePermissions(...adminModulePermissions.dashboard.read)
@Controller("admin/dashboard")
export class DashboardController {
  constructor(private readonly coreService: CoreService) {}

  @Get("overview")
  overview(@Req() request: AuthenticatedRequest) {
    return this.coreService.getOverviewForUser(request.authUser!);
  }
}
