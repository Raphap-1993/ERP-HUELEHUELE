import { Controller, Get } from "@nestjs/common";
import { SecurityService } from "./security.service";

@Controller("admin/security")
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  posture() {
    return this.securityService.getPosture();
  }
}
