import { Controller, Get } from "@nestjs/common";
import { adminModulePermissions } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { AuditService } from "./audit.service";

@RequirePermissions(...adminModulePermissions.audit.read)
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
