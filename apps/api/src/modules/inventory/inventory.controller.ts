import { Controller, Get } from "@nestjs/common";
import { adminAccessRoles } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { InventoryService } from "./inventory.service";

@RequireRoles(...adminAccessRoles.products)
@Controller("admin/inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("report")
  getReport() {
    return this.inventoryService.getAdminReport();
  }
}
