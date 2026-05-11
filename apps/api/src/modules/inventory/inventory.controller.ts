import { Body, Controller, Get, Post } from "@nestjs/common";
import { adminAccessRoles, type InventoryStockAdjustmentInput, type InventoryStockBulkInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { InventoryService } from "./inventory.service";

@RequireRoles(...adminAccessRoles.inventory)
@Controller("admin/inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("report")
  getReport() {
    return this.inventoryService.getAdminReport();
  }

  @Post("stock-adjustments")
  adjustStock(@Body() body: InventoryStockAdjustmentInput) {
    return this.inventoryService.adjustWarehouseStock(body);
  }

  @Post("stock-adjustments/bulk")
  adjustStockBulk(@Body() body: InventoryStockBulkInput) {
    return this.inventoryService.adjustWarehouseStockBulk(body);
  }
}
