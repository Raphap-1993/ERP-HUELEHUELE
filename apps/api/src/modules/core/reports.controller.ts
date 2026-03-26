import { Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { adminAccessRoles } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { CoreService } from "./core.service";

@RequireRoles(...adminAccessRoles.dashboard)
@Controller("admin/reports")
export class ReportsController {
  constructor(private readonly coreService: CoreService) {}

  @Get()
  getReport(@Query("from") from?: string, @Query("to") to?: string) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return this.coreService.getReportByPeriod(from ?? defaultFrom, to ?? today);
  }

  @Get("export")
  exportCsv(@Res() res: Response, @Query("from") from?: string, @Query("to") to?: string) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const f = from ?? defaultFrom;
    const t = to ?? today;
    const csv = this.coreService.generateOrdersCsv(f, t);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="reporte-${f}-${t}.csv"`);
    res.send(csv);
  }
}
