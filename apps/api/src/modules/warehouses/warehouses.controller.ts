import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { adminModulePermissions, type WarehouseUpsertInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { WarehousesService } from "./warehouses.service";

@RequirePermissions(...adminModulePermissions.warehouses.read)
@Controller("admin/warehouses")
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  listWarehouses() {
    return this.warehousesService.listWarehouses();
  }

  @Get(":id")
  async getWarehouse(@Param("id") id: string) {
    const warehouse = await this.warehousesService.getWarehouse(id);
    if (!warehouse) {
      throw new NotFoundException(`Almacén no encontrado: ${id}`);
    }

    return warehouse;
  }

  @Post()
  @RequirePermissions(...adminModulePermissions.warehouses.manage!)
  createWarehouse(@Body() body: WarehouseUpsertInput) {
    return this.warehousesService.createWarehouse(body);
  }

  @Patch(":id")
  @RequirePermissions(...adminModulePermissions.warehouses.manage!)
  patchWarehouse(@Param("id") id: string, @Body() body: Partial<WarehouseUpsertInput>) {
    return this.warehousesService.patchWarehouse(id, body);
  }

  @Delete(":id")
  @RequirePermissions(...adminModulePermissions.warehouses.manage!)
  deleteWarehouse(@Param("id") id: string) {
    return this.warehousesService.deleteWarehouse(id);
  }
}
