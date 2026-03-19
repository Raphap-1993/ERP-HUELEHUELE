import { Body, Controller, Get, Post } from "@nestjs/common";
import { vendorApplications, type VendorApplicationItem } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { VendorsService, type VendorApplicationInput } from "./vendors.service";

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
  @Get()
  list() {
    return wrapResponse<VendorApplicationItem[]>(vendorApplications);
  }
}
