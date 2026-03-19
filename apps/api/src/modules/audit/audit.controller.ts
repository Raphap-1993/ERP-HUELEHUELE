import { Controller, Get } from "@nestjs/common";
import { adminAccessRoles } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { AuditService } from "./audit.service";

@RequireRoles(...adminAccessRoles.audit)
@Controller("admin/audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  overview() {
    return this.auditService.getOverview();
  }

  @Get("logs")
  logs() {
    return this.auditService.listLogs();
  }

  @Get("actions")
  actions() {
    return this.auditService.listActions();
  }
}
