import { Controller, Get, Req } from "@nestjs/common";
import { RoleCode, type AuthSessionSummary } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { CoreService } from "./core.service";

interface AuthenticatedRequest {
  authUser?: AuthSessionSummary["user"];
}

@RequireRoles(RoleCode.Vendedor, RoleCode.SellerManager)
@Controller("seller/panel")
export class SellerPanelController {
  constructor(private readonly coreService: CoreService) {}

  @Get("overview")
  overview(@Req() request: AuthenticatedRequest) {
    return this.coreService.getSellerPanelOverview(request.authUser!);
  }
}
