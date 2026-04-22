import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AdminCommercialAccessesController, AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [AuditModule],
  controllers: [AuthController, AdminCommercialAccessesController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule {}
