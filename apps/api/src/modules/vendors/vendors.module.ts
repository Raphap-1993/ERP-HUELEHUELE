import { Module } from "@nestjs/common";
import { AdminVendorApplicationsController, VendorApplicationsController } from "./vendor-applications.controller";
import { VendorsService } from "./vendors.service";

@Module({
  controllers: [VendorApplicationsController, AdminVendorApplicationsController],
  providers: [VendorsService],
  exports: [VendorsService]
})
export class VendorsModule {}

