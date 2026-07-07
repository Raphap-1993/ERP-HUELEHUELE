import { Body, Controller, Get, Post } from "@nestjs/common";
import { adminModulePermissions, type InventoryStockAdjustmentInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { InventoryService } from "./inventory.service";

@RequirePermissions(...adminModulePermissions.inventory.read)
@Controller("admin/inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("report")
  getReport() {
    return this.inventoryService.getAdminReport();
  }

  @Post("stock-adjustments")
  @RequirePermissions(...adminModulePermissions.inventory.manage!)
  adjustStock(@Body() body: InventoryStockAdjustmentInput) {
    return this.inventoryService.adjustWarehouseStock(body);
  }
}
