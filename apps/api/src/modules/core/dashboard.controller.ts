import { Controller, Get } from "@nestjs/common";
import { CoreService } from "./core.service";

@Controller("admin/dashboard")
export class DashboardController {
  constructor(private readonly coreService: CoreService) {}

  @Get("overview")
  overview() {
    return this.coreService.getOverview();
  }
}

