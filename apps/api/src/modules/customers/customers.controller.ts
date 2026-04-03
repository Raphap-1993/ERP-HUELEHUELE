import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from "@nestjs/common";
import { adminAccessRoles, type CustomerUpsertInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { CustomersService } from "./customers.service";

@RequireRoles(...adminAccessRoles.crm)
@Controller("admin/customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  listCustomers() {
    return this.customersService.listCustomers();
  }

  @Get(":id")
  async getCustomer(@Param("id") id: string) {
    const customer = await this.customersService.getCustomer(id);
    if (!customer) {
      throw new NotFoundException(`Cliente no encontrado: ${id}`);
    }

    return { data: customer };
  }

  @Post()
  createCustomer(@Body() body: CustomerUpsertInput) {
    return this.customersService.createCustomer(body);
  }

  @Patch(":id")
  updateCustomer(@Param("id") id: string, @Body() body: CustomerUpsertInput) {
    return this.customersService.updateCustomer(id, body);
  }

  @Delete(":id")
  deleteCustomer(@Param("id") id: string) {
    return this.customersService.deleteCustomer(id);
  }
}
