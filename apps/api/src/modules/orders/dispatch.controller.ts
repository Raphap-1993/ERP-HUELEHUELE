import { Controller, Get } from "@nestjs/common";
import { adminModulePermissions } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { OrdersService } from "./orders.service";

@RequirePermissions(...adminModulePermissions.dispatch.read)
@Controller("admin/dispatch")
export class DispatchController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("orders")
  listDispatchOrders() {
    return this.ordersService.listDispatchOrders();
  }
}
