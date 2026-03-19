import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { type VendorApplicationActionInput, type VendorApplicationInput } from "@huelegood/shared";
import { VendorsService } from "./vendors.service";

@Controller("store/vendor-applications")
export class VendorApplicationsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  submit(@Body() body: VendorApplicationInput) {
    return this.vendorsService.submitApplication(body);
  }
}

@Controller("admin/vendor-applications")
export class AdminVendorApplicationsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  list() {
    return this.vendorsService.listApplications();
  }

  @Post(":id/approve")
  approve(@Param("id") id: string, @Body() body: VendorApplicationActionInput) {
    return this.vendorsService.approveApplication(id, body);
  }

  @Post(":id/reject")
  reject(@Param("id") id: string, @Body() body: VendorApplicationActionInput) {
    return this.vendorsService.rejectApplication(id, body);
  }
}

@Controller("admin/vendors")
export class AdminVendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  list() {
    return this.vendorsService.listVendors();
  }

  @Get("codes")
  listCodes() {
    return this.vendorsService.listVendorCodes();
  }
}
