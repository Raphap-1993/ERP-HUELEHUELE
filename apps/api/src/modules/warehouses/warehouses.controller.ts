import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { adminAccessRoles, type WarehouseUpsertInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { WarehousesService } from "./warehouses.service";

@RequireRoles(...adminAccessRoles.warehouses)
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
  createWarehouse(@Body() body: WarehouseUpsertInput) {
    return this.warehousesService.createWarehouse(body);
  }

  @Patch(":id")
  patchWarehouse(@Param("id") id: string, @Body() body: Partial<WarehouseUpsertInput>) {
    return this.warehousesService.patchWarehouse(id, body);
  }

  @Delete(":id")
  deleteWarehouse(@Param("id") id: string) {
    return this.warehousesService.deleteWarehouse(id);
  }
}
