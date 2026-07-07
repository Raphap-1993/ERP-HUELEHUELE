import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
  adminAccessRoles,
  type AdminVendorCreateInput,
  type AdminVendorUpdateInput,
  type VendorApplicationActionInput,
  type VendorApplicationInput
} from "@huelegood/shared";
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

  @Post(":id/screen")
  screen(@Param("id") id: string, @Body() body: VendorApplicationActionInput) {
    return this.vendorsService.screenApplication(id, body);
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

  @Post()
  create(@Body() body: AdminVendorCreateInput) {
    return this.vendorsService.createManualVendor(body);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: AdminVendorUpdateInput) {
    return this.vendorsService.updateVendor(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.vendorsService.deleteVendor(id);
  }

  @Get("codes")
  listCodes() {
    return this.vendorsService.listVendorCodes();
  }
}
