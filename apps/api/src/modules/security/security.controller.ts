import { Controller, Get } from "@nestjs/common";
import { RoleCode } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { SecurityService } from "./security.service";

@RequireRoles(RoleCode.SuperAdmin, RoleCode.Admin)
@Controller("admin/security")
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  posture() {
    return this.securityService.getPosture();
  }
}
