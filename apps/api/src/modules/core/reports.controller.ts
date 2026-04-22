import { BadRequestException, Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { adminAccessRoles, type AdminReportFiltersInput, type SalesChannelValue } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { CoreService } from "./core.service";

function normalizeSalesChannelFilter(value?: string): SalesChannelValue | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === "web" || normalized === "manual") {
    return normalized;
  }

  throw new BadRequestException("salesChannel inválido. Usa 'web' o 'manual'.");
}

function buildReportFilters(input: {
  salesChannel?: string;
  vendorCode?: string;
  productSlug?: string;
  sku?: string;
}): AdminReportFiltersInput {
  return {
    salesChannel: normalizeSalesChannelFilter(input.salesChannel),
    vendorCode: input.vendorCode,
    productSlug: input.productSlug,
    sku: input.sku
  };
}

@RequireRoles(...adminAccessRoles.dashboard)
@Controller("admin/reports")
export class ReportsController {
  constructor(private readonly coreService: CoreService) {}

  @Get()
  getReport(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("salesChannel") salesChannel?: string,
    @Query("vendorCode") vendorCode?: string,
    @Query("productSlug") productSlug?: string,
    @Query("sku") sku?: string
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return this.coreService.getReportByPeriod(
      from ?? defaultFrom,
      to ?? today,
      buildReportFilters({ salesChannel, vendorCode, productSlug, sku })
    );
  }

  @Get("export")
  exportCsv(
    @Res() res: Response,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("salesChannel") salesChannel?: string,
    @Query("vendorCode") vendorCode?: string,
    @Query("productSlug") productSlug?: string,
    @Query("sku") sku?: string
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const f = from ?? defaultFrom;
    const t = to ?? today;
    const csv = this.coreService.generateOrdersCsv(f, t, buildReportFilters({ salesChannel, vendorCode, productSlug, sku }));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="reporte-${f}-${t}.csv"`);
    res.send(csv);
  }
}
