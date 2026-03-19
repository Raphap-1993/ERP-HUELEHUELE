import { Controller, Get } from "@nestjs/common";
import { commissionRows } from "@huelegood/shared";
import { CommissionsService } from "./commissions.service";

@Controller("admin/commissions")
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  list() {
    return this.commissionsService.listCommissions();
  }
}

