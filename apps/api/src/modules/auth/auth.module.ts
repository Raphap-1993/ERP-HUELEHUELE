import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AccessControlService } from "./access-control.service";
import { AdminCommercialAccessesController, AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [AuditModule],
  controllers: [AuthController, AdminCommercialAccessesController],
  providers: [AuthService, AccessControlService],
  exports: [AuthService, AccessControlService]
})
export class AuthModule {}
