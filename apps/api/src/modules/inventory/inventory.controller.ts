import { Body, Controller, Get, Post } from "@nestjs/common";
import { adminAccessRoles, type InventoryStockAdjustmentInput } from "@huelegood/shared";
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
}
