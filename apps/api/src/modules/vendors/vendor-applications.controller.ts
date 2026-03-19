import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { adminAccessRoles, type VendorApplicationActionInput, type VendorApplicationInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { VendorsService } from "./vendors.service";

@Controller("store/vendor-applications")
export class VendorApplicationsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  submit(@Body() body: VendorApplicationInput) {
    return this.vendorsService.submitApplication(body);
  }
}

@RequireRoles(...adminAccessRoles.vendors)
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

@RequireRoles(...adminAccessRoles.vendors)
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
