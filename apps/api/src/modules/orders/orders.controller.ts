import { Controller, Get, Param } from "@nestjs/common";
import { adminAccessRoles } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { OrdersService } from "./orders.service";

@RequireRoles(...adminAccessRoles.orders)
@Controller("admin/orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  listOrders() {
    return this.ordersService.listOrders();
  }

  @Get(":orderNumber")
  getOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.getOrder(orderNumber);
  }
}
