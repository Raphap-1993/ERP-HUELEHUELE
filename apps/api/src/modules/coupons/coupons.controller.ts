import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { adminModulePermissions, type CouponInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { CouponsService } from "./coupons.service";

@RequirePermissions(...adminModulePermissions.coupons.read)
@Controller("admin/coupons")
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  list() {
    return this.couponsService.listCoupons();
  }

  @Get(":code")
  get(@Param("code") code: string) {
    return this.couponsService.getCoupon(code);
  }

  @Post()
  @RequirePermissions(...adminModulePermissions.coupons.manage!)
  create(@Body() input: CouponInput) {
    return this.couponsService.createCoupon(input);
  }

  @Patch(":code")
  @RequirePermissions(...adminModulePermissions.coupons.manage!)
  update(@Param("code") code: string, @Body() input: Partial<CouponInput>) {
    return this.couponsService.updateCoupon(code, input);
  }

  @Delete(":code")
  @RequirePermissions(...adminModulePermissions.coupons.manage!)
  remove(@Param("code") code: string) {
    return this.couponsService.deleteCoupon(code);
  }
}
