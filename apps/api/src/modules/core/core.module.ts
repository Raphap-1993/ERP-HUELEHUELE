import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { CoreService } from "./core.service";

@Module({
  controllers: [DashboardController],
  providers: [CoreService],
  exports: [CoreService]
})
export class CoreModule {}

