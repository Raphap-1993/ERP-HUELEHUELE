import { Controller, Get } from "@nestjs/common";
import { adminAccessRoles } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { OrdersService } from "./orders.service";

@RequireRoles(...adminAccessRoles.dispatch)
@Controller("admin/dispatch")
export class DispatchController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("orders")
  listDispatchOrders() {
    return this.ordersService.listDispatchOrders();
  }
}
