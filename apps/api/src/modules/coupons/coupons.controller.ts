import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { adminAccessRoles, type CouponInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { CouponsService } from "./coupons.service";

@RequireRoles(...adminAccessRoles.coupons)
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
  create(@Body() input: CouponInput) {
    return this.couponsService.createCoupon(input);
  }

  @Patch(":code")
  update(@Param("code") code: string, @Body() input: Partial<CouponInput>) {
    return this.couponsService.updateCoupon(code, input);
  }

  @Delete(":code")
  remove(@Param("code") code: string) {
    return this.couponsService.deleteCoupon(code);
  }
}
