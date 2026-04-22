import { Module } from "@nestjs/common";
import { PeruUbigeoService } from "../commerce/peru-ubigeo.service";
import { WarehousesController } from "./warehouses.controller";
import { WarehousesService } from "./warehouses.service";

@Module({
  controllers: [WarehousesController],
  providers: [WarehousesService, PeruUbigeoService],
  exports: [WarehousesService]
})
export class WarehousesModule {}
