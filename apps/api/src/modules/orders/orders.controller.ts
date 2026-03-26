import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
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

  @Post()
  createBackofficeOrder(
    @Body() body: {
      customer: { firstName: string; lastName: string; email: string; phone: string };
      address: { line1: string; city: string; region?: string; countryCode?: string };
      items: Array<{ slug: string; name: string; sku: string; variantId?: string; quantity: number; unitPrice: number }>;
      initialStatus: "paid" | "pending_payment";
      notes?: string;
      vendorCode?: string;
    }
  ) {
    return this.ordersService.createBackofficeOrder({ ...body, reviewer: "admin" });
  }

  @Get(":orderNumber")
  getOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.getOrder(orderNumber);
  }

  @Delete(":orderNumber")
  deleteOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.deleteOrder(orderNumber);
  }
}
