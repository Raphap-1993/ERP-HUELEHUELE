import { Controller, Get } from "@nestjs/common";
import { AuditService } from "./audit.service";

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
