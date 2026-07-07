import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import {
  adminModulePermissions,
  type AdminVendorCreateInput,
  type AdminVendorUpdateInput,
  type VendorApplicationActionInput,
  type VendorApplicationInput
} from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { VendorsService } from "./vendors.service";

@Controller("store/vendor-applications")
export class VendorApplicationsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  submit(@Body() body: VendorApplicationInput) {
    return this.vendorsService.submitApplication(body);
  }
}

@RequirePermissions(...adminModulePermissions.vendors.read)
@Controller("admin/vendor-applications")
export class AdminVendorApplicationsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  list() {
    return this.vendorsService.listApplications();
  }

  @Post(":id/screen")
  @RequirePermissions(...adminModulePermissions.vendors.manage!)
  screen(@Param("id") id: string, @Body() body: VendorApplicationActionInput) {
    return this.vendorsService.screenApplication(id, body);
  }

  @Post(":id/approve")
  @RequirePermissions(...adminModulePermissions.vendors.manage!)
  approve(@Param("id") id: string, @Body() body: VendorApplicationActionInput) {
    return this.vendorsService.approveApplication(id, body);
  }

  @Post(":id/reject")
  @RequirePermissions(...adminModulePermissions.vendors.manage!)
  reject(@Param("id") id: string, @Body() body: VendorApplicationActionInput) {
    return this.vendorsService.rejectApplication(id, body);
  }
}

@RequirePermissions(...adminModulePermissions.vendors.read)
@Controller("admin/vendors")
export class AdminVendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  list() {
    return this.vendorsService.listVendors();
  }

  @Post()
  @RequirePermissions(...adminModulePermissions.vendors.manage!)
  create(@Body() body: AdminVendorCreateInput) {
    return this.vendorsService.createManualVendor(body);
  }

  @Patch(":id")
  @RequirePermissions(...adminModulePermissions.vendors.manage!)
  update(@Param("id") id: string, @Body() body: AdminVendorUpdateInput) {
    return this.vendorsService.updateVendor(id, body);
  }

  @Delete(":id")
  @RequirePermissions(...adminModulePermissions.vendors.manage!)
  remove(@Param("id") id: string) {
    return this.vendorsService.deleteVendor(id);
  }

  @Get("codes")
  listCodes() {
    return this.vendorsService.listVendorCodes();
  }
}
